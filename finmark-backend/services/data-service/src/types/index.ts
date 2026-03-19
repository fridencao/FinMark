import { prisma } from '../config/database.js';

export async function createAuditLog(
  userId: string | undefined,
  action: string,
  resource: string,
  details: unknown,
  ip: string | undefined
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details as object,
        ip,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
