import React, { useState } from 'react';
import { Users, BarChart3, PenTool, AlertTriangle, Zap, BarChart3 as AnalystIcon, Settings, Play, Pause, Activity } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

interface Agent {
  id: string;
  type: string;
  name: string;
  description: string;
  status: 'running' | 'stopped';
  todayCalls: number;
  successRate: number;
  avgResponseTime: string;
}

const defaultAgents: Agent[] = [
  { id: 'insight', type: 'insight', name: '洞察智能体', description: '分析客户行为，挖掘潜在金融需求', status: 'running', todayCalls: 125, successRate: 98.5, avgResponseTime: '2.3s' },
  { id: 'segment', type: 'segment', name: '客群智能体', description: '精准定义目标客群，实现分层营销', status: 'running', todayCalls: 98, successRate: 96.2, avgResponseTime: '1.8s' },
  { id: 'content', type: 'content', name: '内容智能体', description: '生成个性化营销文案', status: 'running', todayCalls: 156, successRate: 94.8, avgResponseTime: '3.1s' },
  { id: 'compliance', type: 'compliance', name: '合规智能体', description: '审查文案禁语，确保金融合规', status: 'running', todayCalls: 142, successRate: 99.1, avgResponseTime: '0.5s' },
  { id: 'strategy', type: 'strategy', name: '策略智能体', description: '制定多渠道触达路径与预算分配', status: 'running', todayCalls: 87, successRate: 92.3, avgResponseTime: '2.0s' },
  { id: 'analyst', type: 'analyst', name: '评估智能体', description: '实时监控营销效果，提供ROI分析', status: 'running', todayCalls: 64, successRate: 95.7, avgResponseTime: '1.2s' },
];

export function AgentsPage() {
  const { language } = useAppStore();
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const t = language === 'zh' ? {
    title: '智能体管理',
    subtitle: '配置和管理AI智能体',
    status: '状态',
    running: '运行中',
    stopped: '已停止',
    todayCalls: '今日调用',
    successRate: '成功率',
    avgResponseTime: '平均响应时间',
    config: '配置',
    stop: '停止',
    start: '启动',
    modelConfig: '模型配置',
    temperature: '温度参数',
    maxTokens: '最大Token数',
    save: '保存配置',
    test: '测试',
  } : {
    title: 'Agent Management',
    subtitle: 'Configure and manage AI agents',
    status: 'Status',
    running: 'Running',
    stopped: 'Stopped',
    todayCalls: 'Today Calls',
    successRate: 'Success Rate',
    avgResponseTime: 'Avg Response',
    config: 'Config',
    stop: 'Stop',
    start: 'Start',
    modelConfig: 'Model Config',
    temperature: 'Temperature',
    maxTokens: 'Max Tokens',
    save: 'Save Config',
    test: 'Test',
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Users className="w-6 h-6" />;
      case 'segment': return <BarChart3 className="w-6 h-6" />;
      case 'content': return <PenTool className="w-6 h-6" />;
      case 'compliance': return <AlertTriangle className="w-6 h-6" />;
      case 'strategy': return <Zap className="w-6 h-6" />;
      case 'analyst': return <AnalystIcon className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case 'insight': return 'bg-blue-500';
      case 'segment': return 'bg-emerald-500';
      case 'content': return 'bg-purple-500';
      case 'compliance': return 'bg-red-500';
      case 'strategy': return 'bg-orange-500';
      case 'analyst': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const handleToggleStatus = (agentId: string) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, status: a.status === 'running' ? 'stopped' : 'running' } : a
    ));
  };

  const getStatusBadge = (status: string) => {
    return status === 'running'
      ? <Badge className="bg-emerald-100 text-emerald-700 rounded-xl">{language === 'zh' ? '运行中' : 'Running'}</Badge>
      : <Badge className="bg-slate-100 text-slate-700 rounded-xl">{language === 'zh' ? '已停止' : 'Stopped'}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
        <p className="text-slate-500">{t.subtitle}</p>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => (
          <Card
            key={agent.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-md ${
              selectedAgent?.id === agent.id ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${getAgentColor(agent.type)}`}>
                  {getAgentIcon(agent.type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{agent.name}</h4>
                  <Badge className={`text-[10px] mt-1 rounded-xl ${agent.status === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {agent.status === 'running' ? t.running : t.stopped}
                  </Badge>
                </div>
              </div>
              <Switch
                checked={agent.status === 'running'}
                onCheckedChange={() => handleToggleStatus(agent.id)}
              />
            </div>

            <p className="text-xs text-slate-500 mb-4">{agent.description}</p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="text-sm font-bold text-indigo-600">{agent.todayCalls}</div>
                <div className="text-[10px] text-slate-400">{t.todayCalls}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="text-sm font-bold text-emerald-600">{agent.successRate}%</div>
                <div className="text-[10px] text-slate-400">{t.successRate}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="text-sm font-bold text-blue-600">{agent.avgResponseTime}</div>
                <div className="text-[10px] text-slate-400">{t.avgResponseTime}</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl">
                <Settings className="w-4 h-4 mr-1" />
                {t.config}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={agent.status === 'running' ? 'text-red-500' : 'text-emerald-500'}
              >
                {agent.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Agent Config Panel */}
      {selectedAgent && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">
            {selectedAgent.name} - {t.modelConfig}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm">{language === 'zh' ? '模型选择' : 'Model'}</Label>
                <Select defaultValue="gemini">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini Pro</SelectItem>
                    <SelectItem value="claude">Claude 3</SelectItem>
                    <SelectItem value="qwen">Qwen</SelectItem>
                    <SelectItem value="ERNIE">ERNIE Bot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">{t.temperature}: 0.7</Label>
                <Slider defaultValue={[0.7]} max={1} step={0.1} className="mt-2" />
              </div>

              <div>
                <Label className="text-sm">{t.maxTokens}: 8192</Label>
                <Slider defaultValue={[8192]} max={32000} step={1000} className="mt-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm">{language === 'zh' ? '超时设置' : 'Timeout'}</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">60s</SelectItem>
                    <SelectItem value="120">120s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">{language === 'zh' ? '重试次数' : 'Retry Count'}</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  {t.test}
                </Button>
                <Button className="flex-1 bg-indigo-600">
                  {t.save}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}