import { prisma } from '../config/database.js';
import { bigDataService } from './bigDataService.js';

export async function buildAudienceQuery(conditions: any[]) {
  const where: any = {};
  
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    
    switch (operator) {
      case 'eq':
        where[field] = value;
        break;
      case 'ne':
        where[field] = { not: value };
        break;
      case 'gt':
        where[field] = { gt: value };
        break;
      case 'gte':
        where[field] = { gte: value };
        break;
      case 'lt':
        where[field] = { lt: value };
        break;
      case 'lte':
        where[field] = { lte: value };
        break;
      case 'in':
        where[field] = { in: value };
        break;
      case 'contains':
        where[field] = { contains: value };
        break;
      case 'startsWith':
        where[field] = { startsWith: value };
        break;
      case 'endsWith':
        where[field] = { endsWith: value };
        break;
    }
  }
  
  return where;
}

export async function executeAudienceQuery(conditions: any[]) {
  const where = await buildAudienceQuery(conditions);
  
  const count = await prisma.customer.count({ where });
  return { total: count };
}

export async function getAudiencePreview(conditions: any[], limit: number = 1000) {
  const where = await buildAudienceQuery(conditions);
  
  const customers = await prisma.customer.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      segment: true,
      asset: true,
      tags: true,
    },
  });
  
  const total = await prisma.customer.count({ where });
  
  return { total, sample: customers };
}

export async function saveAudienceSegment(name: string, conditions: any[], description?: string) {
  return prisma.audienceSegment.create({
    data: {
      name,
      description,
      conditions,
      status: 'active',
    },
  });
}

export async function getAudienceSegments(status?: string) {
  const where: any = {};
  if (status) where.status = status;
  
  return prisma.audienceSegment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBigDataAudiencePreview(conditions: any[], limit: number = 1000) {
  try {
    return await bigDataService.getAudiencePreview(conditions, limit);
  } catch (error) {
    console.error('Big Data Platform unavailable, using local data');
    return await getAudiencePreview(conditions, limit);
  }
}
