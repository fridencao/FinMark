import { prisma } from '../config/database.js';

export async function getComplaintCount(startDate: Date, endDate: Date): Promise<number> {
  return prisma.complaint.count({
    where: { createdAt: { gte: startDate, lte: endDate } },
  });
}
