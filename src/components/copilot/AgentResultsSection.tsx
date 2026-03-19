import React from 'react';
import { Users, BarChart3, PenTool, AlertTriangle, Zap, BarChart3 as AnalystIcon, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '@/stores/app';
import { useCopilotStore, type AgentType, type AgentStatus } from '@/stores/copilot';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  { type: 'analyst', label: '评估智能体', icon: <AnalystIcon className="w-5 h-5" />, color: 'bg-rose-500', description: '实时监控营销效果，提供ROI分析' },
];

export function AgentResultsSection() {
  const { language } = useAppStore();
  const { agentResults, streamingContent, isOrchestrating } = useCopilotStore();
  
  const t = language === 'zh' ? {
    executionDetails: '执行详情',
    exportPdf: '导出PDF',
    sharePlan: '分享方案',
    viewMetrics: '查看指标',
    regenerate: '重新生成',
    completed: '完成',
    reasoningTrace: '推理过程',
    traceDesc: '查看智能体决策链路'
  } : {
    executionDetails: 'Execution Details',
    exportPdf: 'Export PDF',
    sharePlan: 'Share Plan',
    viewMetrics: 'View Metrics',
    regenerate: 'Regenerate',
    completed: 'Completed',
    reasoningTrace: 'Reasoning Trace',
    traceDesc: 'View agent decision chain'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900">{t.executionDetails}</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs font-bold">{t.exportPdf}</Button>
          <Button variant="outline" size="sm" className="text-xs font-bold">{t.sharePlan}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AGENTS.filter(a => agentResults[a.type]?.status === 'completed' || isOrchestrating).map((agent) => {
          const result = agentResults[agent.type]?.content || streamingContent[agent.type] || '';
          const status = agentResults[agent.type]?.status || (isOrchestrating ? 'running' : 'completed');
          
          return (
            <motion.div
              key={agent.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg text-white", agent.color)}>{agent.icon}</div>
                  <span className="font-bold text-sm">{agent.label}</span>
                </div>
                <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                  {status === 'running' ? (language === 'zh' ? '运行中' : 'Running') : t.completed}
                </Badge>
              </div>

              <ScrollArea className="max-h-20">
                <div className="text-xs text-slate-600 leading-relaxed pr-2">
                  {result}
                </div>
              </ScrollArea>

              <div className="pt-2 mt-2 border-t border-slate-50 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                  onClick={() => alert(`${agent.label} 指标详情`)}
                >
                  {t.viewMetrics} →
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                  onClick={() => alert(`${agent.label} 重新生成`)}
                >
                  {t.regenerate}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 推理过程展示 */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h5 className="text-sm font-bold text-slate-900">{t.reasoningTrace}</h5>
          <span className="text-[10px] text-slate-400 font-normal">{t.traceDesc}</span>
        </div>
        
        <div className="space-y-3">
          {AGENTS.filter(a => agentResults[a.type]?.status === 'completed' || isOrchestrating).map((agent, idx) => (
            <div key={agent.type} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold", agent.color)}>
                  {idx + 1}
                </div>
                {idx < AGENTS.filter(a => agentResults[a.type]?.status === 'completed').length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-800">{agent.label}</span>
                  <span className="text-[10px] text-slate-400">
                    Decision Point: {agent.type === 'insight' ? 'Demand Analysis' : agent.type === 'segment' ? 'Audience Selection' : 'Strategy Optimization'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 bg-white border border-slate-100 p-3 rounded-xl shadow-sm group-hover:border-indigo-100 transition-colors">
                  {language === 'zh' 
                    ? `基于"推广新发基金"的上下文，执行了${agent.description}，并输出了核心逻辑。` 
                    : `Based on the context of "promoting new fund", executed ${agent.description} and outputted core logic.`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}