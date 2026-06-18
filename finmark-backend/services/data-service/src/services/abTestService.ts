import { prisma } from '../config/database.js';

export interface Branch {
  id: string;
  name: string;
  weight: number;
  impressions: number;
  conversions: number;
}

export interface CreateTestInput {
  name: string;
  type: string;
  description?: string;
  branches: Branch[];
  metric: string;
}

export async function createTest(input: CreateTestInput) {
  return prisma.abTest.create({
    data: {
      name: input.name,
      type: input.type,
      description: input.description,
      branches: input.branches as unknown as object,
      metric: input.metric,
    },
  });
}

export async function getTestById(id: string) {
  return prisma.abTest.findUnique({ where: { id } });
}

export async function listTests(filters?: { status?: string }) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.abTest.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.abTest.count({ where }),
  ]);

  return { data, pagination: { total, pages: 1 } };
}

export async function startTest(id: string) {
  const test = await prisma.abTest.findUnique({ where: { id } });
  if (!test) throw new Error('Test not found');
  if (test.status !== 'draft') throw new Error('Test must be in draft status to start');

  return prisma.abTest.update({
    where: { id },
    data: { status: 'running', startDate: new Date() },
  });
}

export async function stopTest(id: string) {
  const test = await prisma.abTest.findUnique({ where: { id } });
  if (!test) throw new Error('Test not found');
  if (test.status !== 'running') throw new Error('Test must be running to stop');

  return prisma.abTest.update({
    where: { id },
    data: { status: 'completed', endDate: new Date() },
  });
}

export async function recordConversion(testId: string, branchId: string) {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');
  if (test.status !== 'running') throw new Error('Test must be running to record conversions');

  const branches = test.branches as unknown as Branch[];
  const branchIndex = branches.findIndex((b) => b.id === branchId);
  if (branchIndex === -1) throw new Error(`Branch ${branchId} not found`);

  branches[branchIndex].conversions += 1;

  return prisma.abTest.update({
    where: { id: testId },
    data: { branches: branches as unknown as object },
  });
}

export async function allocateTraffic(testId: string, method: 'random' | 'percentage') {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');
  if (test.status !== 'running') throw new Error('Test must be running');

  const branches = test.branches as unknown as Branch[];
  let selectedBranch: Branch;

  if (method === 'random') {
    const idx = Math.floor(Math.random() * branches.length);
    selectedBranch = branches[idx];
  } else {
    const totalWeight = branches.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;
    selectedBranch = branches[0];
    for (const branch of branches) {
      random -= branch.weight;
      if (random <= 0) {
        selectedBranch = branch;
        break;
      }
    }
  }

  const updatedBranches = branches.map((b) =>
    b.id === selectedBranch.id ? { ...b, impressions: b.impressions + 1 } : b
  );

  await prisma.abTest.update({
    where: { id: testId },
    data: { branches: updatedBranches as unknown as object },
  });

  return { branch: selectedBranch.id };
}

export async function getResults(testId: string) {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');

  const branches = test.branches as unknown as Branch[];
  const branchResults = branches.map((b) => ({
    id: b.id,
    name: b.name,
    impressions: b.impressions,
    conversions: b.conversions,
    conversionRate: b.impressions > 0 ? b.conversions / b.impressions : 0,
  }));

  const isSignificant = checkSignificance(branchResults);

  const winnerResult = branchResults.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  );

  const hasTie = branchResults.every(
    (b) => Math.abs(b.conversionRate - winnerResult.conversionRate) < 0.0001
  );

  return {
    testId,
    name: test.name,
    status: test.status,
    metric: test.metric,
    branches: branchResults,
    winner: hasTie ? null : winnerResult.id,
    isSignificant,
  };
}

function checkSignificance(branches: { impressions: number; conversionRate: number }[]): boolean {
  if (branches.length < 2) return false;

  const [a, b] = branches;
  if (a.impressions < 30 || b.impressions < 30) return false;

  const p1 = a.conversionRate;
  const p2 = b.conversionRate;
  const n1 = a.impressions;
  const n2 = b.impressions;

  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  if (pPool === 0 || pPool === 1) return false;

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return false;

  const z = Math.abs(p1 - p2) / se;

  return z > 1.96;
}

export async function selectWinner(testId: string) {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');

  const branches = test.branches as unknown as Branch[];
  const branchResults = branches.map((b) => ({
    id: b.id,
    name: b.name,
    conversionRate: b.impressions > 0 ? b.conversions / b.impressions : 0,
  }));

  const best = branchResults.reduce((prev, curr) =>
    curr.conversionRate > prev.conversionRate ? curr : prev
  );

  const hasTie = branchResults.every(
    (b) => Math.abs(b.conversionRate - best.conversionRate) < 0.0001
  );

  return {
    winnerId: hasTie ? null : best.id,
    winnerName: hasTie ? null : best.name,
    conversionRate: best.conversionRate,
  };
}

export async function deleteTest(id: string) {
  const test = await prisma.abTest.findUnique({ where: { id } });
  if (!test) throw new Error('Test not found');
  if (test.status === 'running') throw new Error('Cannot delete a running test');

  return prisma.abTest.delete({ where: { id } });
}
