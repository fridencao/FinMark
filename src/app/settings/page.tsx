import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Users, Shield, Bell, Info, Plus, Edit, Trash2, RefreshCw, Check, X, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, getRoles, type User, type Role, type Permission } from '@/services/user';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PermissionManager } from '@/components/settings/PermissionManager';
import { getModels, createModel, updateModel, deleteModel, testModel, setDefaultModel, getIntegrations, connectIntegration, disconnectIntegration } from '@/services/settings';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

const defaultPermissions: Permission[] = [
  { id: 'user_view', name: '查看用户', code: 'user:view', category: '用户管理', description: '查看用户列表和详情' },
  { id: 'user_create', name: '创建用户', code: 'user:create', category: '用户管理', description: '创建新用户' },
  { id: 'user_edit', name: '编辑用户', code: 'user:edit', category: '用户管理', description: '修改用户信息' },
  { id: 'user_delete', name: '删除用户', code: 'user:delete', category: '用户管理', description: '删除用户账号' },
  { id: 'role_view', name: '查看角色', code: 'role:view', category: '角色管理', description: '查看角色列表和详情' },
  { id: 'role_create', name: '创建角色', code: 'role:create', category: '角色管理', description: '创建新角色' },
  { id: 'role_edit', name: '编辑角色', code: 'role:edit', category: '角色管理', description: '修改角色信息和权限' },
  { id: 'role_delete', name: '删除角色', code: 'role:delete', category: '角色管理', description: '删除角色' },
  { id: 'agent_view', name: '查看智能体', code: 'agent:view', category: '智能体管理', description: '查看智能体列表和配置' },
  { id: 'agent_create', name: '创建智能体', code: 'agent:create', category: '智能体管理', description: '创建新智能体' },
  { id: 'agent_edit', name: '编辑智能体', code: 'agent:edit', category: '智能体管理', description: '修改智能体配置' },
  { id: 'agent_delete', name: '删除智能体', code: 'agent:delete', category: '智能体管理', description: '删除智能体' },
  { id: 'model_view', name: '查看模型', code: 'model:view', category: '模型配置', description: '查看模型配置' },
  { id: 'model_edit', name: '编辑模型', code: 'model:edit', category: '模型配置', description: '修改模型配置' },
  { id: 'report_view', name: '查看报表', code: 'report:view', category: '报表管理', description: '查看营销报表' },
  { id: 'report_export', name: '导出报表', code: 'report:export', category: '报表管理', description: '导出营销报表' },
];

const defaultRoles: Role[] = [
  { id: 'admin', name: '管理员', permissions: defaultPermissions.map(p => p.id), description: '拥有全部系统权限', isSystem: true },
  { id: 'manager', name: '业务经理', permissions: defaultPermissions.filter(p => !['user_delete', 'role_delete', 'agent_delete'].includes(p.id)).map(p => p.id), description: '业务管理权限，不含删除权限', isSystem: true },
  { id: 'operator', name: '运营人员', permissions: defaultPermissions.filter(p => p.category === '报表管理' || p.code.includes('view')).map(p => p.id), description: '基础运营权限', isSystem: false },
];

