import axios, { AxiosInstance } from 'axios';
import { RightsPermission, RightsRole, RightsUser, RightsCheckResult } from '../types.js';

export interface RightsConfig {
  provider: 'custom' | 'keycloak' | 'okta';
  apiUrl: string;
  apiKey: string;
}

export class RightsIntegration {
  private client: AxiosInstance;
  private provider: string;

  constructor(config: RightsConfig) {
    this.provider = config.provider;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<RightsCheckResult> {
    try {
      const response = await this.client.post('/check-permission', {
        userId,
        resource,
        action,
      });
      return response.data as RightsCheckResult;
    } catch (error) {
      console.error('Rights checkPermission error:', error);
      return { allowed: false, reason: 'Unable to verify permissions' };
    }
  }

  async checkPermissions(
    userId: string,
    permissions: Array<{ resource: string; action: string }>
  ): Promise<RightsCheckResult> {
    try {
      const response = await this.client.post('/check-permissions', {
        userId,
        permissions,
      });
      return response.data as RightsCheckResult;
    } catch (error) {
      console.error('Rights checkPermissions error:', error);
      return { allowed: false, reason: 'Unable to verify permissions' };
    }
  }

  async getUser(userId: string): Promise<RightsUser | null> {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return this.normalizeUser(response.data);
    } catch (error) {
      console.error('Rights getUser error:', error);
      return null;
    }
  }

  async getUserRoles(userId: string): Promise<RightsRole[]> {
    try {
      const response = await this.client.get(`/users/${userId}/roles`);
      return response.data.roles.map(this.normalizeRole.bind(this));
    } catch (error) {
      console.error('Rights getUserRoles error:', error);
      return [];
    }
  }

  async getUserPermissions(userId: string): Promise<RightsPermission[]> {
    try {
      const response = await this.client.get(`/users/${userId}/permissions`);
      return response.data.permissions.map(this.normalizePermission.bind(this));
    } catch (error) {
      console.error('Rights getUserPermissions error:', error);
      return [];
    }
  }

  async assignRole(userId: string, roleId: string): Promise<boolean> {
    try {
      await this.client.post(`/users/${userId}/roles`, { roleId });
      return true;
    } catch (error) {
      console.error('Rights assignRole error:', error);
      return false;
    }
  }

  async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      await this.client.delete(`/users/${userId}/roles/${roleId}`);
      return true;
    } catch (error) {
      console.error('Rights removeRole error:', error);
      return false;
    }
  }

  async getRoles(): Promise<RightsRole[]> {
    try {
      const response = await this.client.get('/roles');
      return response.data.roles.map(this.normalizeRole.bind(this));
    } catch (error) {
      console.error('Rights getRoles error:', error);
      return [];
    }
  }

  async getRole(roleId: string): Promise<RightsRole | null> {
    try {
      const response = await this.client.get(`/roles/${roleId}`);
      return this.normalizeRole(response.data);
    } catch (error) {
      console.error('Rights getRole error:', error);
      return null;
    }
  }

  async createRole(role: Partial<RightsRole>): Promise<RightsRole | null> {
    try {
      const response = await this.client.post('/roles', this.denormalizeRole(role));
      return this.normalizeRole(response.data);
    } catch (error) {
      console.error('Rights createRole error:', error);
      return null;
    }
  }

  async updateRole(roleId: string, role: Partial<RightsRole>): Promise<RightsRole | null> {
    try {
      const response = await this.client.put(`/roles/${roleId}`, this.denormalizeRole(role));
      return this.normalizeRole(response.data);
    } catch (error) {
      console.error('Rights updateRole error:', error);
      return null;
    }
  }

  async deleteRole(roleId: string): Promise<boolean> {
    try {
      await this.client.delete(`/roles/${roleId}`);
      return true;
    } catch (error) {
      console.error('Rights deleteRole error:', error);
      return false;
    }
  }

  async getPermissions(): Promise<RightsPermission[]> {
    try {
      const response = await this.client.get('/permissions');
      return response.data.permissions.map(this.normalizePermission.bind(this));
    } catch (error) {
      console.error('Rights getPermissions error:', error);
      return [];
    }
  }

  async createPermission(permission: Partial<RightsPermission>): Promise<RightsPermission | null> {
    try {
      const response = await this.client.post('/permissions', this.denormalizePermission(permission));
      return this.normalizePermission(response.data);
    } catch (error) {
      console.error('Rights createPermission error:', error);
      return null;
    }
  }

  async deletePermission(permissionId: string): Promise<boolean> {
    try {
      await this.client.delete(`/permissions/${permissionId}`);
      return true;
    } catch (error) {
      console.error('Rights deletePermission error:', error);
      return false;
    }
  }

  private normalizeUser(data: Record<string, unknown>): RightsUser {
    return {
      id: data.id as string,
      username: data.username as string,
      email: data.email as string,
      roles: data.roles as string[] || [],
      department: data.department as string | undefined,
      permissions: data.permissions 
        ? (data.permissions as Array<Record<string, unknown>>).map(p => this.normalizePermission(p))
        : undefined,
    };
  }

  private normalizeRole(data: Record<string, unknown>): RightsRole {
    return {
      id: data.id as string,
      name: data.name as string,
      description: data.description as string,
      permissions: data.permissions 
        ? (data.permissions as Array<Record<string, unknown>>).map(p => this.normalizePermission(p))
        : [],
      parentRoleId: data.parentRoleId as string | undefined,
    };
  }

  private denormalizeRole(role: Partial<RightsRole>): Record<string, unknown> {
    return {
      name: role.name,
      description: role.description,
      permissions: role.permissions?.map(p => this.denormalizePermission(p)),
      parentRoleId: role.parentRoleId,
    };
  }

  private normalizePermission(data: Record<string, unknown>): RightsPermission {
    return {
      id: data.id as string,
      resource: data.resource as string,
      action: data.action as RightsPermission['action'],
      scope: data.scope as RightsPermission['scope'],
      conditions: data.conditions as Record<string, unknown> | undefined,
    };
  }

  private denormalizePermission(permission: Partial<RightsPermission>): Record<string, unknown> {
    return {
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      conditions: permission.conditions,
    };
  }
}
