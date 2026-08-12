import { describe, it, expect } from 'vitest';
import { validateFourStage, fourStageScenarioSchema } from '../services/scenarioAI.js';

const validScenario = {
  title: '黄金定投场景',
  goal: '针对高净值客户推广黄金定投',
  category: 'growth',
  icon: 'Sparkles',
  color: 'blue',
  insightConfig: {
    targetTags: ['高净值', '黄金偏好'],
    analysisLogic: '基于资产规模和近期交易识别',
  },
  segmentConfig: {
    criteria: 'AUM>500万 且 30天内有黄金相关搜索',
    maxCount: 1000,
  },
  contentConfig: {
    style: '专业',
    channels: ['短信', '企微', 'APP'],
  },
  strategyConfig: {
    path: '触发：客户标签匹配 → 渠道：企微+短信 → 转化：APP下单',
  },
};

describe('fourStageScenarioSchema', () => {
  it('accepts a fully valid four-stage scenario', () => {
    const r = fourStageScenarioSchema.safeParse(validScenario);
    expect(r.success).toBe(true);
  });

  it('rejects when title exceeds 20 chars', () => {
    const r = fourStageScenarioSchema.safeParse({ ...validScenario, title: '一二三四五六七八九十一二三四五六七八九十一' });
    expect(r.success).toBe(false);
  });

  it('rejects when category is not in enum', () => {
    const r = fourStageScenarioSchema.safeParse({ ...validScenario, category: 'unknown' });
    expect(r.success).toBe(false);
  });

  it('rejects when insightConfig.targetTags is empty', () => {
    const r = fourStageScenarioSchema.safeParse({
      ...validScenario,
      insightConfig: { ...validScenario.insightConfig, targetTags: [] },
    });
    expect(r.success).toBe(false);
  });

  it('rejects when segmentConfig.maxCount is not positive', () => {
    const r = fourStageScenarioSchema.safeParse({
      ...validScenario,
      segmentConfig: { ...validScenario.segmentConfig, maxCount: 0 },
    });
    expect(r.success).toBe(false);
  });

  it('rejects when contentConfig.channels is empty', () => {
    const r = fourStageScenarioSchema.safeParse({
      ...validScenario,
      contentConfig: { ...validScenario.contentConfig, channels: [] },
    });
    expect(r.success).toBe(false);
  });

  it('rejects when strategyConfig is missing', () => {
    const { strategyConfig: _omit, ...rest } = validScenario;
    const r = fourStageScenarioSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });
});

describe('validateFourStage', () => {
  it('returns valid:true with typed data on success', () => {
    const r = validateFourStage(validScenario);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.data.title).toBe('黄金定投场景');
      expect(r.data.insightConfig.targetTags).toEqual(['高净值', '黄金偏好']);
    }
  });

  it('returns valid:false with multiple errors when several fields fail', () => {
    const r = validateFourStage({
      title: '',
      category: 'unknown',
      insightConfig: { targetTags: [], analysisLogic: '' },
      // missing segmentConfig / contentConfig / strategyConfig
    });
    expect(r.valid).toBe(false);
    if (!r.valid) {
      // expect at least these fields surfaced
      const joined = r.errors.join('|');
      expect(joined).toMatch(/title/);
      expect(joined).toMatch(/category/);
      expect(joined).toMatch(/insightConfig/);
    }
  });

  it('returns valid:false on non-object input', () => {
    const r = validateFourStage('not a scenario');
    expect(r.valid).toBe(false);
  });

  it('returns valid:false on null input', () => {
    const r = validateFourStage(null);
    expect(r.valid).toBe(false);
  });
});
