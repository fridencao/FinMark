import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play, Copy, Clock, Users, Target, GitBranch, ShieldCheck, Zap, BarChart3, MessageSquare, Settings, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { getScenario, executeScenario } from '@/services/scenario';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const channelConfigs = [
  { id: 'app_push', name: 'APP推送', enabled: true, priority: 1, maxPerDay: 1 },
  { id: 'sms', name: '短信', enabled: true, priority: 2, maxPerDay: 2 },
  { id: 'call', name: '外呼', enabled: false, priority: 3, maxPerDay: 0 },
  { id: 'wechat', name: '企业微信', enabled: true, priority: 4, maxPerDay: 3 },
];

export function FactoryDetailPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: scenarioData, isLoading } = useQuery({
    queryKey: ['scenario', id],
    queryFn: () => getScenario(id!),
    enabled: !!id,
  });

  const [executeError, setExecuteError] = useState<string | null>(null);

  const executeMutation = useMutation({
    mutationFn: () => executeScenario(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenario', id] });
    },
    onError: (err: any) => {
      setExecuteError(err?.response?.data?.message || (language === 'zh' ? '执行失败' : 'Execution failed'));
    },
  });

  const scenario = scenarioData?.data;

  const [activeTab, setActiveTab] = useState('config');
  const [channels, setChannels] = useState(channelConfigs);
  const [showPreview, setShowPreview] = useState(false);

  const t = language === 'zh' ? {
    title: '场景详情', edit: '编辑', save: '保存', execute: '执行', duplicate: '复制', back: '返回',
    config: '基础配置', target: '目标客群', content: '内容配置', channels: '渠道配置', preview: '预览',
    complianceScore: '合规评分', riskLevel: '风险等级', lowRisk: '低风险', mediumRisk: '中风险', highRisk: '高风险',
    targetCustomers: '目标客户数', expectedROI: '预期ROI', schedule: '执行计划',
    startDate: '开始日期', endDate: '结束日期', frequency: '发送频率', daily: '每日',
    conditions: '筛选条件', field: '字段', operator: '运算符', value: '值', duration: '时间范围',
    channel: '渠道', priority: '优先级', maxPerDay: '每日上限', enabled: '启用',
    contentTitle: '标题', contentBody: '正文', buttons: '按钮', customerList: '客户列表',
    name: '姓名', level: '等级', assets: '资产', decline: '下降比例', status: '状态', response: '响应',
    aiOptimize: 'AI优化内容',
  } : {
    title: 'Scenario Detail', edit: 'Edit', save: 'Save', execute: 'Execute', duplicate: 'Duplicate', back: 'Back',
    config: 'Config', target: 'Target', content: 'Content', channels: 'Channels', preview: 'Preview',
    complianceScore: 'Compliance', riskLevel: 'Risk', lowRisk: 'Low', mediumRisk: 'Medium', highRisk: 'High',
    targetCustomers: 'Target Customers', expectedROI: 'Expected ROI', schedule: 'Schedule',
    startDate: 'Start Date', endDate: 'End Date', frequency: 'Frequency', daily: 'Daily',
    conditions: 'Conditions', field: 'Field', operator: 'Operator', value: 'Value', duration: 'Duration',
    channel: 'Channel', priority: 'Priority', maxPerDay: 'Max/Day', enabled: 'Enabled',
    contentTitle: 'Title', contentBody: 'Body', buttons: 'Buttons', customerList: 'Customer List',
    name: 'Name', level: 'Level', assets: 'Assets', decline: 'Decline', status: 'Status', response: 'Response',
    aiOptimize: 'AI Optimize',
  };

  const toggleChannel = (channelId: string) => {
    setChannels(channels.map(c =>
      c.id === channelId ? { ...c, enabled: !c.enabled } : c
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>{language === 'zh' ? '场景不存在' : 'Scenario not found'}</p>
        <Button variant="ghost" onClick={() => navigate('/factory')} className="mt-4">
          {t.back}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/factory')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{scenario.title}</h2>
            <p className="text-slate-500">{scenario.goal}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <ShieldCheck className="w-3 h-3 mr-1" />
            {t.complianceScore}: {scenario.complianceScore || '—'}
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Zap className="w-3 h-3 mr-1" />
            {scenario.riskLevel === 'low' ? t.lowRisk : scenario.riskLevel === 'medium' ? t.mediumRisk : t.highRisk}
          </Badge>
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-1" />
            {t.duplicate}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            {t.edit}
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              setExecuteError(null);
              executeMutation.mutate();
            }}
            disabled={executeMutation.isPending}
          >
            <Play className="w-4 h-4 mr-1" />
            {t.execute}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(scenario as any).targetCount?.toLocaleString() || scenario._count?.executions || 0}</p>
              <p className="text-xs text-slate-500">{t.targetCustomers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(scenario as any).expectedROI || '—'}x</p>
              <p className="text-xs text-slate-500">{t.expectedROI}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(scenario as any).status || 'draft'}</p>
              <p className="text-xs text-slate-500">{t.frequency}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scenario.riskLevel === 'low' ? t.lowRisk : t.mediumRisk}</p>
              <p className="text-xs text-slate-500">{t.riskLevel}</p>
            </div>
          </div>
        </Card>
      </div>

      {executeError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{executeError}</p>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">{t.config}</TabsTrigger>
          <TabsTrigger value="target">{t.target}</TabsTrigger>
          <TabsTrigger value="content">{t.content}</TabsTrigger>
          <TabsTrigger value="channels">{t.channels}</TabsTrigger>
          <TabsTrigger value="preview">{t.preview}</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-6">
          <Card className="p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              {t.conditions}
            </h4>
            <p className="text-sm text-slate-600">{(scenario as any).goal || scenario.goal}</p>
          </Card>
          <Card className="p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t.schedule}
            </h4>
            <p className="text-sm text-slate-600">
              {(scenario as any).schedule || language === 'zh' ? '未配置' : 'Not configured'}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="target" className="mt-6">
          <Card className="p-6">
            <p className="text-sm text-slate-500 text-center py-8">
              {language === 'zh' ? '客群数据需要从大数据平台获取' : 'Customer data requires big data platform integration'}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6 mt-6">
          <Card className="p-6">
            <h4 className="font-bold mb-4">{t.content}</h4>
            <p className="text-sm text-slate-600">{scenario.goal}</p>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6 mt-6">
          <Card className="p-6">
            <h4 className="font-bold mb-4">{t.channels}</h4>
            <div className="space-y-4">
              {channels.map(channel => (
                <div key={channel.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-xs text-slate-500">
                        {t.priority}: {channel.priority} | {t.maxPerDay}: {channel.maxPerDay}
                      </p>
                    </div>
                  </div>
                  <div className="w-32">
                    <Slider
                      defaultValue={[channel.priority]}
                      max={5} min={1} step={1}
                      disabled={!channel.enabled}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card className="p-6">
            <h4 className="font-bold mb-4">{t.preview}</h4>
            <div className="max-w-md mx-auto">
              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-indigo-600 p-4 text-white">
                  <p className="font-bold">FinMark</p>
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="font-bold text-lg">{scenario.title}</h4>
                  <p className="text-sm text-slate-600">{scenario.goal}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FactoryDetailPage;
