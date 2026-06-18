import { prisma } from '../config/database.js';

const DEFAULT_PERMISSIONS = [
  { code: 'user:view', name: '查看用户', category: '用户管理', description: '查看用户列表和详情' },
  { code: 'user:create', name: '创建用户', category: '用户管理', description: '创建新用户' },
  { code: 'user:edit', name: '编辑用户', category: '用户管理', description: '修改用户信息' },
  { code: 'user:delete', name: '删除用户', category: '用户管理', description: '删除用户账号' },
  { code: 'role:view', name: '查看角色', category: '角色管理', description: '查看角色列表和详情' },
  { code: 'role:create', name: '创建角色', category: '角色管理', description: '创建新角色' },
  { code: 'role:edit', name: '编辑角色', category: '角色管理', description: '修改角色信息和权限' },
  { code: 'role:delete', name: '删除角色', category: '角色管理', description: '删除角色' },
  { code: 'agent:view', name: '查看智能体', category: '智能体管理', description: '查看智能体列表和配置' },
  { code: 'agent:create', name: '创建智能体', category: '智能体管理', description: '创建新智能体' },
  { code: 'agent:edit', name: '编辑智能体', category: '智能体管理', description: '修改智能体配置' },
  { code: 'agent:delete', name: '删除智能体', category: '智能体管理', description: '删除智能体' },
  { code: 'model:view', name: '查看模型', category: '模型配置', description: '查看模型配置' },
  { code: 'model:edit', name: '编辑模型', category: '模型配置', description: '修改模型配置' },
  { code: 'report:view', name: '查看报表', category: '报表管理', description: '查看营销报表' },
  { code: 'report:export', name: '导出报表', category: '报表管理', description: '导出营销报表' },
];

const DEFAULT_ROLES = [
  {
    name: '管理员',
    description: '拥有全部系统权限',
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map(p => p.code),
  },
  {
    name: '业务经理',
    description: '业务管理权限，不含删除权限',
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.filter(p => !['user:delete', 'role:delete', 'agent:delete'].includes(p.code)).map(p => p.code),
  },
  {
    name: '运营人员',
    description: '基础运营权限',
    isSystem: false,
    permissions: DEFAULT_PERMISSIONS.filter(p => p.category === '报表管理' || p.code.endsWith(':view')).map(p => p.code),
  },
];

export async function seedDefaultPermissions(): Promise<void> {
  const existing = await prisma.permission.count();
  if (existing > 0) return;

  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
}

export async function seedDefaultRoles(): Promise<void> {
  const existing = await prisma.role.count();
  if (existing > 0) return;

  const allPerms = await prisma.permission.findMany();
  const codeToId = new Map(allPerms.map(p => [p.code, p.id]));

  for (const role of DEFAULT_ROLES) {
    await prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map(code => codeToId.get(code)!).filter(Boolean),
      },
    });
  }
}

export async function getPermissions() {
  return prisma.permission.findMany({ orderBy: { category: 'asc' } });
}

export async function getRoles() {
  const roles = await prisma.role.findMany({ orderBy: { createdAt: 'asc' } });
  const permissions = await prisma.permission.findMany();

  return roles.map(role => ({
    ...role,
    permissionDetails: role.permissions
      .map(id => permissions.find(p => p.id === id))
      .filter(Boolean),
  }));
}

export async function createRole(data: { name: string; description?: string; isSystem?: boolean; permissions?: string[] }) {
  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description || null,
      isSystem: data.isSystem || false,
      permissions: data.permissions || [],
    },
  });
}

export async function updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return null;
  if (role.isSystem && data.name) {
    return prisma.role.update({
      where: { id },
      data: { permissions: data.permissions ?? role.permissions },
    });
  }
  return prisma.role.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
    },
  });
}

export async function deleteRole(id: string): Promise<{ deleted: boolean; reason?: string }> {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return { deleted: false, reason: 'not_found' };
  if (role.isSystem) return { deleted: false, reason: 'system_role' };
  await prisma.role.delete({ where: { id } });
  return { deleted: true };
}
