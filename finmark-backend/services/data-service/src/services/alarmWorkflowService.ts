import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../middleware/error.js';

export async function acknowledgeAlarm(id: string) {
  const alarm = await prisma.alarmHistory.findUnique({ where: { id } });
  if (!alarm) throw new NotFoundError('Alarm');
  if (alarm.status === 'resolved') throw new ValidationError('Cannot acknowledge a resolved alarm');

  return prisma.alarmHistory.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      status: 'acknowledged',
    },
  });
}

export async function startProcessing(id: string) {
  const alarm = await prisma.alarmHistory.findUnique({ where: { id } });
  if (!alarm) throw new NotFoundError('Alarm');
  if (alarm.status !== 'acknowledged') {
    throw new ValidationError('Alarm must be acknowledged before processing');
  }

  return prisma.alarmHistory.update({
    where: { id },
    data: {
      status: 'processing',
      processedAt: new Date(),
    },
  });
}

export async function resolveAlarm(id: string) {
  const alarm = await prisma.alarmHistory.findUnique({ where: { id } });
  if (!alarm) throw new NotFoundError('Alarm');
  if (alarm.status === 'resolved') throw new ValidationError('Alarm is already resolved');

  return prisma.alarmHistory.update({
    where: { id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
    },
  });
}

export async function addComment(id: string, author: string, content: string) {
  const alarm = await prisma.alarmHistory.findUnique({ where: { id } });
  if (!alarm) throw new NotFoundError('Alarm');

  const existingComments = Array.isArray(alarm.comments) ? (alarm.comments as any[]) : [];
  const newComment = {
    id: crypto.randomUUID(),
    author,
    content,
    createdAt: new Date().toISOString(),
  };

  return prisma.alarmHistory.update({
    where: { id },
    data: {
      comments: [...existingComments, newComment],
    },
  });
}

export async function getAlarmDetails(id: string) {
  return prisma.alarmHistory.findUnique({
    where: { id },
    include: { rule: true },
  });
}

export async function getAlarmStats(startDate?: Date, endDate?: Date) {
  const dateFilter =
    startDate && endDate
      ? { triggeredAt: { gte: startDate, lte: endDate } }
      : {};

  const [total, byStatus] = await Promise.all([
    prisma.alarmHistory.count({ where: dateFilter }),
    prisma.alarmHistory.groupBy({
      by: ['status'],
      _count: true,
      where: dateFilter,
    }),
  ]);

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
  };
}

export async function getAlarmHistory(filters: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.startDate && filters.endDate) {
    where.triggeredAt = { gte: filters.startDate, lte: filters.endDate };
  }

  return prisma.alarmHistory.findMany({
    where,
    include: { rule: true },
    orderBy: { triggeredAt: 'desc' },
    take: 50,
  });
}
