/**
 * 短信 OTP(一次性验证码)服务。
 *
 * 内存实现,够本地与单测用;真实部署建议换 Redis 带 TTL,
 * 但接口保持不变,只换 store 即可。
 *
 * 安全约束:
 *   - 5 分钟过期
 *   - 60 秒内不能重发
 *   - 5 次错误后该 code 失效
 *   - 错误信息不区分"手机号不存在/验证码错",防枚举
 */
import { getSmsProvider } from './smsProvider.js';

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
const CODE_LENGTH = 6;

export type OtpErrorCode =
  | 'COOLDOWN'
  | 'INVALID'
  | 'EXPIRED'
  | 'TOO_MANY_ATTEMPTS';

export class OtpError extends Error {
  readonly code: OtpErrorCode;
  readonly retryAfterMs?: number;
  constructor(code: OtpErrorCode, message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'OtpError';
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const store = new Map<string, OtpEntry>();

/** 清理过期项(惰性) */
function gc(now: number) {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

function randomCode(): string {
  // 6 位数字,前导 0 允许
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

/**
 * 请求发送一个验证码。返回的 expiresInSec 给前端做倒计时展示。
 * 命中冷却时抛 OtpError(COOLDOWN, retryAfterMs)。
 */
export async function requestOtp(phone: string): Promise<{ expiresInSec: number }> {
  const now = Date.now();
  gc(now);

  const existing = store.get(phone);
  if (existing && now - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    throw new OtpError(
      'COOLDOWN',
      '请求过于频繁,请稍后再试',
      OTP_RESEND_COOLDOWN_MS - (now - existing.lastSentAt),
    );
  }

  const code = randomCode();
  const expiresAt = now + OTP_TTL_MS;
  store.set(phone, { code, expiresAt, attempts: 0, lastSentAt: now });

  await getSmsProvider().send(phone, code);

  return { expiresInSec: Math.floor(OTP_TTL_MS / 1000) };
}

/**
 * 校验验证码。成功返回 true,失败抛 OtpError。
 * 不存在的手机号与错误验证码都返回 INVALID,防枚举。
 */
export function verifyOtp(phone: string, code: string): boolean {
  const now = Date.now();
  const entry = store.get(phone);

  if (!entry) {
    throw new OtpError('INVALID', '验证码无效');
  }
  if (entry.expiresAt <= now) {
    store.delete(phone);
    throw new OtpError('EXPIRED', '验证码已过期,请重新获取');
  }
  if (entry.attempts >= OTP_MAX_ATTEMPTS) {
    store.delete(phone);
    throw new OtpError('TOO_MANY_ATTEMPTS', '尝试次数过多,请重新获取验证码');
  }
  if (entry.code !== code) {
    entry.attempts += 1;
    if (entry.attempts >= OTP_MAX_ATTEMPTS) store.delete(phone);
    throw new OtpError('INVALID', '验证码无效');
  }

  // 校验通过,清掉条目(一次性)
  store.delete(phone);
  return true;
}

/** 测试辅助:清空 store */
export function _resetOtpStore(): void {
  store.clear();
}
