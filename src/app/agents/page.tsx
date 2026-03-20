import React, { useState } from 'react';
import { Users, BarChart3, PenTool, AlertTriangle, Zap, BarChart3 as AnalystIcon, Settings, Play, Pause, Activity } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { getAgentStatus } from '@/services/agent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

export function AgentsPage() {
  const { language } = useAppStore();
  const [agentStates, setAgentStates] = useState<Record<string, 'running' | 'stopped'>>({
    insight: 'running', segment: 'running', content: 'running',
    compliance: 'running', strategy: 'running', analyst: 'running',
  });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configAgent, setConfigAgent] = useState<any>(null);
  const [agentConfig, setAgentConfig] = useState({ temperature: 0.7, maxTokens: 4096 });

  const { data: statusData } = useQuery({
    queryKey: ['agent-status'],
    queryFn: () => getAgentStatus(),
    retry: false,
  });

  const statuses = statusData?.data || {};

  const t = language === 'zh' ? {
    title: '智能体管理', subtitle: '配置和管理AI智能体',
    status: '状态', running: '运行中', stopped: '已停止',
    todayCalls: '今日调用', successRate: '成功率', avgResponseTime: '平均响应时间',
    config: '配置', stop: '停止', start: '启动',
    modelConfig: '模型配置', temperature: '温度参数', maxTokens: '最大Token数',
    save: '保存配置', test: '测试',
  } : {
    title: 'Agent Management', subtitle: 'Configure and manage AI agents',
    status: 'Status', running: 'Running', stopped: 'Stopped',
    todayCalls: 'Today Calls', successRate: 'Success Rate', avgResponseTime: 'Avg Response',
    config: 'Config', stop: 'Stop', start: 'Start',
    modelConfig: 'Model Config', temperature: 'Temperature', maxTokens: 'Max Tokens',
    save: 'Save Config', test: 'Test',
  };

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
        <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
        <p className="text-slate-500">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultAgents.map(agent => {
          const stats = getStats(agent.id);
          const isRunning = agentStates[agent.id] === 'running';
          const Icon = agentIcons[agent.id] || Activity;

          return (
            <Card key={agent.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${agent.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{agent.name}</h4>
                    <Badge className={`text-[10px] mt-1 rounded-xl ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {isRunning ? t.running : t.stopped}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={isRunning}
                  onCheckedChange={(checked) =>
                    setAgentStates(prev => ({ ...prev, [agent.id]: checked ? 'running' : 'stopped' }))
                  }
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
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => { setConfigAgent(agent); setAgentConfig({ temperature: 0.7, maxTokens: 4096 }); setConfigDialogOpen(true); }}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{configAgent?.name} — {language === 'zh' ? '模型配置' : 'Model Config'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>{language === 'zh' ? '模型' : 'Model'}</Label>
              <Select defaultValue="gemini">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-pro">Gemini 2.0 Pro</SelectItem>
                  <SelectItem value="openai">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'zh' ? 'Temperature' : 'Temperature'}: {agentConfig.temperature}</Label>
              <Slider value={[agentConfig.temperature * 10]} min={0} max={20} step={1} onValueChange={v => setAgentConfig(c => ({ ...c, temperature: v[0] / 10 }))} />
            </div>
            <div>
              <Label>{language === 'zh' ? 'Max Tokens' : 'Max Tokens'}: {agentConfig.maxTokens}</Label>
              <Input type="number" value={agentConfig.maxTokens} onChange={e => setAgentConfig(c => ({ ...c, maxTokens: parseInt(e.target.value) || 4096 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
            <Button onClick={() => setConfigDialogOpen(false)}>{language === 'zh' ? '保存配置' : 'Save Config'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
