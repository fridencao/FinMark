import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    permission: {
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    role: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import * as permissionService from '../services/permissionService.js';
import { prisma } from '../config/database.js';

describe('permissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPermissions', () => {
    it('should return all permissions ordered by category', async () => {
      const mockPermissions = [
        { id: '1', code: 'user:view', name: '查看用户', category: '用户管理', description: 'test', createdAt: new Date() },
        { id: '2', code: 'role:view', name: '查看角色', category: '角色管理', description: 'test', createdAt: new Date() },
      ];
      (prisma.permission.findMany as any).mockResolvedValueOnce(mockPermissions);

      const result = await permissionService.getPermissions();

      expect(result).toEqual(mockPermissions);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({ orderBy: { category: 'asc' } });
    });
  });

  describe('getRoles', () => {
    it('should return roles with permissionDetails', async () => {
      const mockRoles = [
        { id: 'r1', name: '管理员', description: 'admin', isSystem: true, permissions: ['p1', 'p2'], createdAt: new Date(), updatedAt: new Date() },
      ];
      const mockPermissions = [
        { id: 'p1', code: 'user:view', name: '查看用户', category: '用户管理', description: 't', createdAt: new Date() },
        { id: 'p2', code: 'role:view', name: '查看角色', category: '角色管理', description: 't', createdAt: new Date() },
      ];
      (prisma.role.findMany as any).mockResolvedValueOnce(mockRoles);
      (prisma.permission.findMany as any).mockResolvedValueOnce(mockPermissions);

      const result = await permissionService.getRoles();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      const firstRole = result[0]!;
      expect(firstRole.permissionDetails).toHaveLength(2);
      expect(firstRole.permissionDetails![0]!.code).toBe('user:view');
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockCreated = { id: 'new1', name: 'Test Role', description: 'test', isSystem: false, permissions: ['p1'], createdAt: new Date(), updatedAt: new Date() };
      (prisma.role.create as any).mockResolvedValueOnce(mockCreated);

      const result = await permissionService.createRole({ name: 'Test Role', description: 'test', permissions: ['p1'] });

      expect(result).toEqual(mockCreated);
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: { name: 'Test Role', description: 'test', isSystem: false, permissions: ['p1'] },
      });
    });
  });

  describe('updateRole', () => {
    it('should update a non-system role', async () => {
      (prisma.role.findUnique as any).mockResolvedValueOnce({ id: 'r1', name: 'Old', isSystem: false, permissions: ['p1'] });
      (prisma.role.update as any).mockResolvedValueOnce({ id: 'r1', name: 'Updated', isSystem: false, permissions: ['p1'] });

      const result = await permissionService.updateRole('r1', { name: 'Updated' });

      expect(result).toBeTruthy();
      expect(prisma.role.update).toHaveBeenCalled();
    });

    it('should prevent name update on system role but allow permissions', async () => {
      (prisma.role.findUnique as any).mockResolvedValueOnce({ id: 'r1', name: 'Admin', isSystem: true, permissions: ['p1'] });
      (prisma.role.update as any).mockResolvedValueOnce({ id: 'r1', name: 'Admin', isSystem: true, permissions: ['p1', 'p2'] });

      const result = await permissionService.updateRole('r1', { name: 'New Admin', permissions: ['p1', 'p2'] });

      expect(result).toBeTruthy();
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { permissions: ['p1', 'p2'] },
      });
    });

    it('should return null for non-existent role', async () => {
      (prisma.role.findUnique as any).mockResolvedValueOnce(null);

      const result = await permissionService.updateRole('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteRole', () => {
    it('should delete a non-system role', async () => {
      (prisma.role.findUnique as any).mockResolvedValueOnce({ id: 'r1', isSystem: false });

      const result = await permissionService.deleteRole('r1');

      expect(result).toEqual({ deleted: true });
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });

    it('should reject deletion of system role', async () => {
      (prisma.role.findUnique as any).mockResolvedValueOnce({ id: 'r1', isSystem: true });

      const result = await permissionService.deleteRole('r1');

      expect(result).toEqual({ deleted: false, reason: 'system_role' });
      expect(prisma.role.delete).not.toHaveBeenCalled();
    });

    it('should return not_found for non-existent role', async () => {
      (prisma.role.findUnique as any).mockResolvedValueOnce(null);

      const result = await permissionService.deleteRole('nonexistent');

      expect(result).toEqual({ deleted: false, reason: 'not_found' });
    });
  });

  describe('seedDefaultPermissions', () => {
    it('should skip seeding if permissions exist', async () => {
      (prisma.permission.count as any).mockResolvedValueOnce(5);

      await permissionService.seedDefaultPermissions();

      expect(prisma.permission.upsert).not.toHaveBeenCalled();
    });

    it('should seed permissions when empty', async () => {
      (prisma.permission.count as any).mockResolvedValueOnce(0);

      await permissionService.seedDefaultPermissions();

      expect(prisma.permission.upsert).toHaveBeenCalledTimes(16);
    });
  });

  describe('seedDefaultRoles', () => {
    it('should skip seeding if roles exist', async () => {
      (prisma.role.count as any).mockResolvedValueOnce(3);
      (prisma.permission.findMany as any).mockResolvedValueOnce([]);

      await permissionService.seedDefaultRoles();

      expect(prisma.role.create).not.toHaveBeenCalled();
    });

    it('should seed roles when empty', async () => {
      (prisma.role.count as any).mockResolvedValueOnce(0);
      (prisma.permission.findMany as any).mockResolvedValueOnce([
        { id: 'p1', code: 'user:view' },
        { id: 'p2', code: 'user:create' },
        { id: 'p3', code: 'role:view' },
        { id: 'p4', code: 'report:view' },
        { id: 'p5', code: 'report:export' },
      ]);

      await permissionService.seedDefaultRoles();

      expect(prisma.role.create).toHaveBeenCalledTimes(3);
    });
  });
});
