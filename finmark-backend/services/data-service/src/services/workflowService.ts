import { prisma } from '../config/database.js';

export async function getAllWorkflows(status?: string) {
  const where: any = {};
  if (status) where.status = status;

  return prisma.workflow.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { executions: true } },
    },
  });
}

export async function getWorkflowById(id: string) {
  return prisma.workflow.findUnique({
    where: { id },
    include: {
      executions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
}) {
  return prisma.workflow.create({
    data: {
      ...data,
      status: 'draft',
    },
  });
}

export async function updateWorkflow(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    enabled: boolean;
    status: string;
  }>
) {
  const updateData: any = { ...data };
  if (data.status) updateData.status = data.status as any;
  
  return prisma.workflow.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteWorkflow(id: string) {
  return prisma.workflow.delete({
    where: { id },
  });
}

export async function executeWorkflow(id: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  return prisma.workflowExecution.create({
    data: {
      workflowId: id,
      status: 'pending',
      context: {
        startedBy: 'manual',
      },
    },
  });
}

export async function getExecutionHistory(workflowId?: string) {
  const where: any = {};
  if (workflowId) where.workflowId = workflowId;

  return prisma.workflowExecution.findMany({
    where,
    include: {
      workflow: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function updateExecutionStatus(
  id: string,
  status: string,
  result?: any
) {
  const data: any = { status };
  if (result) data.result = result;
  if (status === 'completed') data.completedAt = new Date();
  if (status === 'running') data.startedAt = new Date();

  return prisma.workflowExecution.update({
    where: { id },
    data,
  });
}
