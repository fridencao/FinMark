/**
 * A/B 测试 事件摄入服务(PRD 7.2 验收点)
 *
 * 真实场景下,渠道(短信/企微/APP push)和数据平台(行方大数据)以 firehose
 * 形式回传转化事件。这里做一层抽象:
 *
 *   1) 每条事件带 source(渠道或数据平台标识) + eventId(用于幂等去重)
 *   2) 同一 eventId 重复投递只算一次(防止渠道重试导致转化数翻倍)
 *   3) 不在 running 状态的测试直接拒绝(防止历史数据污染)
 *   4) branchId 不存在的明确报错(返回 rejected 列表,不入库)
 *   5) 单次 prisma update 写完全部累加(避免 N 次写)
 *
 * 老的 /:id/conversions 路由保留(UI 手动录入门),不破坏现有行为。
 */
import { prisma } from '../config/database.js';
import { recordConversion as addConversions } from './abTestService.js';

export type ConversionSource =
  | 'sms' | 'wechat' | 'app' | 'email' | 'phone'
  | 'bigdata' | 'crm' | 'webhook'
  | 'manual';

export interface ConversionEvent {
  /** 幂等键,同一 eventId 重复投递只算一次;不传则视为一次性事件 */
  eventId?: string;
  branchId: string;
  /** 数据源(channel/数据平台),统计/审计用 */
  source: ConversionSource;
  /** 客户 ID(可选,主要用于溯源) */
  customerId?: string;
  /** 渠道,跟 source 可能不同(比如 source=bigdata 但 channel=sms) */
  channel?: string;
  /** 转化价值,默认 1;带价值的可填(销售金额、点击价值等) */
  value?: number;
}

export interface IngestResult {
  total: number;
  /** 真正入账(进了 branch.conversions)的事件数 */
  accepted: number;
  /** eventId 重复,被幂等跳过的事件数 */
  deduped: number;
  rejected: Array<{ index: number; eventId?: string; reason: string }>;
  conversionsAdded: Record<string, number>;
}

/** 进程内幂等:已经处理过的 eventId 不再入账。重启会清空(生产用 Redis) */
const seen = new Map<string, { testId: string; branchId: string; ts: number }>();
const SEEN_TTL_MS = 24 * 60 * 60 * 1000;

function gcSeen() {
  const cutoff = Date.now() - SEEN_TTL_MS;
  for (const [k, v] of seen) {
    if (v.ts < cutoff) seen.delete(k);
  }
}

/**
 * 摄入一批转化事件,聚合到 A/B 测试的 branch 计数上。
 * 同一批内重复 eventId 也只算一次。
 */
export async function ingestEvents(testId: string, events: ConversionEvent[]): Promise<IngestResult> {
  gcSeen();

  const test = await prisma.abTest.findUnique({ where: { id: testId } });
  if (!test) throw new Error('Test not found');
  if (test.status !== 'running') throw new Error(`Test is ${test.status}, not running`);

  const branches = test.branches as unknown as Array<{ id: string; name: string }>;
  const branchIds = new Set(branches.map((b) => b.id));

  const rejected: IngestResult['rejected'] = [];
  let deduped = 0;
  // branchId -> count(去重后)
  const buckets = new Map<string, number>();

  events.forEach((e, idx) => {
    if (!e.branchId || !branchIds.has(e.branchId)) {
      rejected.push({ index: idx, eventId: e.eventId, reason: `unknown branchId: ${e.branchId}` });
      return;
    }
    if (e.eventId) {
      const key = `${testId}:${e.eventId}`;
      if (seen.has(key)) {
        // 同一 eventId 已处理(本次或上次),幂等跳过
        deduped += 1;
        return;
      }
      seen.set(key, { testId, branchId: e.branchId, ts: Date.now() });
    }
    if (!e.source) {
      rejected.push({ index: idx, eventId: e.eventId, reason: 'source is required' });
      return;
    }
    const value = typeof e.value === 'number' && e.value > 0 ? e.value : 1;
    buckets.set(e.branchId, (buckets.get(e.branchId) ?? 0) + value);
  });

  for (const [branchId, count] of buckets) {
    await addConversions(testId, branchId, count);
  }

  const conversionsAdded: Record<string, number> = {};
  for (const [branchId, count] of buckets) conversionsAdded[branchId] = count;

  return {
    total: events.length,
    accepted: events.length - rejected.length - deduped,
    deduped,
    rejected,
    conversionsAdded,
  };
}

/** 测试用:清幂等 cache */
export function _clearSeenForTests() {
  seen.clear();
}
