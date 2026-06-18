import React, { useState } from 'react';
import { Users, BarChart3, PenTool, AlertTriangle, Zap, BarChart3 as AnalystIcon, Settings, Play, Pause, Activity, Loader2, BookOpen, Cpu, SlidersHorizontal } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { getAgentStatus, getAgentConfigs, updateAgentConfig, toggleAgent, type AgentConfig } from '@/services/agent';
import { getModels } from '@/services/settings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const defaultAgents = [
  { id: 'insight', type: 'insight', name: '洞察智能体', description: '分析客户行为，挖掘潜在金融需求', color: 'bg-blue-500' },
  { id: 'segment', type: 'segment', name: '客群智能体', description: '精准定义目标客群，实现分层营销', color: 'bg-emerald-500' },
  { id: 'content', type: 'content', name: '内容智能体', description: '生成个性化营销文案', color: 'bg-purple-500' },
  { id: 'compliance', type: 'compliance', name: '合规智能体', description: '审查文案禁语，确保金融合规', color: 'bg-red-500' },
  { id: 'strategy', type: 'strategy', name: '策略智能体', description: '制定多渠道触达路径与预算分配', color: 'bg-orange-500' },
  { id: 'analyst', type: 'analyst', name: '评估智能体', description: '实时监控营销效果，提供ROI分析', color: 'bg-rose-500' },
];

const agentIcons: Record<string, React.ElementType> = {
  insight: Users,
  segment: BarChart3,
  content: PenTool,
  compliance: AlertTriangle,
  strategy: Zap,
  analyst: AnalystIcon,
};

// Mirrors backend defaults in agent-service/src/prompts/index.ts
const DEFAULT_PROMPTS: Record<string, string> = {
  insight: `你是一个金融客户洞察专家。严格按照下面的章节结构输出 Markdown 报告，每个章节只输出模板中列出的内容，不要添加或重复内容。

## 客户洞察分析报告
- **目标客群特征**: [分析核心特征]
- **潜在流失风险**: [分析流失原因和概率]
- **最佳营销时机**: [指出关键时间窗口]
- **推荐客户标签**: [建议标签]

## 深度见解与风险预警
- **深度见解**: [数据驱动的独特发现]
- **风险预警**: [需要关注的风险]
- **行动建议**: [具体的下一步]

硬性要求：
1. "推荐客户标签"只出现在"客户洞察分析报告"章节，不得在"深度见解与风险预警"章节中出现
2. 两个章节的内容必须完全不同，不允许任何交叉重复
3. 严格按照模板格式输出，不要额外增加或合并章节`,
  segment: `你是一个精准客群专家。请根据洞察结果，生成：
1. 客户筛选条件（标签、AUM、年龄、风险等级等）
2. 预计覆盖客户数量
3. 客群画像描述

输出格式：Markdown + 结构化 JSON。
重要：如果客户规模超过 10 万，请提醒设置上限。`,
  content: `你是一个金融文案专家。请根据客群画像和营销目标，生成：
1. 默认 3 组不同风格的营销文案
2. 每组文案适配的渠道（短信/企微/APP）
3. 文案变量（客户姓名、产品名称、权益信息等）

输出格式：Markdown + 结构化 JSON。
注意：自动适配不同渠道的内容长度限制，避免违禁词。`,
  compliance: `你是一个金融合规审查专家。请审查文案：
1. 检查违禁词（保本保息、绝对收益等）
2. 校验风险等级匹配
3. 审核话术合规性
4. 补充必要风险提示语

像审计员一样严格，高亮违禁词并给出修改建议。
输出格式：Markdown + 结构化 JSON。`,
  strategy: `你是一个营销策略专家。请制定触达方案：
1. 多渠道触达路径（优先级排序）
2. 触达时间节点
3. 预算分配建议
4. 预期触达率和 ROI

支持定时/周期/事件任务，支持 A/B 测试版本生成。
输出格式：Markdown + 结构化 JSON。`,
  analyst: `你是一个营销效果评估专家。请分析：
1. 核心指标（触达率、响应率、转化率、ROI）
2. 异常检测（指标偏离告警）
3. 优化建议

支持实时监控、历史对比、归因分析。
输出格式：Markdown + 结构化 JSON。`,
};

