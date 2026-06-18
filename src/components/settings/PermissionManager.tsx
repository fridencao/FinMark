import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Shield, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PermissionTree } from '@/components/common/PermissionTree';
import type { Role, Permission } from '@/services/user';
import { EmptyState } from '@/components/common/EmptyState';

interface PermissionManagerProps {
  roles: Role[];
  permissions: Permission[];
  isLoading?: boolean;
  onCreateRole: (data: { name: string; description?: string; isSystem?: boolean; permissions?: string[] }) => void;
  onUpdateRole: (id: string, data: { name?: string; description?: string; permissions?: string[] }) => void;
  onDeleteRole: (id: string) => void;
  isMutating?: boolean;
}

interface FormData {
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

const initialFormData: FormData = {
  name: '',
  description: '',
  isSystem: false,
  permissions: [],
};

export function PermissionManager({
  roles,
  permissions,
  isLoading = false,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  isMutating = false,
}: PermissionManagerProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditing(false);
  };

  const handleCreateRole = () => {
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEditRole = () => {
    if (selectedRole) {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description || '',
        isSystem: selectedRole.isSystem || false,
        permissions: selectedRole.permissions,
      });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteRole = () => {
    if (selectedRole && !selectedRole.isSystem) {
      onDeleteRole(selectedRole.id);
      setSelectedRole(null);
    }
  };

  const handleSaveRole = () => {
    if (!formData.name.trim()) return;

    if (isEditing && selectedRole) {
      onUpdateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });
      setSelectedRole({ ...selectedRole, ...formData });
    } else {
      onCreateRole({
        name: formData.name,
        description: formData.description,
        isSystem: formData.isSystem,
        permissions: formData.permissions,
      });
    }

    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
  };

  const handlePermissionChange = (permissionIds: string[]) => {
    if (!selectedRole) return;
    onUpdateRole(selectedRole.id, { permissions: permissionIds });
    setSelectedRole({ ...selectedRole, permissions: permissionIds });
  };

  const getRolePermissionCount = (role: Role) => {
    return role.permissions.length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[600px]">
      <div className="w-80 border border-slate-200 rounded-lg flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            角色列表
          </h3>
          <Button size="sm" onClick={handleCreateRole} disabled={isMutating}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedRole?.id === role.id
                  ? 'bg-indigo-50 border-2 border-indigo-200'
                  : 'bg-white border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-700">{role.name}</span>
                {role.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    系统
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {role.description || '暂无描述'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">
                  {getRolePermissionCount(role)} 个权限
                </span>
              </div>
            </button>
          ))}

          {roles.length === 0 && (
            <EmptyState
              icon={Shield}
              title="暂无角色"
              description="点击右上角 + 按钮创建新角色"
            />
          )}
        </div>
      </div>

      <div className="flex-1 border border-slate-200 rounded-lg flex flex-col">
        {selectedRole ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {selectedRole.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedRole.description || '暂无描述'}
                  {selectedRole.isSystem && (
                    <span className="ml-2">
                      <Badge variant="secondary" className="text-xs">系统角色</Badge>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!selectedRole.isSystem && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleEditRole} disabled={isMutating}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDeleteRole} disabled={isMutating}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  权限配置
                </Label>
                <p className="text-xs text-slate-500 mb-4">
                  为角色分配权限，选中类别将分配该类别下的所有权限。
                  {isMutating && <span className="ml-1 text-indigo-500">保存中...</span>}
                </p>

                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="搜索权限..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                <PermissionTree
                  permissions={filteredPermissions}
                  selectedPermissionIds={selectedRole.permissions}
                  onSelectionChange={handlePermissionChange}
                  disabled={selectedRole.isSystem || isMutating}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Shield}
              title="选择角色"
              description="从左侧列表中选择一个角色来配置权限"
            />
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? '编辑角色' : '创建新角色'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">角色名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：高级管理员"
                disabled={isEditing && selectedRole?.isSystem}
              />
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="例如：拥有全部系统管理权限"
                disabled={isEditing && selectedRole?.isSystem}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isSystem">系统角色</Label>
              <Switch
                id="isSystem"
                checked={formData.isSystem}
                onCheckedChange={(checked) => setFormData({ ...formData, isSystem: checked })}
                disabled={isEditing && selectedRole?.isSystem}
              />
            </div>

            {isEditing && (
              <div>
                <Label>权限配置</Label>
                <div className="mt-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  <PermissionTree
                    permissions={permissions}
                    selectedPermissionIds={formData.permissions}
                    onSelectionChange={(permissionIds) =>
                      setFormData({ ...formData, permissions: permissionIds })
                    }
                    disabled={isMutating}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isMutating}>
              <X className="w-4 h-4" />
              取消
            </Button>
            <Button onClick={handleSaveRole} disabled={isMutating || !formData.name.trim()}>
              {isMutating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PermissionManager;
