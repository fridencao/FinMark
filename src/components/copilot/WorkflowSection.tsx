import React from 'react';
import { ShieldCheck, Users, PenTool, Zap, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '@/stores/app';
import { useCopilotStore, type AgentType, type AgentStatus } from '@/stores/copilot';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AgentState {
  type: AgentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const AGENTS: AgentState[] = [
  { type: 'insight', label: '洞察智能体', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', description: '分析客户行为，挖掘潜在金融需求' },
  { type: 'segment', label: '客群智能体', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-emerald-500', description: '精准定义目标客群，实现分层营销' },
  { type: 'content', label: '内容智能体', icon: <PenTool className="w-5 h-5" />, color: 'bg-purple-500', description: '生成个性化营销文案' },
  { type: 'compliance', label: '合规智能体', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-500', description: '审查文案禁语，确保金融合规' },
  { type: 'strategy', label: '策略智能体', icon: <Zap className="w-5 h-5" />, color: 'bg-orange-500', description: '制定多渠道触达路径与预算分配' },
  { type: 'analyst', label: '评估智能体', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-rose-500', description: '实时监控营销效果，提供ROI分析' },
];

export function WorkflowSection() {
  const { language } = useAppStore();
  const { isOrchestrating, currentStep, setIsOrchestrating, agentResults } = useCopilotStore();
  
  const t = language === 'zh' ? {
    orchestrating: '多智能体协同编排中...',
    activating: '正在按序激活专家智能体执行子任务',
    planGenerated: '方案已生成',
    stop: '停止编排',
    completed: '完成'
  } : {
    orchestrating: 'Multi-Agent Orchestrating...',
    activating: 'Activating expert agents to execute sub-tasks',
    planGenerated: 'Plan Generated',
    stop: 'Stop',
    completed: 'Completed'
  };

  const handleStop = () => {
    setIsOrchestrating(false);
  };

  return (
    <Card className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
            isOrchestrating ? "bg-indigo-600 animate-pulse" : "bg-slate-900"
          )}>
            {isOrchestrating ? <Zap className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-xl">
              {isOrchestrating ? t.orchestrating : t.planGenerated}
            </h3>
            <p className="text-sm text-slate-500">
              {isOrchestrating ? t.activating : language === 'zh' ? '可以开始执行或查看详情' : 'Ready to execute or view details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOrchestrating && (
            <Button
              onClick={handleStop}
              variant="outline"
              className="mr-4 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all border border-rose-100"
            >
              {t.stop}
            </Button>
          )}
          {isOrchestrating && (
            <div className="flex gap-1 mr-4">
              <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
              <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
              <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
            </div>
          )}
          <Badge className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            {t.completed}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 relative">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 -z-10" />
        
        {AGENTS.map((agent, index) => {
          const execution = agentResults[agent.type];
          const isCompleted = execution?.status === 'completed';
          const isActive = currentStep === index + 1;
          const isRunning = isOrchestrating && isActive;
          
          return (
            <div key={agent.type} className="flex flex-col items-center text-center space-y-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative",
                  isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" :
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110" :
                  "bg-white border-2 border-slate-100 text-slate-300"
                )}
              >
                {isCompleted ? <ShieldCheck className="w-6 h-6" /> : (isRunning ? <Loader2 className="w-6 h-6 animate-spin" /> : agent.icon)}
                {isActive && !isRunning && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping" />}
              </div>
              <div className="space-y-1">
                <p className={cn("text-xs font-bold", isCompleted ? "text-emerald-600" : isActive ? "text-indigo-600" : "text-slate-400")}>
                  {agent.label}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight px-2">
                  {language === 'zh' ? agent.description.split('，')[0] : agent.description.split(',')[0]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}