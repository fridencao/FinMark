import React, { useState } from 'react';
import { Users, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { useCopilotStore, type AgentType } from '@/stores/copilot';
import { callAgent, streamAgent } from '@/services/geminiService';

interface Scenario {
  id: string;
  title: string;
  goal: string;
  icon: React.ElementType;
  color: string;
}

const defaultScenarios = (t: any): Scenario[] => [
  { id: 'churn', title: t?.churnTitle || '流失挽回', goal: '识别近30天资产下降超过30%的客户并进行挽回营销', icon: Users, color: 'bg-rose-50' },
  { id: 'new_fund', title: t?.fundTitle || '新发基金推广', goal: '针对有理财经验且风险偏好为中高风险的客户推广新发ESG基金', icon: Zap, color: 'bg-indigo-50' },
  { id: 'credit', title: t?.creditTitle || '信用卡分期提升', goal: '筛选有大额消费记录但未办理分期的客户，推送分期优惠券', icon: TrendingUp, color: 'bg-emerald-50' },
  { id: 'pension', title: t?.pensionTitle || '个人养老金开户', goal: '针对符合开户条件且未开立养老金账户的代发工资客户进行推广', icon: ShieldCheck, color: 'bg-orange-50' },
];

export function QuickScenariosSection() {
  const { language } = useAppStore();
  const { isLoading, setGoal, setOrchestrating, setLoading, setMasterResult, setAgentResult, setCurrentStep } = useCopilotStore();
  const [error, setError] = useState<string | null>(null);

  const t = language === 'zh' ? {
    churnTitle: '流失挽回',
    fundTitle: '新发基金推广',
    creditTitle: '信用卡分期提升',
    pensionTitle: '个人养老金开户',
    executing: '执行中...',
    error: '执行失败，请重试'
  } : {
    churnTitle: 'Churn Recovery',
    fundTitle: 'New Fund Promo',
    creditTitle: 'Credit Card Installment',
    pensionTitle: 'Pension Account',
    executing: 'Executing...',
    error: 'Failed to execute, please try again'
  };

  const scenarios = defaultScenarios(t);

  const executeScenario = async (scenario: Scenario) => {
    try {
      setError(null);
      setGoal(scenario.goal);
      setCurrentStep(0);

      // 步骤 1: 调用主智能体
      setCurrentStep(1);
      const masterPrompt = `营销目标：${scenario.goal}`;
      const context = { goal: scenario.goal, scenarioId: scenario.id, language };

      let masterContent = '';
      for await (const chunk of streamAgent('master', masterPrompt, context, language)) {
        masterContent += chunk;
      }
      setMasterResult(masterContent);

      // 步骤 2: 并行调用各子智能体
      const agentTypes: AgentType[] = ['insight', 'segment', 'content', 'compliance', 'strategy', 'analyst'];

      setCurrentStep(2);
      await Promise.all(
        agentTypes.map(async (type) => {
          try {
            setAgentResult(type, { type, status: 'running', result: null });
            const agentPrompt = `基于营销目标：${scenario.goal}，以及总监的方案，请执行你的任务。`;
            const result = await callAgent(type, agentPrompt, { goal: scenario.goal, masterPlan: masterContent }, language);
            setAgentResult(type, { type, status: 'completed', result });
          } catch (err) {
            setAgentResult(type, {
              type,
              status: 'failed',
              result: null,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        })
      );

      setCurrentStep(3);
    } catch (err) {
      setError(t.error);
      console.error('Failed to execute scenario:', err);
    } finally {
      setLoading(false);
      setOrchestrating(false);
    }
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setOrchestrating(true);
    setLoading(true);
    executeScenario(scenario);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {scenarios.map((scenario) => (
        <Button
          key={scenario.id}
          onClick={() => handleSelectScenario(scenario)}
          disabled={isLoading}
          className={`p-4 rounded-2xl border border-slate-100 text-left transition-all hover:shadow-md group relative overflow-hidden ${scenario.color} disabled:opacity-50 disabled:cursor-not-allowed`}
          variant="ghost"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
            <scenario.icon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm mb-1">{scenario.title}</h4>
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{scenario.goal}</p>
        </Button>
      ))}
      {error && (
        <div className="col-span-full text-center text-sm text-red-500 mt-2">{error}</div>
      )}
    </div>
  );
}