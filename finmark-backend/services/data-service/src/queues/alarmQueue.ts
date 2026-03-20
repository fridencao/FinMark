import { Queue, Worker, RedisOptions } from 'bullmq';
import { prisma } from '../config/database.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let alarmQueueInstance: Queue | null = null;
let alarmWorker: Worker | null = null;

export async function initAlarmQueue() {
  const connection: RedisOptions = {
    url: REDIS_URL,
  };

  alarmQueueInstance = new Queue('alarm-evaluation', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });

  alarmWorker = new Worker(
    'alarm-evaluation',
    async (job) => {
      if (job.name === 'evaluate-alarms') {
        await evaluateAlarms();
      }
    },
    { connection }
  );

  alarmWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  alarmWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return { queue: alarmQueueInstance, worker: alarmWorker };
}

async function evaluateAlarms() {
  const enabledRules = await prisma.alarmRule.findMany({
    where: { enabled: true },
  });

  for (const rule of enabledRules) {
    const metricValue = await getMetricValue(rule.metric);
    const triggered = checkCondition(metricValue, rule.condition, rule.threshold);

    if (triggered) {
      await prisma.alarmHistory.create({
        data: {
          ruleId: rule.id,
          value: metricValue,
          status: 'triggered',
        },
      });
      await sendNotification(rule, metricValue);
    }
  }
}

async function getMetricValue(metric: string): Promise<number> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const executions = await prisma.execution.findMany({
    where: {
      createdAt: { gte: yesterday, lte: now },
    },
  });

  switch (metric) {
    case 'reach_rate': {
      const totalReach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
      const totalTarget = executions.reduce((sum, e) => sum + (e.targetCount || 0), 0);
      return totalTarget > 0 ? (totalReach / totalTarget) * 100 : 0;
    }
    case 'conversion_rate': {
      const totalReach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
      const totalConv = executions.reduce((sum, e) => sum + (e.actualConversion || 0), 0);
      return totalReach > 0 ? (totalConv / totalReach) * 100 : 0;
    }
    case 'roi': {
      const rois = executions
        .filter((e) => e.result && (e.result as any).roi)
        .map((e) => (e.result as any).roi);
      return rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0;
    }
    case 'complaint_count': {
      // TODO: Implement when complaint tracking exists
      return 0;
    }
    case 'compliance_score': {
      // TODO: Implement when compliance scoring exists
      return 100;
    }
    default:
      return 0;
  }
}

function checkCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case 'lt':
      return value < threshold;
    case 'gt':
      return value > threshold;
    case 'lte':
      return value <= threshold;
    case 'gte':
      return value >= threshold;
    case 'eq':
      return value === threshold;
    default:
      return false;
  }
}

async function sendNotification(rule: any, value: number) {
  // TODO: Implement notification sending (email, SMS, etc.)
  console.log(`ALARM [${rule.level}]: ${rule.name} - Value: ${value}, Threshold: ${rule.threshold}`);
}

export const alarmQueue = {
  get: () => {
    if (!alarmQueueInstance) throw new Error('Queue not initialized');
    return alarmQueueInstance;
  },
  add: async (name: string, data: any) => {
    if (!alarmQueueInstance) throw new Error('Queue not initialized');
    return alarmQueueInstance.add(name, data);
  },
  close: async () => {
    if (alarmWorker) await alarmWorker.close();
    if (alarmQueueInstance) await alarmQueueInstance.close();
  },
};

export { evaluateAlarms, checkCondition, getMetricValue };
