import { prisma } from '../config/database.js';

export interface Branch {
  id: string;
  name: string;
  weight: number;
  impressions: number;
  conversions: number;
}

/**
 * 前端创建测试时只传 {name, traffic}，缺少 id/weight/impressions/conversions。
 * 该类型用于兼容两种输入（完整 Branch 或仅前端表单字段）。
 */
interface RawBranch {
  id?: string;
  name: string;
  weight?: number;
  traffic?: number;
  impressions?: number;
  conversions?: number;
}

/** 将任意形态的分支输入规范化为完整 Branch（补 id、映射 traffic→weight、初始化计数） */
function normalizeBranches(branches: RawBranch[]): Branch[] {
  return branches.map((b, i) => ({
    id: b.id || `branch-${Date.now()}-${i}`,
    name: b.name,
    weight: typeof b.weight === 'number' ? b.weight : (typeof b.traffic === 'number' ? b.traffic : 50),
    impressions: typeof b.impressions === 'number' ? b.impressions : 0,
    conversions: typeof b.conversions === 'number' ? b.conversions : 0,
  }));
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
      branches: normalizeBranches(input.branches as unknown as RawBranch[]) as unknown as object,
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

export async function recordConversion(testId: string, branchId: string, count: number = 1) {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');
  if (test.status !== 'running') throw new Error('Test must be running to record conversions');

  const branches = test.branches as unknown as Branch[];
  const branchIndex = branches.findIndex((b) => b.id === branchId);
  if (branchIndex === -1) throw new Error(`Branch ${branchId} not found`);

  branches[branchIndex].conversions += count;

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

/** 标准正态 CDF 近似（Abramowitz & Stegun 7.1.26） */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-(x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

/** 两比例 z 检验，返回 z 与双尾 p-value */
function twoPropZTest(c1: number, n1: number, c2: number, n2: number): { z: number; pValue: number } {
  if (n1 === 0 || n2 === 0) return { z: 0, pValue: 1 };
  const p1 = c1 / n1;
  const p2 = c2 / n2;
  const pPool = (c1 + c2) / (n1 + n2);
  if (pPool === 0 || pPool === 1) return { z: 0, pValue: 1 };
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, pValue: 1 };
  const z = Math.abs(p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(z));
  return { z, pValue };
}

/** Wilson 95% 置信区间下界（返回 0~1 比例的置信下限） */
function wilsonLower(conversions: number, impressions: number, z = 1.96): number {
  if (impressions === 0) return 0;
  const p = conversions / impressions;
  const denom = 1 + (z * z) / impressions;
  const centre = p + (z * z) / (2 * impressions);
  const margin = z * Math.sqrt((p * (1 - p)) / impressions + (z * z) / (4 * impressions * impressions));
  return Math.max(0, (centre - margin) / denom);
}

export async function getResults(testId: string) {
  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');

  const branches = (test.branches as unknown as Branch[]).map((b) => ({
    id: b.id,
    name: b.name,
    sampleSize: b.impressions,
    conversionCount: b.conversions,
    conversionRate: b.impressions > 0 ? b.conversions / b.impressions : 0,
    confidence: b.impressions > 0 ? wilsonLower(b.conversions, b.impressions) * 100 : 0,
  }));

  if (branches.length === 0) {
    return {
      testId,
      name: test.name,
      status: test.status,
      metric: test.metric,
      branches,
      winner: null,
      winnerBranchId: null,
      isSignificant: false,
      pValue: 1,
    };
  }

  // 选出转化率最高的分支作为候选胜者
  const sorted = [...branches].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const rest = sorted.slice(1);

  // 多分支显著性：最佳分支 vs 其余分支合并（池化）的两比例 z 检验
  let pValue = 1;
  if (rest.length > 0) {
    const cRest = rest.reduce((s, b) => s + b.conversionCount, 0);
    const nRest = rest.reduce((s, b) => s + b.sampleSize, 0);
    pValue = twoPropZTest(best.conversionCount, best.sampleSize, cRest, nRest).pValue;
  }

  const isSignificant = pValue < 0.05;

  const hasTie = branches.every(
    (b) => Math.abs(b.conversionRate - best.conversionRate) < 0.0001
  );

  const winnerId = hasTie ? null : best.id;

  return {
    testId,
    name: test.name,
    status: test.status,
    metric: test.metric,
    branches,
    winner: winnerId,
    winnerBranchId: winnerId,
    isSignificant,
    pValue,
  };
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
