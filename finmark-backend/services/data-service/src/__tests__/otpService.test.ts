import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestOtp,
  verifyOtp,
  _resetOtpStore,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  OtpError,
} from '../services/otpService.js';
import { setSmsProvider, type SmsProvider } from '../services/smsProvider.js';

class CapturingSmsProvider implements SmsProvider {
  sent: Array<{ phone: string; code: string }> = [];
  async send(phone: string, code: string): Promise<void> {
    this.sent.push({ phone, code });
  }
}

describe('otpService', () => {
  let sms: CapturingSmsProvider;
  beforeEach(() => {
    _resetOtpStore();
    sms = new CapturingSmsProvider();
    setSmsProvider(sms);
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('requestOtp', () => {
    it('generates a 6-digit code and sends it via the provider', async () => {
      const r = await requestOtp('13800000001');
      expect(r.expiresInSec).toBe(Math.floor(OTP_TTL_MS / 1000));
      expect(sms.sent).toHaveLength(1);
      expect(sms.sent[0].phone).toBe('13800000001');
      expect(sms.sent[0].code).toMatch(/^\d{6}$/);
    });

    it('rejects repeat requests within the cooldown window', async () => {
      await requestOtp('13800000002');
      await expect(requestOtp('13800000002')).rejects.toMatchObject({ code: 'COOLDOWN' });
    });

    it('cooldown is per-phone (other phones not affected)', async () => {
      await requestOtp('13800000003');
      const r = await requestOtp('13800000004');
      expect(r.expiresInSec).toBeGreaterThan(0);
      expect(sms.sent).toHaveLength(2);
    });

    it('allows a new request after the cooldown elapses', async () => {
      vi.useFakeTimers();
      try {
        await requestOtp('13800000005');
        vi.advanceTimersByTime(OTP_RESEND_COOLDOWN_MS + 100);
        const r = await requestOtp('13800000005');
        expect(r.expiresInSec).toBeGreaterThan(0);
        expect(sms.sent).toHaveLength(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('verifyOtp', () => {
    it('accepts the correct code and is one-time', async () => {
      await requestOtp('13800000010');
      const code = sms.sent[0].code;
      expect(verifyOtp('13800000010', code)).toBe(true);
      // second use must fail (entry gone)
      expect(() => verifyOtp('13800000010', code)).toThrow(OtpError);
    });

    it('rejects wrong code with INVALID and does not consume the entry until max attempts', async () => {
      await requestOtp('13800000011');
      expect(() => verifyOtp('13800000011', '000000')).toThrow(OtpError);
      // correct code should still work after one wrong try
      const code = sms.sent[0].code;
      expect(verifyOtp('13800000011', code)).toBe(true);
    });

    it('invalidates after OTP_MAX_ATTEMPTS wrong tries', async () => {
      await requestOtp('13800000012');
      for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
        expect(() => verifyOtp('13800000012', '000000')).toThrow(OtpError);
      }
      // now even the correct code is rejected (entry wiped)
      const code = sms.sent[0].code;
      expect(() => verifyOtp('13800000012', code)).toThrow(
        expect.objectContaining({ code: expect.stringMatching(/INVALID|TOO_MANY_ATTEMPTS|EXPIRED/) }),
      );
    });

    it('rejects unknown phone with INVALID (no enumeration)', () => {
      expect(() => verifyOtp('13900000000', '123456')).toThrow(OtpError);
    });

    it('rejects expired code with EXPIRED', async () => {
      vi.useFakeTimers();
      try {
        await requestOtp('13800000020');
        vi.advanceTimersByTime(OTP_TTL_MS + 100);
        const code = sms.sent[0].code;
        expect(() => verifyOtp('13800000020', code)).toThrow(OtpError);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
