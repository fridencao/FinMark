/**
 * AgentConfigClient — 让 agent-service 在不直接连 PG 的前提下,也能用上
 * data-service 里 AgentConfig 持久化的 \`modelId\`。
 *
 * 数据源: data-service 的 \`GET /api/agents/configs/:agentType\`(已经存在)。
 * 策略: in-memory Map + 5 分钟 TTL,启动时 prefetch 一次,
 *       之后命中用 cache,miss 或过期再 fetch。
 *
 * 容错: data-service 不可达时返回 null(不阻断 agent 调用),
 *       调用方会回退到 hardcoded 默认 model。
 */
import axios from 'axios';

const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 3000;

export type AgentType =
  | 'insight' | 'segment' | 'content'
  | 'compliance' | 'strategy' | 'analyst';

export const ALL_AGENT_TYPES: readonly AgentType[] = [
  'insight', 'segment', 'content', 'compliance', 'strategy', 'analyst',
] as const;

interface CacheEntry {
  modelId: string | null;
  fetchedAt: number;
}

const cache = new Map<AgentType, CacheEntry>();

/** 单 agent 拉一次(命中即返;miss/过期才走 HTTP) */
export async function getModelFor(agentType: AgentType): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(agentType);
  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return hit.modelId;
  }
  try {
    const res = await axios.get(
      `${DATA_SERVICE_URL}/api/agents/configs/${agentType}`,
      { timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true },
    );
    if (res.status >= 200 && res.status < 300 && res.data?.success) {
      const modelId = (res.data.data?.modelId as string | null | undefined) ?? null;
      cache.set(agentType, { modelId, fetchedAt: now });
      return modelId;
    }
  } catch (err) {
    console.warn(`[agentConfigClient] fetch ${agentType} failed:`, (err as Error).message);
  }
  // 失败时记 null(避免每请求都重试),TTL 到期后才会再试
  cache.set(agentType, { modelId: null, fetchedAt: now });
  return null;
}

/** 启动时批量预热,让首次调用无延迟 */
export async function prefetch(): Promise<void> {
  await Promise.all(ALL_AGENT_TYPES.map((t) => getModelFor(t)));
}

/** 测试用:清 cache */
export function _clearCache(): void {
  cache.clear();
}
