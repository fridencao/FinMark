import ldap from 'ldapjs';
import { prisma } from '../config/database.js';

export interface LdapConfig {
  url: string;
  bindDn: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string;
  groupRoleMap?: Record<string, string>;
}

export interface LdapUser {
  username: string;
  email: string;
  name: string;
  groups: string[];
}

const DEFAULT_GROUP_ROLE_MAP: Record<string, string> = {
  'admin': 'admin',
  'manager': 'manager',
  'operator': 'operator',
  'readonly': 'readonly',
};

function getConfig(): LdapConfig {
  const url = process.env.LDAP_URL;
  if (!url) throw new Error('LDAP_URL not configured');

  return {
    url,
    bindDn: process.env.LDAP_BIND_DN || '',
    bindPassword: process.env.LDAP_BIND_PASSWORD || '',
    searchBase: process.env.LDAP_SEARCH_BASE || '',
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
  };
}

function createLdapClient(config: LdapConfig): ldap.Client {
  const client = ldap.createClient({ url: config.url });

  client.on('error', () => {});

  return client;
}

function bindClient(client: ldap.Client, dn: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function unbindClient(client: ldap.Client): Promise<void> {
  return new Promise((resolve) => {
    client.unbind((_err) => {
      resolve();
    });
  });
}

function searchLdap(
  client: ldap.Client,
  base: string,
  filter: string
): Promise<ldap.SearchEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: ldap.SearchEntry[] = [];
    const searchClient = client.search(base, {
      filter,
      scope: 'sub',
      attributes: ['uid', 'mail', 'cn', 'memberOf', 'sAMAccountName', 'displayName', 'email'],
    }, () => {}) as unknown as {
      on(event: 'searchEntry', listener: (entry: ldap.SearchEntry) => void): unknown;
      on(event: 'error', listener: (err: Error) => void): unknown;
      on(event: 'end', listener: (result: unknown) => void): unknown;
    };

    searchClient.on('searchEntry', (entry: ldap.SearchEntry) => {
      entries.push(entry);
    });

    searchClient.on('error', (err: Error) => {
      reject(new Error(`LDAP search failed: ${err.message}`));
    });

    searchClient.on('end', () => {
      resolve(entries);
    });
  });
}

function buildUserDn(config: LdapConfig, username: string): string {
  const filter = config.searchFilter.replace('{{username}}', username);
  if (filter.startsWith('(') && filter.endsWith(')')) {
    return `${filter.slice(1, -1).split('=')[0]}=${username},${config.searchBase}`;
  }
  return `uid=${username},${config.searchBase}`;
}

export async function authenticate(
  username: string,
  password: string,
  config?: LdapConfig
): Promise<boolean> {
  const ldapConfig = config || getConfig();
  const client = createLdapClient(ldapConfig);

  try {
    const connectionError = await new Promise<Error | null>((resolve) => {
      client.on('error', (err: Error) => resolve(err));
      setTimeout(() => resolve(null), 100);
    });

    if (connectionError) {
      throw new Error(`LDAP connection error: ${connectionError.message}`);
    }

    const userDn = buildUserDn(ldapConfig, username);
    await bindClient(client, userDn, password);
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes('LDAP connection error')) {
      throw err;
    }
    return false;
  } finally {
    try {
      await unbindClient(client);
    } catch {
      // ignore unbind errors
    }
  }
}

export async function getUserInfo(
  username: string,
  config?: LdapConfig
): Promise<LdapUser | null> {
  const ldapConfig = config || getConfig();
  const client = createLdapClient(ldapConfig);

  try {
    await bindClient(client, ldapConfig.bindDn, ldapConfig.bindPassword);

    const filter = ldapConfig.searchFilter.replace('{{username}}', username);
    const entries = await searchLdap(client, ldapConfig.searchBase, filter);

    if (entries.length === 0) return null;

    return mapLdapUser(entries[0]);
  } finally {
    try {
      await unbindClient(client);
    } catch {
      // ignore
    }
  }
}

export function mapLdapUser(entry: ldap.SearchEntry): LdapUser {
  const obj = (entry as unknown as { object: Record<string, any> }).object;

  let groups: string[] = [];
  const memberOfAttr = entry.attributes?.find(
    (a: any) => a.type === 'memberOf' || a.type === 'memberOf;range=0-*'
  );
  if (memberOfAttr) {
    groups = Array.isArray(memberOfAttr.values)
      ? memberOfAttr.values
      : [memberOfAttr.values];
  } else if (obj.memberOf) {
    groups = Array.isArray(obj.memberOf) ? obj.memberOf : [obj.memberOf];
  }

  return {
    username: obj.uid || obj.sAMAccountName || '',
    email: obj.mail || obj.email || '',
    name: obj.cn || obj.displayName || obj.uid || '',
    groups,
  };
}

function mapGroupsToRole(groups: string[], roleMap?: Record<string, string>): string {
  const map = roleMap || DEFAULT_GROUP_ROLE_MAP;

  for (const group of groups) {
    const groupLower = group.toLowerCase();
    for (const [pattern, role] of Object.entries(map)) {
      if (groupLower.includes(pattern.toLowerCase())) {
        return role;
      }
    }
  }

  return 'operator';
}

export async function syncUser(ldapUser: LdapUser): Promise<any> {
  const role = mapGroupsToRole(ldapUser.groups);
  const placeholderPassword = '$2b$10$placeholder.ldap.auth.only';

  return prisma.user.upsert({
    where: { username: ldapUser.username },
    create: {
      username: ldapUser.username,
      email: ldapUser.email,
      name: ldapUser.name,
      password: placeholderPassword,
      role: role as any,
    },
    update: {
      email: ldapUser.email,
      name: ldapUser.name,
    },
  });
}
