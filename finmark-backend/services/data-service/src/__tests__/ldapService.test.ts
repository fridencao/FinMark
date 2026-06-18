import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { SearchEntry } from 'ldapjs';

const {
  mockBind,
  mockSearch,
  mockUnbind,
  mockLdapOn,
  mockCreateClient,
  mockPrisma,
} = vi.hoisted(() => {
  const mockBind = vi.fn();
  const mockSearch = vi.fn();
  const mockUnbind = vi.fn();
  const mockLdapOn = vi.fn();
  const mockCreateClient = vi.fn(() => ({
    bind: mockBind,
    search: mockSearch,
    unbind: mockUnbind,
    on: mockLdapOn,
  }));
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  };
  return { mockBind, mockSearch, mockUnbind, mockLdapOn, mockCreateClient, mockPrisma };
});

vi.mock('ldapjs', () => ({
  default: { createClient: mockCreateClient },
  createClient: mockCreateClient,
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

import {
  authenticate,
  getUserInfo,
  mapLdapUser,
  syncUser,
} from '../services/ldapService.js';
import { prisma } from '../config/database.js';

function createMockSearchEntry(attrs: Record<string, string>) {
  return {
    object: attrs,
    pojo: attrs,
    attributes: Object.entries(attrs).map(([type, vals]) => ({
      type,
      values: [vals],
      _vals: [vals],
    })),
  };
}

describe('LdapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLdapOn.mockReset();
    process.env.LDAP_URL = 'ldap://test.local';
    process.env.LDAP_BIND_DN = 'cn=admin,dc=test,dc=local';
    process.env.LDAP_BIND_PASSWORD = 'admin-pass';
    process.env.LDAP_SEARCH_BASE = 'ou=users,dc=test,dc=local';
    process.env.LDAP_SEARCH_FILTER = '(uid={{username}})';
  });

  afterEach(() => {
    delete process.env.LDAP_URL;
    delete process.env.LDAP_BIND_DN;
    delete process.env.LDAP_BIND_PASSWORD;
    delete process.env.LDAP_SEARCH_BASE;
    delete process.env.LDAP_SEARCH_FILTER;
  });

  describe('authenticate', () => {
    it('should return true when LDAP bind succeeds', async () => {
      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => {
        cb(null);
      });
      mockUnbind.mockImplementation((cb: Function) => cb(null));

      const result = await authenticate('testuser', 'testpass');

      expect(result).toBe(true);
      expect(mockBind).toHaveBeenCalledWith(
        'uid=testuser,ou=users,dc=test,dc=local',
        'testpass',
        expect.any(Function)
      );
    });

    it('should return false when LDAP bind fails with invalid credentials', async () => {
      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => {
        const err = new Error('Invalid credentials');
        (err as any).code = 49;
        cb(err);
      });

      const result = await authenticate('testuser', 'wrongpass');

      expect(result).toBe(false);
    });

    it('should throw on connection error', async () => {
      mockLdapOn.mockImplementation((event: string, handler: Function) => {
        if (event === 'error') {
          handler(new Error('Connection refused'));
        }
      });

      await expect(authenticate('testuser', 'testpass')).rejects.toThrow(
        'LDAP connection error'
      );
    });

    it('should throw when LDAP URL is not configured', async () => {
      delete process.env.LDAP_URL;

      await expect(authenticate('testuser', 'testpass')).rejects.toThrow(
        'LDAP_URL not configured'
      );
    });

    it('should use default search filter when not configured', async () => {
      delete process.env.LDAP_SEARCH_FILTER;
      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => {
        cb(null);
      });
      mockUnbind.mockImplementation((cb: Function) => cb(null));

      await authenticate('testuser', 'testpass');

      expect(mockBind).toHaveBeenCalledWith(
        'uid=testuser,ou=users,dc=test,dc=local',
        'testpass',
        expect.any(Function)
      );
    });
  });

  describe('getUserInfo', () => {
    it('should return mapped user info when found in LDAP', async () => {
      const ldapEntry = createMockSearchEntry({
        uid: 'testuser',
        mail: 'test@example.com',
        cn: 'Test User',
        memberOf: 'cn=admins,ou=groups,dc=test,dc=local',
      });

      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => cb(null));
      mockUnbind.mockImplementation((cb: Function) => cb(null));

      const mockSearchClient = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'searchEntry') handler(ldapEntry);
          if (event === 'end') handler({ messageId: 1 });
          return mockSearchClient;
        }),
      };
      mockSearch.mockReturnValue(mockSearchClient);

      const result = await getUserInfo('testuser');

      expect(result).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        groups: ['cn=admins,ou=groups,dc=test,dc=local'],
      });
    });

    it('should return null when user is not found', async () => {
      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => cb(null));
      mockUnbind.mockImplementation((cb: Function) => cb(null));

      const mockSearchClient = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'end') handler({ messageId: 1 });
          return mockSearchClient;
        }),
      };
      mockSearch.mockReturnValue(mockSearchClient);

      const result = await getUserInfo('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw on search error', async () => {
      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => cb(null));
      mockUnbind.mockImplementation((cb: Function) => cb(null));

      const mockSearchClient = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'error') handler(new Error('Search failed'));
          return mockSearchClient;
        }),
      };
      mockSearch.mockReturnValue(mockSearchClient);

      await expect(getUserInfo('testuser')).rejects.toThrow('LDAP search failed');
    });

    it('should handle entry with multiple memberOf values', async () => {
      const ldapEntry = {
        object: {
          uid: 'testuser',
          mail: 'test@example.com',
          cn: 'Test User',
        },
        attributes: [
          { type: 'memberOf', values: ['cn=admins,dc=test', 'cn=users,dc=test'] },
        ],
      };

      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => cb(null));
      mockUnbind.mockImplementation((cb: Function) => cb(null));

      const mockSearchClient = {
        on: vi.fn((event: string, handler: Function) => {
          if (event === 'searchEntry') handler(ldapEntry);
          if (event === 'end') handler({ messageId: 1 });
          return mockSearchClient;
        }),
      };
      mockSearch.mockReturnValue(mockSearchClient);

      const result = await getUserInfo('testuser');

      expect(result?.groups).toEqual(['cn=admins,dc=test', 'cn=users,dc=test']);
    });
  });

  describe('mapLdapUser', () => {
    it('should map LDAP entry attributes to LdapUser format', () => {
      const entry = createMockSearchEntry({
        uid: 'jdoe',
        mail: 'jdoe@company.com',
        cn: 'John Doe',
        memberOf: 'cn=users,dc=company,dc=com',
      });

      const result = mapLdapUser(entry as unknown as SearchEntry);

      expect(result).toEqual({
        username: 'jdoe',
        email: 'jdoe@company.com',
        name: 'John Doe',
        groups: ['cn=users,dc=company,dc=com'],
      });
    });

    it('should handle missing optional fields with defaults', () => {
      const entry = createMockSearchEntry({
        uid: 'minimal',
      });

      const result = mapLdapUser(entry as unknown as SearchEntry);

      expect(result.username).toBe('minimal');
      expect(result.email).toBe('');
      expect(result.name).toBe('minimal');
      expect(result.groups).toEqual([]);
    });

    it('should handle memberOf as array', () => {
      const entry = {
        object: {
          uid: 'multi',
          mail: 'multi@test.com',
          cn: 'Multi User',
        },
        attributes: [
          { type: 'memberOf', values: ['cn=group1,dc=test', 'cn=group2,dc=test'] },
        ],
      };

      const result = mapLdapUser(entry as unknown as SearchEntry);

      expect(result.groups).toEqual(['cn=group1,dc=test', 'cn=group2,dc=test']);
    });
  });

  describe('syncUser', () => {
    it('should upsert user to local database', async () => {
      const ldapUser = {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        groups: ['cn=users,dc=test'],
      };

      const dbUser = {
        id: 'user-001',
        ...ldapUser,
        role: 'operator',
        status: 'enabled',
        password: 'ldap-placeholder',
      };

      (prisma.user.upsert as any).mockResolvedValue(dbUser);

      const result = await syncUser(ldapUser);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        create: {
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
          password: '$2b$10$placeholder.ldap.auth.only',
          role: 'operator',
        },
        update: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      expect(result).toEqual(dbUser);
    });

    it('should map LDAP groups to role correctly', async () => {
      const ldapUser = {
        username: 'adminuser',
        email: 'admin@example.com',
        name: 'Admin User',
        groups: ['cn=admin-group,dc=test'],
      };

      (prisma.user.upsert as any).mockResolvedValue({
        id: 'user-002',
        role: 'admin',
      });

      await syncUser(ldapUser);

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ role: 'admin' }),
        })
      );
    });

    it('should use manager role for manager groups', async () => {
      const ldapUser = {
        username: 'mgr',
        email: 'mgr@example.com',
        name: 'Manager',
        groups: ['cn=manager-group,dc=test'],
      };

      (prisma.user.upsert as any).mockResolvedValue({ id: 'u3', role: 'manager' });

      await syncUser(ldapUser);

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ role: 'manager' }),
        })
      );
    });

    it('should default to operator role for unknown groups', async () => {
      const ldapUser = {
        username: 'regular',
        email: 'regular@example.com',
        name: 'Regular User',
        groups: ['cn=everyone,dc=test'],
      };

      (prisma.user.upsert as any).mockResolvedValue({ id: 'u4', role: 'operator' });

      await syncUser(ldapUser);

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ role: 'operator' }),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const ldapUser = {
        username: 'failuser',
        email: 'fail@example.com',
        name: 'Fail User',
        groups: [],
      };

      (prisma.user.upsert as any).mockRejectedValue(new Error('DB connection failed'));

      await expect(syncUser(ldapUser)).rejects.toThrow('DB connection failed');
    });
  });

  describe('connection error handling', () => {
    it('should handle LDAP client emitting error event during bind', async () => {
      mockLdapOn.mockImplementation((event: string, handler: Function) => {
        if (event === 'error') handler(new Error('Network error'));
      });

      await expect(authenticate('user', 'pass')).rejects.toThrow();
    });

    it('should handle unbind errors gracefully', async () => {
      mockBind.mockImplementation((_dn: string, _pw: string, cb: Function) => cb(null));
      mockUnbind.mockImplementation((cb: Function) => cb(new Error('Unbind failed')));

      const result = await authenticate('user', 'pass');
      expect(result).toBe(true);
    });
  });
});
