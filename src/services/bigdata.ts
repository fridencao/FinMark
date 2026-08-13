/**
 * Frontend wrapper around data-service's bigdata proxy routes.
 *
 * data-service 的 bigDataService 直连 GraphQL 端点,不暴露给前端。
 * 通过 /api/bigdata/* 这组路由,前端可以走 data-service 鉴权 + 转发,
 * 调出 4 个大数据能力(单客户洞察、行为、分群客户、客群预览)。
 *
 * 真实生产环境:大 GraphQL 端点由行方提供,只需在 data-service 的
 * BIG_DATA_GRAPHQL_URL 环境变量里切换。Mock 模式:起 bigdata-mock 服务
 * (参见 finmark-backend/services/bigdata-mock),本地可联调。
 */
import api from './api';

export interface BigDataSegment {
  id: string;
  name: string;
  level: string;
  tags: string[];
}

export interface BigDataCustomer {
  id: string;
  segment: BigDataSegment;
  behaviorScore: number;
  riskScore: number;
}

export interface BigDataCustomerRow {
  id: string;
  name: string;
  asset: number;
  segment: string;
  tags: string[];
}

export interface BigDataCustomerBehavior {
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
  channelUsage: { channel: string; count: number }[];
  productHoldings: { product: string; amount: number }[];
}

export interface SegmentCustomersResult {
  total: number;
  customers: BigDataCustomerRow[];
}

export interface AudiencePreviewResult {
  total: number;
  sample: BigDataCustomerRow[];
}

export interface AudienceCondition {
  field: string;
  op: string;
  value: string;
}

export const getCustomerSegment = (customerId: string) =>
  api.get<{ success: true; data: BigDataCustomer }>(`/bigdata/customers/${encodeURIComponent(customerId)}/segment`);

export const getCustomerBehavior = (customerId: string, days = 30) =>
  api.get<{ success: true; data: BigDataCustomerBehavior }>(`/bigdata/customers/${encodeURIComponent(customerId)}/behavior?days=${days}`);

export const searchSegmentCustomers = (segmentId: string, filters?: { minAsset?: number; maxAsset?: number; ageMin?: number; ageMax?: number; city?: string }) => {
  const qs = new URLSearchParams();
  if (filters?.minAsset !== undefined) qs.set('minAsset', String(filters.minAsset));
  if (filters?.maxAsset !== undefined) qs.set('maxAsset', String(filters.maxAsset));
  if (filters?.ageMin !== undefined) qs.set('ageMin', String(filters.ageMin));
  if (filters?.ageMax !== undefined) qs.set('ageMax', String(filters.ageMax));
  if (filters?.city) qs.set('city', filters.city);
  return api.get<{ success: true; data: SegmentCustomersResult }>(`/bigdata/segments/${encodeURIComponent(segmentId)}/customers?${qs}`);
};

export const getAudiencePreview = (conditions: AudienceCondition[], limit = 1000) =>
  api.post<{ success: true; data: AudiencePreviewResult }>('/bigdata/audience/preview', { conditions, limit });
