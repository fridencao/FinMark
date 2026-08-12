/**
 * 场景 AI 生成 — 四段配置(zod 校验)
 *
 * 对齐 PRD 4.2:一个营销场景的完整配置由四段组成:
 *   - insightConfig:  目标洞察(客户标签 + 分析逻辑)
 *   - segmentConfig:  客群圈选(条件 + 上限)
 *   - contentConfig:  内容生成(风格 + 渠道)
 *   - strategyConfig: 策略执行(路径)
 *
 * LLM 调通后,先 JSON.parse 抽对象,再走 validateFourStage 严格校验,
 * 通过的才返回给前端做"四段预览";不通过的显式 errors,前端走引导补录,
 * 不再静默 fallback 假数据。
 */
import { z } from 'zod';

const categoryEnum = z.enum(['acquisition', 'growth', 'mature', 'declining', 'recovery']);
const iconEnum = z.enum(['Users', 'Zap', 'TrendingUp', 'ShieldCheck', 'Sparkles']);
const colorEnum = z.enum(['blue', 'green', 'orange', 'red', 'purple']);

export const fourStageScenarioSchema = z.object({
  title: z.string().min(1, 'title 不能为空').max(20, 'title 不能超过 20 字'),
  goal: z.string().min(1, 'goal 不能为空'),
  category: categoryEnum,
  icon: iconEnum,
  color: colorEnum,
  insightConfig: z.object({
    targetTags: z.array(z.string().min(1)).min(1, '至少 1 个客群标签'),
    analysisLogic: z.string().min(1, 'analysisLogic 不能为空'),
  }),
  segmentConfig: z.object({
    criteria: z.string().min(1, 'criteria 不能为空'),
    maxCount: z.number().int().positive('maxCount 必须是正整数'),
  }),
  contentConfig: z.object({
    style: z.string().min(1, 'style 不能为空'),
    channels: z.array(z.string().min(1)).min(1, '至少 1 个渠道'),
  }),
  strategyConfig: z.object({
    path: z.string().min(1, 'path 不能为空'),
  }),
});

export type FourStageScenario = z.infer<typeof fourStageScenarioSchema>;

export type ValidationResult =
  | { valid: true; data: FourStageScenario }
  | { valid: false; errors: string[] };

/**
 * 把 LLM 返回的 unknown 对象按四段 schema 严格校验。
 * 失败时返回每条 issue 的 path:message,便于前端在预览里逐条提示用户补录。
 */
export function validateFourStage(raw: unknown): ValidationResult {
  const result = fourStageScenarioSchema.safeParse(raw);
  if (result.success) return { valid: true, data: result.data };
  return {
    valid: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join('.') || '<root>'}: ${i.message}`,
    ),
  };
}
