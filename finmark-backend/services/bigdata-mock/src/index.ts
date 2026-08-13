/**
 * bigdata-mock — 本地/演示用 GraphQL 端点,模拟行方大数据平台。
 *
 * 暴露的 schema 是 data-service 的 bigDataService 在用契约的镜像:
 *   GetCustomerSegment / GetCustomerBehavior / SearchSegmentCustomers /
 *   GetAudiencePreview / HealthCheck。
 *
 * 返回确定性 mock 数据(基于 customerId / segmentId 哈希),保证前端
 * 同一客户多次调用拿到相同结果,方便 demo 和测试。
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import gql from 'graphql-tag';

const PORT = Number(process.env.PORT) || 4000;

// ---------- 确定性 mock 数据生成 ----------

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], n: number): T[] {
  return arr.slice(0, Math.max(0, Math.min(n, arr.length)));
}

const TAG_POOL = [
  '高净值', '潜力', '稳健', '流失风险', '新晋',
  '理财活跃', '信用卡偏好', '数字渠道', '保守型', '进取型',
];
const CHANNEL_POOL = ['APP', '企微', '短信', '微信', '电话', '外呼'];
const PRODUCT_POOL = [
  { product: '理财-稳享', amount: 250000 },
  { product: '理财-进取', amount: 80000 },
  { product: '存款-3M', amount: 150000 },
  { product: '存款-1Y', amount: 200000 },
  { product: '信用卡-白金', amount: 0 },
  { product: '基金-股票型', amount: 60000 },
];
const SEGMENT_POOL = [
  { id: 'seg-vip', name: 'VIP 客户', level: 'A' },
  { id: 'seg-mass', name: '大众客群', level: 'C' },
  { id: 'seg-growth', name: '成长期', level: 'B' },
  { id: 'seg-churn', name: '流失风险', level: 'B' },
  { id: 'seg-new', name: '新晋客户', level: 'C' },
];

function makeCustomer(id: string) {
  const h = hash(id);
  const seg = SEGMENT_POOL[h % SEGMENT_POOL.length];
  const tags = pick(TAG_POOL, 2 + (h % 3));
  return {
    id,
    segment: { ...seg, tags },
    behaviorScore: 50 + (h % 50),
    riskScore: (h % 100) / 10,
  };
}

function makeBehavior(id: string, days: number) {
  const h = hash(id + days);
  const txCount = 5 + (h % 30);
  const total = 20000 + (h % 80000);
  return {
    transactionCount: txCount,
    totalAmount: total,
    avgAmount: Math.round(total / txCount),
    channelUsage: pick(CHANNEL_POOL, 3).map((c) => ({ channel: c, count: 1 + ((h >> 2) % 10) })),
    productHoldings: pick(PRODUCT_POOL, 3).map((p) => ({ ...p, amount: p.amount + (h % 50000) })),
  };
}

function makeCustomerRow(id: string) {
  const h = hash(id);
  return {
    id,
    name: `客户${id.slice(-4)}`,
    asset: 50000 + (h % 950000),
    segment: SEGMENT_POOL[h % SEGMENT_POOL.length].name,
    tags: pick(TAG_POOL, 2 + (h % 3)),
  };
}

// ---------- GraphQL schema + resolvers ----------

const typeDefs = gql`
  type Segment {
    id: ID!
    name: String!
    level: String!
    tags: [String!]!
  }

  type Customer {
    id: ID!
    segment: Segment!
    behaviorScore: Float!
    riskScore: Float!
  }

  type ChannelUsage {
    channel: String!
    count: Int!
  }

  type ProductHolding {
    product: String!
    amount: Float!
  }

  type CustomerBehavior {
    transactionCount: Int!
    totalAmount: Float!
    avgAmount: Float!
    channelUsage: [ChannelUsage!]!
    productHoldings: [ProductHolding!]!
  }

  input CustomerFilters {
    minAsset: Float
    maxAsset: Float
    ageRange: [Int!]
    city: String
  }

  type CustomerRow {
    id: ID!
    name: String!
    asset: Float!
    segment: String!
    tags: [String!]!
  }

  type SegmentCustomers {
    total: Int!
    customers: [CustomerRow!]!
  }

  input ConditionInput {
    field: String!
    op: String!
    value: String!
  }

  type AudiencePreview {
    total: Int!
    sample: [CustomerRow!]!
  }

  type Query {
    customer(id: ID!): Customer
    customerBehavior(id: ID!, days: Int!): CustomerBehavior
    segmentCustomers(segmentId: ID!, filters: CustomerFilters): SegmentCustomers!
    audiencePreview(conditions: [ConditionInput!]!, limit: Int!): AudiencePreview!
  }
`;

const resolvers = {
  Query: {
    customer: (_: unknown, { id }: { id: string }) => makeCustomer(id),
    customerBehavior: (_: unknown, { id, days }: { id: string; days: number }) => makeBehavior(id, days),
    segmentCustomers: (_: unknown, { segmentId, filters }: { segmentId: string; filters?: { minAsset?: number; maxAsset?: number } }) => {
      const total = 1000 + (hash(segmentId) % 9000);
      const sample = Array.from({ length: 20 }, (_, i) => {
        const id = `${segmentId}-${i}`;
        const row = makeCustomerRow(id);
        if (filters?.minAsset !== undefined && row.asset < filters.minAsset) return { ...row, asset: filters.minAsset + 1000 };
        if (filters?.maxAsset !== undefined && row.asset > filters.maxAsset) return { ...row, asset: filters.maxAsset - 1000 };
        return row;
      });
      return { total, customers: sample };
    },
    audiencePreview: (_: unknown, { conditions, limit }: { conditions: unknown[]; limit: number }) => {
      const total = 500 + (hash(JSON.stringify(conditions)) % 5000);
      const sample = Array.from({ length: Math.min(10, limit) }, (_, i) => makeCustomerRow(`aud-${i}`));
      return { total, sample };
    },
  },
};

async function main() {
  const app = express();
  app.use(cors());

  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  app.use('/graphql', express.json(), expressMiddleware(apollo));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'bigdata-mock' }));

  app.listen(PORT, () => {
    console.log(`bigdata-mock GraphQL listening on http://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error('bigdata-mock failed to start:', err);
  process.exit(1);
});
