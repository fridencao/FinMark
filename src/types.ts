export interface CustomerInsight {
  id: string;
  title: string;
  description: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Segment {
  id: string;
  name: string;
  count: number;
  tags: string[];
  description: string;
}

export interface MarketingContent {
  id: string;
  channel: 'SMS' | 'Email' | 'Push';
  title: string;
  body: string;
}

export interface CampaignStrategy {
  id: string;
  name: string;
  steps: string[];
  budget: number;
  expectedRoi: number;
}

export interface PerformanceData {
  name: string;
  value: number;
}

export interface StrategyTemplate {
  insightLogic?: string;
  segmentCriteria?: string;
  contentStyle?: string;
  strategyPath?: string;
  analystMetrics?: string[];
}

export interface Scenario {
  id: string;
  title: string;
  icon: string;
  goal: string;
  color: string;
  template?: StrategyTemplate;
  isCustom?: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  prompt: string;
  version: string;
  lastUpdated: string;
  status: 'active' | 'draft' | 'deprecated';
}

export interface StrategyAtom {
  id: string;
  name: string;
  category: string;
  description: string;
  successRate: number;
  usageCount: number;
  tags: string[];
}

export interface PerformanceMetric {
  scenarioId: string;
  conversionRate: number;
  roi: number;
  reachCount: number;
  lift: number;
}
