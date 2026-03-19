import type { Router as RouterType } from 'express';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const userRouter: RouterType = Router();

userRouter.use(requireAuth);

userRouter.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query as Record<string, unknown>;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (Number(page) - 1) * Number(limit), take: Number(limit), orderBy: { createdAt: 'desc' }, select: { id: true, username: true, email: true, name: true, role: true, status: true, lastLogin: true, createdAt: true } }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

userRouter.post('/',
  requireRole('admin'),
  body('username').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isString().notEmpty(),
  body('role').optional().isIn(['admin', 'manager', 'operator', 'readonly']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new Error(errors.array().map((e) => e.msg).join(', '));
      const b = req.body as Record<string, unknown>;
      const hashedPassword = await bcrypt.hash(b.password as string, 12);
      const user = await prisma.user.create({ data: { username: b.username as string, email: b.email as string, password: hashedPassword, name: b.name as string, role: (b.role as 'operator') || 'operator' }, select: { id: true, username: true, email: true, name: true, role: true, status: true, createdAt: true } });
      res.status(201).json({ success: true, data: user });
    } catch (err) { next(err); }
  }
);

userRouter.put('/:id',
  requireRole('admin'),
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new Error(errors.array().map((e) => e.msg).join(', '));
      const id = req.params.id as string;
      const b = req.body as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (b.name) data.name = b.name;
      if (b.email) data.email = b.email;
      if (b.role) data.role = b.role;
      if (b.status) data.status = b.status;
      const user = await prisma.user.update({ where: { id }, data, select: { id: true, username: true, email: true, name: true, role: true, status: true } });
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }
);

userRouter.delete('/:id',
  requireRole('admin'),
  param('id').isUUID(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new Error(errors.array().map((e) => e.msg).join(', '));
      await prisma.user.delete({ where: { id: req.params.id as string } });
      res.json({ success: true });
    } catch (err) { next(err); }
  }
);

userRouter.get('/roles', (_req, res) => {
  res.json({ success: true, data: [
    { value: 'admin', label: '管理员' }, { value: 'manager', label: '业务经理' },
    { value: 'operator', label: '运营人员' }, { value: 'readonly', label: '只读用户' },
  ]});
});
