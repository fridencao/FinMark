import { Router } from 'express';
import type { Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { ValidationError, UnauthorizedError } from '../middleware/error.js';
import { createAuditLog } from '../types/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticate, getUserInfo, syncUser } from '../services/ldapService.js';
import { requestOtp, verifyOtp, OtpError } from '../services/otpService.js';

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

authRouter.post('/otp/request',
  body('phone')
    .isString()
    .trim()
    .matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的 11 位手机号'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const { phone } = req.body as { phone: string };
      const result = await requestOtp(phone);
      res.json({ success: true, data: { expiresInSec: result.expiresInSec } });
    } catch (err) {
      if (err instanceof OtpError) {
        if (err.code === 'COOLDOWN') {
          res.status(429).json({ success: false, error: { code: err.code, message: err.message, retryAfterMs: err.retryAfterMs } });
          return;
        }
        res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
        return;
      }
      next(err);
    }
  }
);

authRouter.post('/otp/verify',
  body('phone')
    .isString()
    .trim()
    .matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的 11 位手机号'),
  body('code').isString().trim().matches(/^\d{6}$/).withMessage('请输入 6 位数字验证码'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      const { phone, code } = req.body as { phone: string; code: string };
      verifyOtp(phone, code);

      // 校验通过,查找/创建用户,签发 JWT。
      // 演示阶段:手机号首次登录会自动建一个 operator 账号(username=phone),
      // 生产环境应该走手机号与已有账号的绑定或邀请流程。
      let user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        const hashedPlaceholder = await bcrypt.hash(`otp:${phone}`, 12);
        user = await prisma.user.create({
          data: {
            username: `phone_${phone}`,
            email: `${phone}@phone.local`,
            phone,
            password: hashedPlaceholder,
            name: `Phone ${phone.slice(-4)}`,
            role: 'operator',
          },
        });
      }
      if (user.status === 'disabled') throw new UnauthorizedError('账号已停用');

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const ip = typeof req.ip === 'string' ? req.ip : undefined;
      await createAuditLog(user.id, 'OTP_LOGIN', 'user', { phone }, ip);

      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
        authMethod: 'otp',
      });

      res.json({
        success: true,
        data: {
          token,
          user: { id: user.id, username: user.username, name: user.name, role: user.role },
        },
      });
    } catch (err) {
      if (err instanceof OtpError) {
        res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
        return;
      }
      next(err);
    }
  }
);

authRouter.post('/ldap', async (req, res, next) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const isValid = await authenticate(username, password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid LDAP credentials');
    }

    const ldapUserInfo = await getUserInfo(username);

    let user;
    if (ldapUserInfo) {
      user = await syncUser(ldapUserInfo);
    } else {
      user = await prisma.user.findUnique({ where: { username } });
      if (!user || user.status === 'disabled') {
        throw new UnauthorizedError('User not found or disabled');
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const ip = typeof req.ip === 'string' ? req.ip : undefined;
    await createAuditLog(user.id, 'LDAP_LOGIN', 'user', { username }, ip);

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      authMethod: 'ldap',
    });

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
