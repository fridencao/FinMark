import React from 'react';
import { Users, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/stores/app';
import { useCopilotStore } from '@/stores/copilot';

interface Scenario {
  id: string;
  title: string;
  goal: string;
  icon: React.ElementType;
  color: string;
}

const defaultScenarios = (t: any): Scenario[] => [
  { id: 'churn', title: t?.churnTitle || '流失挽回', goal: '识别近30天资产下降超过30%的客户并进行挽回营销', icon: Users, color: 'bg-rose-500' },
  { id: 'new_fund', title: t?.fundTitle || '新发基金推广', goal: '针对有理财经验且风险偏好为中高风险的客户推广新发ESG基金', icon: Zap, color: 'bg-indigo-500' },
  { id: 'credit', title: t?.creditTitle || '信用卡分期提升', goal: '筛选有大额消费记录但未办理分期的客户，推送分期优惠券', icon: TrendingUp, color: 'bg-emerald-500' },
  { id: 'pension', title: t?.pensionTitle || '个人养老金开户', goal: '针对符合开户条件且未开立养老金账户的代发工资客户进行推广', icon: ShieldCheck, color: 'bg-orange-500' },
];

export function QuickScenariosSection() {
  const { language } = useAppStore();
  const { isLoading, setGoal, startOrchestration } = useCopilotStore();

  const t = language === 'zh' ? {
    churnTitle: '流失挽回',
    fundTitle: '新发基金推广',
    creditTitle: '信用卡分期提升',
    pensionTitle: '个人养老金开户',
    executing: '执行中...',
  } : {
    churnTitle: 'Churn Recovery',
    fundTitle: 'New Fund Promo',
    creditTitle: 'Credit Card Installment',
    pensionTitle: 'Pension Account',
    executing: 'Executing...',
  };

  const scenarios = defaultScenarios(t);

  const handleSelectScenario = (scenario: Scenario) => {
    setGoal(scenario.goal);
    startOrchestration();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {scenarios.map((scenario) => (
        <Card
          key={scenario.id}
          className="p-6 cursor-pointer transition-all hover:shadow-md"
          onClick={() => handleSelectScenario(scenario)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${scenario.color}`}>
              <scenario.icon className="w-5 h-5" />
            </div>
          </div>
          
          <h4 className="font-bold text-sm mb-2">{scenario.title}</h4>
          <p className="text-xs text-slate-500 line-clamp-3">{scenario.goal}</p>

          <div className="mt-4 pt-4 border-t border-slate-50">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? t.executing : (language === 'zh' ? '启动场景' : 'Launch')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
