import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('notificationService', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.ALARM_NOTIFY_EMAILS;
    delete process.env.ALARM_NOTIFY_PHONES;
  });

  it('sendAlarmEmail returns false when SMTP not configured', async () => {
    const { sendAlarmEmail, _resetTransporter } = await import('../services/notificationService.js');
    _resetTransporter();
    const result = await sendAlarmEmail({
      name: 'Test', level: 'warning', metric: 'roi',
      currentValue: 1.0, threshold: 2.0, condition: 'lt', triggeredAt: new Date(),
    });
    expect(result).toBe(false);
  });

  it('sendAlarmEmail returns false when no recipients', async () => {
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_USER = 'test';
    process.env.SMTP_PASS = 'test';
    const { sendAlarmEmail, _resetTransporter } = await import('../services/notificationService.js');
    _resetTransporter();
    const result = await sendAlarmEmail({
      name: 'Test', level: 'warning', metric: 'roi',
      currentValue: 1.0, threshold: 2.0, condition: 'lt', triggeredAt: new Date(),
    });
    expect(result).toBe(false);
  });

  it('sendAlarmSms returns false when no recipients configured', async () => {
    const { sendAlarmSms } = await import('../services/notificationService.js');
    const result = await sendAlarmSms({
      name: 'Test', level: 'warning', metric: 'roi',
      currentValue: 1.0, threshold: 2.0, condition: 'lt', triggeredAt: new Date(),
    });
    expect(result).toBe(false);
  });

  it('sendAlarmSms returns true (logged) when recipients configured', async () => {
    process.env.ALARM_NOTIFY_PHONES = '+86-138-xxxx-xxxx';
    const { sendAlarmSms } = await import('../services/notificationService.js');
    const result = await sendAlarmSms({
      name: 'Test', level: 'warning', metric: 'roi',
      currentValue: 1.0, threshold: 2.0, condition: 'lt', triggeredAt: new Date(),
    });
    expect(result).toBe(true);
  });
});
