import nodemailer from 'nodemailer';

interface AlarmInfo {
  name: string;
  level: string;
  metric: string;
  currentValue: number;
  threshold: number;
  condition: string;
  triggeredAt: Date;
}

let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter | null {
  if (emailTransporter) return emailTransporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return emailTransporter;
}

function getAlarmEmails(): string[] {
  return (process.env.ALARM_NOTIFY_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getAlarmPhones(): string[] {
  return (process.env.ALARM_NOTIFY_PHONES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendAlarmEmail(info: AlarmInfo): Promise<boolean> {
  const transporter = getEmailTransporter();
  const recipients = getAlarmEmails();
  if (!transporter || recipients.length === 0) {
    console.warn('[Notification] SMTP not configured or no recipients, skipping email');
    return false;
  }
  const from = process.env.SMTP_FROM || 'finmark-alerts@example.com';
  const subject = `[FinMark 告警][${info.level.toUpperCase()}] ${info.name}`;
  const text = [
    `告警名称: ${info.name}`,
    `级别: ${info.level}`,
    `指标: ${info.metric}`,
    `当前值: ${info.currentValue}`,
    `阈值: ${info.threshold} (${info.condition})`,
    `触发时间: ${info.triggeredAt.toISOString()}`,
    '',
    '请登录 FinMark 平台查看详情。',
  ].join('\n');
  try {
    await transporter.sendMail({
      from,
      to: recipients.join(','),
      subject,
      text,
    });
    console.log(`[Notification] Alarm email sent to ${recipients.length} recipients`);
    return true;
  } catch (err) {
    console.error('[Notification] Email send failed:', err);
    return false;
  }
}

export async function sendAlarmSms(info: AlarmInfo): Promise<boolean> {
  const recipients = getAlarmPhones();
  if (recipients.length === 0) {
    console.warn('[Notification] No SMS recipients configured, skipping SMS');
    return false;
  }
  // SMS provider integration deferred — log the message.
  // When a real provider (Aliyun/Twilio) is configured, replace this block
  // with the SDK call using SMS_ACCESS_KEY_ID / SMS_ACCESS_KEY_SECRET / etc.
  const message = `[FinMark][${info.level.toUpperCase()}] ${info.name}: ${info.metric}=${info.currentValue} (阈值 ${info.threshold})`;
  console.log(`[Notification] Alarm SMS would be sent to ${recipients.length} recipients: ${message}`);
  return true;
}

// For tests
export function _resetTransporter() {
  emailTransporter = null;
}