export function AgentsPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configAgent, setConfigAgent] = useState<any>(null);
  const [agentConfig, setAgentConfig] = useState<{ temperature: number; maxTokens: number; model: string; prompt: string }>({ temperature: 0.7, maxTokens: 4096, model: '', prompt: '' });

  const { data: configsData, isLoading: configsLoading } = useQuery({
    queryKey: ['agent-configs'],
    queryFn: getAgentConfigs,
  });

  const { data: statusData } = useQuery({
    queryKey: ['agent-status'],
    queryFn: () => getAgentStatus(),
    retry: false,
  });

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['settings-models'],
    queryFn: getModels,
    enabled: configDialogOpen,
  });

  const models = (modelsData?.data || []) as any[];
  const statuses = statusData?.data || {};
  const configs: AgentConfig[] = configsData?.data ?? [];

  const getConfig = (agentType: string) => configs.find(c => c.agentType === agentType);

  const toggleMutation = useMutation({
    mutationFn: (agentType: string) => toggleAgent(agentType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-configs'] }),
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ agentType, data }: { agentType: string; data: Partial<AgentConfig> }) =>
      updateAgentConfig(agentType, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      setConfigDialogOpen(false);
    },
  });

  const t = translations[language].agentsPage;

  const getStats = (agentId: string) => {
    const s = statuses[agentId];
    return {
      calls: s?.calls || 0,
      successRate: s?.successRate || 0,
      responseTime: s?.responseTime || '—',
    };
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultAgents.map(agent => {
          const stats = getStats(agent.id);
          const config = getConfig(agent.id);
          const isRunning = config?.enabled ?? true;
          const Icon = agentIcons[agent.id] || Activity;

          return (
            <Card key={agent.id} className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${agent.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{agent.name}</h4>
                    <Badge variant={isRunning ? 'success' : 'secondary'} className="text-[10px] mt-1 rounded-xl">
                      {isRunning ? t.running : t.stopped}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={isRunning}
                  onCheckedChange={() => toggleMutation.mutate(agent.id)}
                  disabled={toggleMutation.isPending}
                />
              </div>

              <p className="text-xs text-slate-500 mb-4">{agent.description}</p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="text-sm font-bold text-indigo-600">{stats.calls}</div>
                  <div className="text-[10px] text-slate-400">{t.todayCalls}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="text-sm font-bold text-emerald-600">{stats.successRate > 0 ? `${stats.successRate}%` : '—'}</div>
                  <div className="text-[10px] text-slate-400">{t.successRate}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <div className="text-sm font-bold text-blue-600">{stats.responseTime}</div>
                  <div className="text-[10px] text-slate-400">{t.avgResponseTime}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => {
                  setConfigAgent(agent);
                  const cfg = getConfig(agent.id);
                  const defaultM = models.length > 0 ? (models.find((m: any) => m.isDefault) || models[0]) : null;
                  setAgentConfig({
                    temperature: cfg?.temperature ?? 0.7,
                    maxTokens: cfg?.maxTokens ?? 4096,
                    model: cfg?.modelId || (defaultM ? (defaultM.modelVersion || defaultM.name) : ''),
                    prompt: cfg?.prompt || DEFAULT_PROMPTS[agent.type] || '',
                  });
                  setConfigDialogOpen(true);
                }}>
                  <Settings className="w-4 h-4 mr-1" />
                  {t.config}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={isRunning ? 'text-red-500' : 'text-emerald-500'}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{configAgent?.name} — {language === 'zh' ? '智能体配置' : 'Agent Config'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="model" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="shrink-0">
              <TabsTrigger value="model">
                <Cpu className="w-3.5 h-3.5 mr-1.5" />
                {language === 'zh' ? '模型配置' : 'Model'}
              </TabsTrigger>
              <TabsTrigger value="prompt">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {t.systemPrompt}
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto min-h-0 py-6 px-1">
              <TabsContent value="model" className="mt-0">
                <div className="space-y-5">
                  {/* Model Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <SlidersHorizontal className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {language === 'zh' ? '模型' : 'Model'}
                    </Label>
                    {modelsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'zh' ? '加载模型中...' : 'Loading models...'}
                      </div>
                    ) : models.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">
                        {language === 'zh'
                          ? '暂无可选模型，请先在「系统设置」中配置模型'
                          : 'No models available. Configure in Settings first.'}
                      </p>
                    ) : (
                      <Select
                        value={agentConfig.model || undefined}
                        onValueChange={v => setAgentConfig(c => ({ ...c, model: v }))}
                      >
                        <SelectTrigger className="w-full"><SelectValue placeholder={language === 'zh' ? '选择模型' : 'Select model'} /></SelectTrigger>
                        <SelectContent>
                          {models.map((m: any) => (
                            <SelectItem key={m.id} value={m.modelVersion || m.name}>
                              {m.name}{m.modelVersion ? ` (${m.modelVersion})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <SlidersHorizontal className="w-3 h-3 inline mr-1 -mt-0.5" />
                        Temperature
                      </Label>
                      <span className="text-sm font-mono font-bold text-indigo-600 tabular-nums min-w-[2.5rem] text-right">
                        {agentConfig.temperature.toFixed(1)}
                      </span>
                    </div>
                    <Slider value={[agentConfig.temperature * 10]} min={0} max={20} step={1} onValueChange={v => setAgentConfig(c => ({ ...c, temperature: v[0] / 10 }))} />
                    <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                      <span>0.0</span>
                      <span>{t.temperature}</span>
                      <span>2.0</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <SlidersHorizontal className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {t.maxTokens}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={agentConfig.maxTokens}
                        onChange={e => setAgentConfig(c => ({ ...c, maxTokens: Math.max(256, Math.min(131072, parseInt(e.target.value) || 4096)) }))}
                        className="w-28 font-mono text-sm tabular-nums"
                      />
                      <span className="text-xs text-slate-400">
                        {language === 'zh' ? '范围: 256 ~ 131,072' : 'Range: 256 ~ 131,072'}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="prompt" className="space-y-4 mt-0">
                <div>
                  <Label className="flex items-center gap-2">
                    {t.systemPrompt}
                    <span className="text-xs text-slate-400 font-normal">({t.promptPlaceholder})</span>
                  </Label>
                  <p className="text-xs text-slate-400 mt-1 mb-3">{t.promptTip}</p>
                  <Textarea
                    value={agentConfig.prompt}
                    onChange={e => setAgentConfig(c => ({ ...c, prompt: e.target.value }))}
                    placeholder={language === 'zh'
                      ? `你是一个金融${configAgent?.type === 'insight' ? '客户洞察专家' : '智能体'}。编写该智能体的系统提示词...`
                      : `You are an AI agent specialized in ${configAgent?.type || 'marketing'}...`
                    }
                    className="min-h-[300px] font-mono text-xs leading-relaxed resize-y"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="shrink-0 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
            <Button
              onClick={() => {
                if (configAgent) {
                  updateConfigMutation.mutate({
                    agentType: configAgent.type,
                    data: {
                      prompt: agentConfig.prompt,
                      modelId: agentConfig.model || undefined,
                      temperature: agentConfig.temperature,
                      maxTokens: agentConfig.maxTokens,
                    },
                  });
                }
              }}
              disabled={updateConfigMutation.isPending}
            >{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
