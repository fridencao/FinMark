import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, Role, LoginRequest, RegisterRequest } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

app.use(cors());
app.use(express.json());

const users: Map<string, User> = new Map();
const roles: Map<string, Role> = new Map();

const initializeDefaultData = () => {
  const adminRole: Role = {
    id: 'role-admin',
    name: 'Admin',
    description: 'System administrator',
    permissions: ['*'],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  roles.set(adminRole.id, adminRole);

  const managerRole: Role = {
    id: 'role-manager',
    name: 'Manager',
    description: 'Department manager',
    permissions: ['read', 'write', 'execute'],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  roles.set(managerRole.id, managerRole);

  const userRole: Role = {
    id: 'role-user',
    name: 'User',
    description: 'Regular user',
    permissions: ['read'],
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  roles.set(userRole.id, userRole);

  const adminUser: User = {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@finmark.com',
    name: 'Administrator',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.set(adminUser.id, adminUser);
};

initializeDefaultData();

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    (req as express.Request & { user: User }).user = user;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.post('/auth/login', async (req, res) => {
  const { username, password }: LoginRequest = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  const user = Array.from(users.values()).find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
  user.lastLoginAt = new Date();
  users.set(user.id, user);

  res.json({
    token,
    user,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
});

app.post('/auth/register', async (req, res) => {
  const { username, email, password, name }: RegisterRequest = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const existingUser = Array.from(users.values()).find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uuidv4(),
    username,
    email,
    name,
    role: 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.set(newUser.id, newUser);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.status(201).json({ token, user: newUser });
});

app.get('/users', authenticateToken, (req, res) => {
  const userList = Array.from(users.values()).map(u => ({ ...u }));
  res.json({ users: userList, total: userList.length });
});

app.get('/users/:id', authenticateToken, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

app.post('/users', authenticateToken, async (req, res) => {
  const { username, email, password, name, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uuidv4(),
    username,
    email,
    name,
    role: role || 'user',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.set(newUser.id, newUser);
  res.status(201).json(newUser);
});

app.put('/users/:id', authenticateToken, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = { ...user, ...req.body, updatedAt: new Date() };
  users.set(user.id, updatedUser);
  res.json(updatedUser);
});

app.delete('/users/:id', authenticateToken, (req, res) => {
  if (!users.has(req.params.id)) {
    return res.status(404).json({ message: 'User not found' });
  }
  users.delete(req.params.id);
  res.status(204).send();
});

app.patch('/users/:id/status', authenticateToken, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.status = req.body.status;
  user.updatedAt = new Date();
  users.set(user.id, user);
  res.json(user);
});

app.get('/users/roles', authenticateToken, (req, res) => {
  const roleList = Array.from(roles.values());
  res.json({ roles: roleList });
});

app.post('/users/roles', authenticateToken, (req, res) => {
  const { name, description, permissions } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Role name required' });
  }

  const newRole: Role = {
    id: uuidv4(),
    name,
    description,
    permissions: permissions || [],
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  roles.set(newRole.id, newRole);
  res.status(201).json(newRole);
});

app.put('/users/roles/:id', authenticateToken, (req, res) => {
  const role = roles.get(req.params.id);
  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  if (role.isSystem) {
    return res.status(403).json({ message: 'Cannot modify system role' });
  }

  const updatedRole = { ...role, ...req.body, updatedAt: new Date() };
  roles.set(role.id, updatedRole);
  res.json(updatedRole);
});

app.delete('/users/roles/:id', authenticateToken, (req, res) => {
  const role = roles.get(req.params.id);
  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  if (role.isSystem) {
    return res.status(403).json({ message: 'Cannot delete system role' });
  }

  roles.delete(req.params.id);
  res.status(204).send();
});

app.get('/users/me', authenticateToken, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  res.json(user);
});

app.put('/users/me', authenticateToken, (req, res) => {
  const currentUser = (req as express.Request & { user: User }).user;
  const user = users.get(currentUser.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = { ...user, ...req.body, id: user.id, updatedAt: new Date() };
  users.set(user.id, updatedUser);
  res.json(updatedUser);
});

app.post('/users/me/change-password', authenticateToken, async (req, res) => {
  const currentUser = (req as express.Request & { user: User }).user;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new password required' });
  }

  const isValid = await bcrypt.compare(oldPassword, oldPassword);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid old password' });
  }

  const user = users.get(currentUser.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.updatedAt = new Date();
  users.set(user.id, user);

  res.json({ message: 'Password changed successfully' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

export default app;
