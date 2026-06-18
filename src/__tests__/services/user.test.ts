import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiModule from '@/services/api';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import * as userService from '@/services/user';

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should fetch users without params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await userService.getUsers();

      expect(apiModule.default.get).toHaveBeenCalledWith('/users', { params: undefined });
    });

    it('should fetch users with pagination', async () => {
      const mockResponse = { data: [], total: 100 };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { page: 1, pageSize: 20 };
      await userService.getUsers(params);

      expect(apiModule.default.get).toHaveBeenCalledWith('/users', { params });
    });

    it('should fetch users with filters', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { role: 'admin', status: 'enabled', search: 'john' };
      await userService.getUsers(params);

      expect(apiModule.default.get).toHaveBeenCalledWith('/users', { params });
    });
  });

  describe('getUser', () => {
    it('should fetch a single user', async () => {
      const mockResponse = { data: { id: '1', name: 'Test User' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await userService.getUser('1');

      expect(apiModule.default.get).toHaveBeenCalledWith('/users/1');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockResponse = { data: { id: '2', username: 'newuser' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { username: 'newuser', name: 'New User', role: 'user' };
      await userService.createUser(data);

      expect(apiModule.default.post).toHaveBeenCalledWith('/users', data);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated User' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated User' };
      await userService.updateUser('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith('/users/1', data);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await userService.deleteUser('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith('/users/1');
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status to disabled', async () => {
      (apiModule.default.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: '1', status: 'disabled' } });

      await userService.updateUserStatus('1', 'disabled');

      expect(apiModule.default.patch).toHaveBeenCalledWith('/users/1/status', { status: 'disabled' });
    });

    it('should update user status to enabled', async () => {
      (apiModule.default.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: '1', status: 'enabled' } });

      await userService.updateUserStatus('1', 'enabled');

      expect(apiModule.default.patch).toHaveBeenCalledWith('/users/1/status', { status: 'enabled' });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      await userService.resetPassword('1');

      expect(apiModule.default.post).toHaveBeenCalledWith('/users/1/reset-password');
    });
  });

  describe('getRoles', () => {
    it('should fetch all roles', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Admin' }] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await userService.getRoles();

      expect(apiModule.default.get).toHaveBeenCalledWith('/permissions/roles');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockResponse = { data: { id: '2', name: 'New Role' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'New Role', permissions: ['read', 'write'] };
      await userService.createRole(data);

      expect(apiModule.default.post).toHaveBeenCalledWith('/permissions/roles', data);
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated Role' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated Role' };
      await userService.updateRole('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith('/permissions/roles/1', data);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await userService.deleteRole('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith('/permissions/roles/1');
    });
  });

  describe('getPermissions', () => {
    it('should fetch all permissions', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Read' }] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await userService.getPermissions();

      expect(apiModule.default.get).toHaveBeenCalledWith('/permissions');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockResponse = { data: { id: '1', name: 'Current User' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await userService.getCurrentUser();

      expect(apiModule.default.get).toHaveBeenCalledWith('/users/me');
    });
  });

  describe('updateCurrentUser', () => {
    it('should update current user', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated Name' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated Name' };
      await userService.updateCurrentUser(data);

      expect(apiModule.default.put).toHaveBeenCalledWith('/users/me', data);
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

      await userService.changePassword('oldpass', 'newpass');

      expect(apiModule.default.post).toHaveBeenCalledWith('/users/me/change-password', {
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      });
    });
  });
});
