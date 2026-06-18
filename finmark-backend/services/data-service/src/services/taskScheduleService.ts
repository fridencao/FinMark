import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';

export interface CreateScheduleInput {
  name: string;
  scenarioId?: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  targetSegment?: string;
  channels: string[];
}

export interface UpdateScheduleInput {
  name?: string;
  scenarioId?: string;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  targetSegment?: string;
  channels?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export async function createSchedule(input: CreateScheduleInput) {
  return prisma.taskSchedule.create({
    data: {
      name: input.name,
      scenarioId: input.scenarioId,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig as Prisma.InputJsonValue,
      targetSegment: input.targetSegment,
      channels: input.channels,
      status: 'active',
    },
  });
}

export async function updateSchedule(id: string, input: UpdateScheduleInput) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.scenarioId !== undefined) data.scenarioId = input.scenarioId;
  if (input.triggerType !== undefined) data.triggerType = input.triggerType;
  if (input.triggerConfig !== undefined) data.triggerConfig = input.triggerConfig;
  if (input.targetSegment !== undefined) data.targetSegment = input.targetSegment;
  if (input.channels !== undefined) data.channels = input.channels;

  return prisma.taskSchedule.update({
    where: { id },
    data,
  });
}

export async function deleteSchedule(id: string) {
  return prisma.taskSchedule.delete({
    where: { id },
  });
}

export async function pauseSchedule(id: string) {
  const schedule = await prisma.taskSchedule.findUnique({ where: { id } });
  if (!schedule) throw new Error('Schedule not found');
  if (schedule.status === 'completed') throw new Error('Cannot pause a completed schedule');

  return prisma.taskSchedule.update({
    where: { id },
    data: { status: 'paused' },
  });
}

export async function resumeSchedule(id: string) {
  const schedule = await prisma.taskSchedule.findUnique({ where: { id } });
  if (!schedule) throw new Error('Schedule not found');
  if (schedule.status !== 'paused') throw new Error('Schedule is not paused');

  return prisma.taskSchedule.update({
    where: { id },
    data: { status: 'active' },
  });
}

export async function getActiveSchedules() {
  return prisma.taskSchedule.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function evaluateTriggers() {
  const now = new Date();
  return prisma.taskSchedule.findMany({
    where: {
      status: 'active',
      nextRunAt: { lte: now },
    },
    orderBy: { nextRunAt: 'asc' },
  });
}

export async function executeSchedule(id: string) {
  const schedule = await prisma.taskSchedule.findUnique({ where: { id } });
  if (!schedule) throw new Error('Schedule not found');
  if (schedule.status !== 'active') throw new Error('Schedule is not active');

  const execution = await prisma.taskScheduleExecution.create({
    data: {
      scheduleId: id,
      status: 'running',
      triggerType: schedule.triggerType,
    },
  });

  await prisma.taskSchedule.update({
    where: { id },
    data: { lastRunAt: new Date() },
  });

  return execution;
}

export async function getScheduleHistory(
  scheduleId: string,
  options: PaginationOptions & { status?: string } = {}
) {
  const { page = 1, limit = 20, status } = options;

  const where: Record<string, unknown> = { scheduleId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.taskScheduleExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.taskScheduleExecution.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
