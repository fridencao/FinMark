import api from './api';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: 'enabled' | 'disabled';
  lastLogin?: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  permissionDetails?: Permission[];
  description?: string;
  isSystem?: boolean;
}

export const getUsers = (params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: string;
  search?: string;
}) => api.get('/users', { params });

export const getUser = (id: string) => api.get(`/users/${id}`);

export const createUser = (data: Partial<User>) => api.post('/users', data);

export const updateUser = (id: string, data: Partial<User>) =>
  api.put(`/users/${id}`, data);

export const deleteUser = (id: string) => api.delete(`/users/${id}`);

export const updateUserStatus = (id: string, status: 'enabled' | 'disabled') =>
  api.patch(`/users/${id}/status`, { status });

export const resetPassword = (id: string) =>
  api.post(`/users/${id}/reset-password`);

export const getRoles = () => api.get('/users/roles');

export const createRole = (data: Partial<Role>) => api.post('/users/roles', data);

export const updateRole = (id: string, data: Partial<Role>) =>
  api.put(`/users/roles/${id}`, data);

export const deleteRole = (id: string) => api.delete(`/users/roles/${id}`);

export const getCurrentUser = () => api.get('/users/me');

export const updateCurrentUser = (data: Partial<User>) =>
  api.put('/users/me', data);

export const changePassword = (oldPassword: string, newPassword: string) =>
  api.post('/users/me/change-password', { oldPassword, newPassword });