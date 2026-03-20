import { prisma } from '../config/database.js';
import { alarmQueue } from '../queues/alarmQueue.js';

export async function getAllRules() {
  return prisma.alarmRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { history: true } },
    },
  });
}

export async function getRuleById(id: string) {
  return prisma.alarmRule.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { triggeredAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function createRule(data: {
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  level: string;
  channels: string[];
}) {
  return prisma.alarmRule.create({
    data: {
      ...data,
      channels: JSON.stringify(data.channels),
    },
  });
}

export async function updateRule(
  id: string,
  data: Partial<{
    name: string;
    metric: string;
    condition: string;
    threshold: number;
    level: string;
    channels: string[];
    enabled: boolean;
  }>
) {
  const updateData: any = { ...data };
  if (data.channels) {
    updateData.channels = JSON.stringify(data.channels);
  }
  return prisma.alarmRule.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteRule(id: string) {
  return prisma.alarmRule.delete({
    where: { id },
  });
}

export async function toggleRule(id: string, enabled: boolean) {
  return prisma.alarmRule.update({
    where: { id },
    data: { enabled },
  });
}

export async function getHistory(ruleId?: string, status?: string) {
  const where: any = {};
  if (ruleId) where.ruleId = ruleId;
  if (status) where.status = status;

  return prisma.alarmHistory.findMany({
    where,
    include: { rule: true },
    orderBy: { triggeredAt: 'desc' },
    take: 50,
  });
}

export async function acknowledgeAlarm(id: string) {
  return prisma.alarmHistory.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveAlarm(id: string) {
  return prisma.alarmHistory.update({
    where: { id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
    },
  });
}

export async function triggerManualEvaluation() {
  await alarmQueue.add('evaluate-alarms', {
    timestamp: new Date().toISOString(),
    manual: true,
  });
}
