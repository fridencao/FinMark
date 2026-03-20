import { prisma } from '../config/database.js';

export async function createBatchStrategy(data: {
  name: string;
  description?: string;
  operations: any[];
  targetIds: string[];
}) {
  return prisma.batchStrategy.create({
    data,
  });
}

export async function executeBatchStrategy(id: string) {
  const batch = await prisma.batchStrategy.findUnique({
    where: { id },
  });

  if (!batch) {
    throw new Error('Batch strategy not found');
  }

  await prisma.batchStrategy.update({
    where: { id },
    data: { status: 'processing' },
  });

  const results: any[] = [];

  try {
    for (const operation of batch.operations as any[]) {
      const result = await executeOperation(operation, batch.targetIds);
      results.push(result);
    }

    await prisma.batchStrategy.update({
      where: { id },
      data: {
        status: 'completed',
        result: { results, successCount: results.length },
        executedAt: new Date(),
      },
    });

    return { success: true, results };
  } catch (error: any) {
    await prisma.batchStrategy.update({
      where: { id },
      data: {
        status: 'failed',
        result: { error: error.message },
      },
    });

    throw error;
  }
}

async function executeOperation(operation: any, targetIds: string[]) {
  const { type, action, data } = operation;

  switch (type) {
    case 'scenario':
      return executeScenarioOperation(action, data, targetIds);
    case 'template':
      return executeTemplateOperation(action, data, targetIds);
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

async function executeScenarioOperation(
  action: string,
  data: any,
  targetIds: string[]
) {
  switch (action) {
    case 'enable':
      return prisma.scenario.updateMany({
        where: { id: { in: targetIds } },
        data: { status: 'active' },
      });
    case 'disable':
      return prisma.scenario.updateMany({
        where: { id: { in: targetIds } },
        data: { status: 'paused' },
      });
    case 'delete':
      return prisma.scenario.deleteMany({
        where: { id: { in: targetIds } },
      });
    case 'update_category':
      return prisma.scenario.updateMany({
        where: { id: { in: targetIds } },
        data: { category: data.category },
      });
    default:
      throw new Error(`Unknown scenario action: ${action}`);
  }
}

async function executeTemplateOperation(
  action: string,
  data: any,
  targetIds: string[]
) {
  switch (action) {
    case 'activate':
      return prisma.template.updateMany({
        where: { id: { in: targetIds } },
        data: { status: 'active' },
      });
    case 'deactivate':
      return prisma.template.updateMany({
        where: { id: { in: targetIds } },
        data: { status: 'inactive' },
      });
    case 'delete':
      return prisma.template.deleteMany({
        where: { id: { in: targetIds } },
      });
    default:
      throw new Error(`Unknown template action: ${action}`);
  }
}

export async function getBatchStatus(id: string) {
  return prisma.batchStrategy.findUnique({
    where: { id },
  });
}

export async function cancelBatchStrategy(id: string) {
  const batch = await prisma.batchStrategy.findUnique({
    where: { id },
  });

  if (!batch || batch.status !== 'pending') {
    throw new Error('Can only cancel pending batches');
  }

  return prisma.batchStrategy.update({
    where: { id },
    data: { status: 'failed' },
  });
}

export async function getBatchStrategies(status?: string) {
  const where: any = {};
  if (status) where.status = status;

  return prisma.batchStrategy.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}
