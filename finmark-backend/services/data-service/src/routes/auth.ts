import { Router } from 'express';
import type { Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { ValidationError, UnauthorizedError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';

export const authRouter: RouterType = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || user.status === 'disabled') {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const ip = typeof req.ip === 'string' ? req.ip : undefined;
    await createAuditLog(user.id, 'LOGIN', 'user', { username }, ip);

    const token = generateToken({ userId: user.id, username: user.username, role: user.role });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, name, role = 'operator' } = req.body as {
      username?: string; email?: string; password?: string; name?: string; role?: string;
    };

    if (!username || !email || !password || !name) {
      throw new ValidationError('All fields are required');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, name, role: role as 'operator' },
    });

    res.status(201).json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: authReq.user?.userId },
      select: { id: true, username: true, email: true, name: true, role: true, status: true, lastLogin: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedError();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});
