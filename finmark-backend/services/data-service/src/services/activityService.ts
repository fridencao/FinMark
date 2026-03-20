import { prisma } from '../config/database.js';

export async function getActivityDetails(activityId: string) {
  const execution = await prisma.execution.findUnique({
    where: { id: activityId },
    include: {
      scenario: true,
    },
  });

  if (!execution) {
    throw new Error('Activity not found');
  }

  const metrics = await getActivityMetrics(activityId);
  const timeline = await getActivityTimeline(execution);
  const customerBreakdown = await getCustomerBreakdown(activityId);

  return {
    execution,
    metrics,
    timeline,
    customerBreakdown,
  };
}

async function getActivityMetrics(activityId: string) {
  const execution = await prisma.execution.findUnique({
    where: { id: activityId },
  });

  if (!execution) {
    return {
      reach: 0,
      reachRate: 0,
      responseRate: 0,
      conversionRate: 0,
      roi: 0,
    };
  }

  const reach = execution.actualReach || 0;
  const response = execution.actualResponse || 0;
  const conversion = execution.actualConversion || 0;
  const target = execution.targetCount || 0;

  return {
    reach,
    reachRate: target > 0 ? ((reach / target) * 100).toFixed(2) : '0',
    responseRate: reach > 0 ? ((response / reach) * 100).toFixed(2) : '0',
    conversionRate: reach > 0 ? ((conversion / reach) * 100).toFixed(2) : '0',
    roi: (execution.result as any)?.roi || 0,
  };
}

async function getActivityTimeline(execution: any) {
  const timeline = [
    { event: 'Created', timestamp: execution.createdAt, type: 'info' },
  ];

  if (execution.startedAt) {
    timeline.push({ event: 'Started', timestamp: execution.startedAt, type: 'success' });
  }

  if (execution.completedAt) {
    timeline.push({ event: 'Completed', timestamp: execution.completedAt, type: 'success' });
  }

  if (execution.status === 'failed') {
    timeline.push({ event: 'Failed', timestamp: execution.updatedAt, type: 'error' });
  }

  if (execution.status === 'paused') {
    timeline.push({ event: 'Paused', timestamp: execution.updatedAt, type: 'warning' });
  }

  return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

async function getCustomerBreakdown(activityId: string) {
  const execution = await prisma.execution.findUnique({
    where: { id: activityId },
    include: {
      scenario: true,
    },
  });

  if (!execution) {
    return {
      bySegment: [],
      byChannel: [],
      byRegion: [],
    };
  }

  const channels = execution.scenario?.config?.channels || [];
  const channelBreakdown = Array.isArray(channels) 
    ? channels.map((c: any) => ({
        channel: typeof c === 'string' ? c : c.name,
        count: Math.floor((execution.actualReach || 0) / (channels.length || 1)),
      }))
    : [];

  return {
    bySegment: [
      { segment: '新客', count: Math.floor((execution.actualReach || 0) * 0.3) },
      { segment: '成长期', count: Math.floor((execution.actualReach || 0) * 0.25) },
      { segment: '成熟期', count: Math.floor((execution.actualReach || 0) * 0.25) },
      { segment: '衰退期', count: Math.floor((execution.actualReach || 0) * 0.1) },
      { segment: '挽回期', count: Math.floor((execution.actualReach || 0) * 0.1) },
    ],
    byChannel: channelBreakdown,
    byRegion: [
      { region: '华东', count: Math.floor((execution.actualReach || 0) * 0.35) },
      { region: '华北', count: Math.floor((execution.actualReach || 0) * 0.25) },
      { region: '华南', count: Math.floor((execution.actualReach || 0) * 0.20) },
      { region: '其他', count: Math.floor((execution.actualReach || 0) * 0.20) },
    ],
  };
}

export async function listActivities(options?: {
  scenarioId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  if (options?.scenarioId) where.scenarioId = options.scenarioId;
  if (options?.status) where.status = options.status;

  const page = options?.page || 1;
  const limit = options?.limit || 20;

  const [executions, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      include: {
        scenario: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.execution.count({ where }),
  ]);

  const activities = executions.map(e => ({
    id: e.id,
    name: (e.scenario as any)?.title || 'Unknown',
    status: e.status,
    reach: e.actualReach || 0,
    response: e.actualResponse || 0,
    conversion: e.actualConversion || 0,
    roi: (e.result as any)?.roi || 0,
    createdAt: e.createdAt,
    completedAt: e.completedAt,
  }));

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
