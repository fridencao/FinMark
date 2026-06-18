import { prisma } from '../config/database.js';

export async function getComplianceScore(startDate: Date, endDate: Date): Promise<number> {
  const logs = await prisma.complianceCheckLog.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { score: true },
  });
  if (logs.length === 0) return 100;
  const sum = logs.reduce((acc, l) => acc + l.score, 0);
  return sum / logs.length;
}