export function SettingsPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [modelForm, setModelForm] = useState({ name: '', provider: 'gemini', apiUrl: '', apiKey: '', modelVersion: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 4096 });

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ username: '', name: '', email: '', password: '', role: 'operator', status: 'enabled' as 'enabled' | 'disabled' });

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => getModels(),
  });

  const { data: integrationsData, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => getIntegrations(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  const createModelMutation = useMutation({
    mutationFn: createModel,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['models'] }); setModelDialogOpen(false); },
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '创建模型失败' : 'Failed to create model')),
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateModel(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['models'] }); setModelDialogOpen(false); },
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '更新模型失败' : 'Failed to update model')),
  });

  const defaultModelMutation = useMutation({
    mutationFn: setDefaultModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '设置默认失败' : 'Failed to set default')),
  });

  const deleteModelMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '删除模型失败' : 'Failed to delete model')),
  });

  const testModelMutation = useMutation({
    mutationFn: testModel,
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '测试失败' : 'Test failed')),
  });

  const connectMutation = useMutation({
    mutationFn: connectIntegration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '连接失败' : 'Connection failed')),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectIntegration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '断开连接失败' : 'Disconnect failed')),
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setUserDialogOpen(false); },
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '创建用户失败' : 'Failed to create user')),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setUserDialogOpen(false); },
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '更新用户失败' : 'Failed to update user')),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: any) => setSettingsError(err?.response?.data?.message || (language === 'zh' ? '删除用户失败' : 'Failed to delete user')),
  });

  const models = modelsData?.data || [];
  const integrations = (integrationsData?.data || []) as Integration[];
  const users = usersData?.data || [];

  const t = language === 'zh' ? {
    modelConfig: '模型配置',
    systemIntegration: '系统集成',
    userManagement: '用户管理',
    permission: '权限管理',
    notification: '通知设置',
    systemInfo: '系统信息',
    addModel: '添加模型',
    test: '测试',
    edit: '编辑',
    delete: '删除',
    connect: '连接',
    disconnect: '断开',
    addUser: '添加用户',
    import: '批量导入',
    enabled: '已启用',
    disabled: '已禁用',
    connected: '已连接',
    disconnected: '未连接',
    error: '错误',
    lastSync: '最后同步',
    save: '保存',
    cancel: '取消',
  } : {
    modelConfig: 'Model Config',
    systemIntegration: 'Integration',
    userManagement: 'User Management',
    permission: 'Permissions',
    notification: 'Notifications',
    systemInfo: 'System Info',
    addModel: 'Add Model',
    test: 'Test',
    edit: 'Edit',
    delete: 'Delete',
    connect: 'Connect',
    disconnect: 'Disconnect',
    addUser: 'Add User',
    import: 'Import',
    enabled: 'Enabled',
    disabled: 'Disabled',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
    lastSync: 'Last Sync',
    save: 'Save',
    cancel: 'Cancel',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enabled':
      case 'connected':
        return <Badge className="bg-emerald-100 text-emerald-700">{language === 'zh' ? '已启用' : 'Enabled'}</Badge>;
      case 'disabled':
      case 'disconnected':
        return <Badge className="bg-slate-100 text-slate-700">{language === 'zh' ? '已禁用' : 'Disabled'}</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700">{language === 'zh' ? '错误' : 'Error'}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">{language === 'zh' ? '系统设置' : 'Settings'}</h2>
        <p className="text-slate-500">
          {language === 'zh' ? '配置模型、系统集成和用户管理' : 'Configure models, integrations and user management'}
        </p>
      </div>

      {settingsError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{settingsError}</p>
      )}

      <Tabs defaultValue="model" orientation="horizontal" className="w-full">
        <TabsList className="flex flex-row w-full justify-start border-b border-slate-200 bg-transparent p-0 h-auto mb-6">
          <TabsTrigger value="model" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 rounded-none border-b-2 border-transparent">
            <SettingsIcon className="w-4 h-4" />
            {t.modelConfig}
          </TabsTrigger>
          <TabsTrigger value="integration" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 rounded-none border-b-2 border-transparent">
            <Database className="w-4 h-4" />
            {t.systemIntegration}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 rounded-none border-b-2 border-transparent">
            <Users className="w-4 h-4" />
            {t.userManagement}
          </TabsTrigger>
          <TabsTrigger value="permission" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 rounded-none border-b-2 border-transparent">
            <Shield className="w-4 h-4" />
            {t.permission}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="space-y-6">
          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => { setEditingModel(null); setModelForm({ name: '', provider: 'gemini', apiUrl: '', apiKey: '', modelVersion: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 4096 }); setModelDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              {t.addModel}
            </Button>
          </div>

          <Card>
            {modelsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'zh' ? '模型名称' : 'Model Name'}</TableHead>
                    <TableHead>{language === 'zh' ? '类型' : 'Type'}</TableHead>
                    <TableHead>{language === 'zh' ? '状态' : 'Status'}</TableHead>
                    <TableHead>{language === 'zh' ? '默认' : 'Default'}</TableHead>
                    <TableHead className="text-right">{language === 'zh' ? '操作' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model: any) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{model.type === 'api' ? 'API' : 'Local'}</TableCell>
                      <TableCell>{getStatusBadge(model.status)}</TableCell>
                      <TableCell>
                        {model.isDefault ? (
                          <Badge className="bg-indigo-100 text-indigo-700">Default</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs text-indigo-600 h-6 px-2" onClick={() => defaultModelMutation.mutate(model.id)} disabled={defaultModelMutation.isPending}>
                            {language === 'zh' ? '设为默认' : 'Set Default'}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => testModelMutation.mutate(model.id)}
                            disabled={testModelMutation.isPending}
                          >
                            {t.test}
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { setEditingModel(model); setModelForm({ name: model.name, provider: model.provider || 'gemini', apiUrl: model.apiUrl || '', apiKey: '', modelVersion: model.modelVersion || '', temperature: model.temperature || 0.7, maxTokens: model.maxTokens || 4096 }); setModelDialogOpen(true); }}>
                            {t.edit}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 rounded-xl"
                            onClick={() => deleteModelMutation.mutate(model.id)}
                            disabled={deleteModelMutation.isPending}
                          >
                            {t.delete}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrationsLoading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </>
            ) : (
              integrations.map(integration => (
                <Card key={integration.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="font-bold">{integration.name}</h4>
                        <p className="text-xs text-slate-500">{integration.type}</p>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>

                  {integration.lastSync && (
                    <p className="text-xs text-slate-400 mb-4">
                      {t.lastSync}: {integration.lastSync}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {language === 'zh' ? '测试连接' : 'Test'}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl">
                      <SettingsIcon className="w-4 h-4 mr-1" />
                      {language === 'zh' ? '配置' : 'Config'}
                    </Button>
                    {integration.status === 'connected' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 rounded-xl"
                        onClick={() => disconnectMutation.mutate(integration.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        {t.disconnect}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-500 rounded-xl"
                        onClick={() => connectMutation.mutate(integration.id)}
                        disabled={connectMutation.isPending}
                      >
                        {t.connect}
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => { setEditingUser(null); setUserForm({ username: '', name: '', email: '', password: '', role: 'operator', status: 'enabled' }); setUserDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              {t.addUser}
            </Button>
            <Button variant="outline" className="rounded-xl">
              <Users className="w-4 h-4 mr-2" />
              {t.import}
            </Button>
          </div>

          <Card>
            {usersLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'zh' ? '用户名' : 'Username'}</TableHead>
                    <TableHead>{language === 'zh' ? '姓名' : 'Name'}</TableHead>
                    <TableHead>{language === 'zh' ? '角色' : 'Role'}</TableHead>
                    <TableHead>{language === 'zh' ? '状态' : 'Status'}</TableHead>
                    <TableHead>{language === 'zh' ? '最后登录' : 'Last Login'}</TableHead>
                    <TableHead className="text-right">{language === 'zh' ? '操作' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-slate-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { setEditingUser(user); setUserForm({ username: user.username, name: user.name || '', email: user.email || '', password: '', role: user.role || 'operator', status: user.status || 'enabled' }); setUserDialogOpen(true); }}>{t.edit}</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 rounded-xl"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            {t.delete}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="permission">
          <PermissionManager
            roles={roles}
            permissions={defaultPermissions}
            onRolesChange={setRoles}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? (language === 'zh' ? '编辑模型' : 'Edit Model') : (language === 'zh' ? '添加模型' : 'Add Model')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'zh' ? '模型名称' : 'Model Name'}</Label>
              <Input value={modelForm.name} onChange={e => setModelForm(f => ({ ...f, name: e.target.value }))} placeholder="Gemini 2.0 Flash" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'zh' ? '提供商' : 'Provider'}</Label>
                <Select value={modelForm.provider} onValueChange={v => setModelForm(f => ({ ...f, provider: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'zh' ? '模型版本' : 'Model Version'}</Label>
                <Input value={modelForm.modelVersion} onChange={e => setModelForm(f => ({ ...f, modelVersion: e.target.value }))} placeholder="gemini-2.0-flash" />
              </div>
            </div>
            <div>
              <Label>API URL</Label>
              <Input value={modelForm.apiUrl} onChange={e => setModelForm(f => ({ ...f, apiUrl: e.target.value }))} placeholder="https://api.example.com" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input type="password" value={modelForm.apiKey} onChange={e => setModelForm(f => ({ ...f, apiKey: e.target.value }))} placeholder={editingModel ? (language === 'zh' ? '(留空保留原值)' : '(keep empty to retain)') : ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'zh' ? 'Temperature' : 'Temperature'}: {modelForm.temperature}</Label>
                <Input type="range" min={0} max={2} step={0.1} value={modelForm.temperature} onChange={e => setModelForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))} className="py-1" />
              </div>
              <div>
                <Label>{language === 'zh' ? 'Max Tokens' : 'Max Tokens'}: {modelForm.maxTokens}</Label>
                <Input type="number" value={modelForm.maxTokens} onChange={e => setModelForm(f => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelDialogOpen(false)}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
            <Button
              onClick={() => {
                if (!modelForm.name || !modelForm.modelVersion) return;
                const payload: any = { ...modelForm, status: 'enabled' };
                if (!payload.apiKey) delete payload.apiKey;
                if (editingModel) updateModelMutation.mutate({ id: editingModel.id, data: payload });
                else createModelMutation.mutate(payload);
              }}
              disabled={!modelForm.name || !modelForm.modelVersion || createModelMutation.isPending || updateModelMutation.isPending}
            >
              {language === 'zh' ? '保存' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? (language === 'zh' ? '编辑用户' : 'Edit User') : (language === 'zh' ? '添加用户' : 'Add User')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'zh' ? '用户名' : 'Username'}</Label>
              <Input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="john_doe" disabled={!!editingUser} />
            </div>
            <div>
              <Label>{language === 'zh' ? '姓名' : 'Name'}</Label>
              <Input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder={language === 'zh' ? '张三' : 'John Doe'} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
            </div>
            {!editingUser && (
              <div>
                <Label>{language === 'zh' ? '密码' : 'Password'}</Label>
                <Input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'zh' ? '角色' : 'Role'}</Label>
                <Select value={userForm.role} onValueChange={v => setUserForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{language === 'zh' ? '管理员' : 'Admin'}</SelectItem>
                    <SelectItem value="manager">{language === 'zh' ? '业务经理' : 'Manager'}</SelectItem>
                    <SelectItem value="operator">{language === 'zh' ? '运营人员' : 'Operator'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'zh' ? '状态' : 'Status'}</Label>
                <Select value={userForm.status} onValueChange={v => setUserForm(f => ({ ...f, status: v as 'enabled' | 'disabled' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">{language === 'zh' ? '启用' : 'Enabled'}</SelectItem>
                    <SelectItem value="disabled">{language === 'zh' ? '禁用' : 'Disabled'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
            <Button
              onClick={() => {
                if (!userForm.username || (!editingUser && !userForm.password)) return;
                if (editingUser) {
                  const payload: any = { name: userForm.name, email: userForm.email, role: userForm.role, status: userForm.status };
                  updateUserMutation.mutate({ id: editingUser.id, data: payload });
                } else {
                  createUserMutation.mutate({ ...userForm, password: userForm.password } as any);
                }
              }}
              disabled={!userForm.username || (!editingUser && !userForm.password) || createUserMutation.isPending || updateUserMutation.isPending}
            >
              {language === 'zh' ? '保存' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
