import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play, Copy, Clock, Users, Target, GitBranch, ShieldCheck, Zap, BarChart3, MessageSquare, Settings, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/stores/app';
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

const defaultScenario = {
  id: 'churn',
  title: '流失挽回',
  goal: '识别近30天资产下降超过30%的客户并进行挽回营销',
  category: 'recovery',
  icon: 'Users',
  color: 'bg-rose-50',
  complianceScore: 98,
  riskLevel: 'low',
  targetCustomers: 12580,
  expectedROI: 3.5,
  channels: ['APP推送', '短信', '外呼'],
  schedule: { startDate: '2024-01-15', endDate: '2024-02-15', frequency: '每日' },
  conditions: [
    { field: '资产下降比例', operator: '>=', value: '30%', unit: 'percent', duration: '30天' },
    { field: '客户等级', operator: '=', value: 'VIP', unit: 'enum' },
    { field: '产品持有数', operator: '>=', value: '3', unit: 'count' },
  ],
  content: {
    title: '您的专属理财顾问想您了',
    body: '尊敬的VIP客户，您近期资产有变动，我们为您准备了专属理财产品，预期收益...',
    buttons: ['查看详情', '联系顾问'],
  },
};

const channelConfigs = [
  { id: 'app_push', name: 'APP推送', enabled: true, priority: 1, maxPerDay: 1 },
  { id: 'sms', name: '短信', enabled: true, priority: 2, maxPerDay: 2 },
  { id: 'call', name: '外呼', enabled: false, priority: 3, maxPerDay: 0 },
  { id: 'wechat', name: '企业微信', enabled: true, priority: 4, maxPerDay: 3 },
];

const sampleCustomers = [
  { id: 'C001', name: '张**', level: 'VIP', assets: 5800000, decline: 35, channel: 'APP推送', status: '已触达', response: '有意向' },
  { id: 'C002', name: '李**', level: 'VIP', assets: 3200000, decline: 42, channel: '短信', status: '已触达', response: '待跟进' },
  { id: 'C003', name: '王**', level: 'SVIP', assets: 12000000, decline: 38, channel: '外呼', status: '已触达', response: '已购买' },
  { id: 'C004', name: '赵**', level: 'VIP', assets: 2100000, decline: 31, channel: 'APP推送', status: '未触达', response: '-' },
  { id: 'C005', name: '刘**', level: 'VIP', assets: 4500000, decline: 55, channel: '短信', status: '已触达', response: '无意向' },
];

export function FactoryDetailPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const [scenario, setScenario] = useState(defaultScenario);
  const [activeTab, setActiveTab] = useState('config');
  const [channels, setChannels] = useState(channelConfigs);
  const [showPreview, setShowPreview] = useState(false);

  const t = language === 'zh' ? {
    title: '场景详情',
    edit: '编辑',
    save: '保存',
    execute: '执行',
    duplicate: '复制',
    back: '返回',
    config: '基础配置',
    target: '目标客群',
    content: '内容配置',
    channels: '渠道配置',
    preview: '预览',
    compliance: '合规审查',
    complianceScore: '合规评分',
    riskLevel: '风险等级',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险',
    targetCustomers: '目标客户数',
    expectedROI: '预期ROI',
    schedule: '执行计划',
    startDate: '开始日期',
    endDate: '结束日期',
    frequency: '发送频率',
    daily: '每日',
    conditions: '筛选条件',
    field: '字段',
    operator: '运算符',
    value: '值',
    duration: '时间范围',
    channel: '渠道',
    priority: '优先级',
    maxPerDay: '每日上限',
    enabled: '启用',
    contentTitle: '标题',
    contentBody: '正文',
    buttons: '按钮',
    customerList: '客户列表',
    name: '姓名',
    level: '等级',
    assets: '资产',
    decline: '下降比例',
    status: '状态',
    response: '响应',
    aiOptimize: 'AI优化内容',
  } : {
    title: 'Scenario Detail',
    edit: 'Edit',
    save: 'Save',
    execute: 'Execute',
    duplicate: 'Duplicate',
    back: 'Back',
    config: 'Config',
    target: 'Target',
    content: 'Content',
    channels: 'Channels',
    preview: 'Preview',
    compliance: 'Compliance',
    complianceScore: 'Compliance',
    riskLevel: 'Risk',
    lowRisk: 'Low',
    mediumRisk: 'Medium',
    highRisk: 'High',
    targetCustomers: 'Target Customers',
    expectedROI: 'Expected ROI',
    schedule: 'Schedule',
    startDate: 'Start Date',
    endDate: 'End Date',
    frequency: 'Frequency',
    daily: 'Daily',
    conditions: 'Conditions',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    duration: 'Duration',
    channel: 'Channel',
    priority: 'Priority',
    maxPerDay: 'Max/Day',
    enabled: 'Enabled',
    contentTitle: 'Title',
    contentBody: 'Body',
    buttons: 'Buttons',
    customerList: 'Customer List',
    name: 'Name',
    level: 'Level',
    assets: 'Assets',
    decline: 'Decline',
    status: 'Status',
    response: 'Response',
    aiOptimize: 'AI Optimize',
  };

  const toggleChannel = (channelId: string) => {
    setChannels(channels.map(c => 
      c.id === channelId ? { ...c, enabled: !c.enabled } : c
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {t.complianceScore}: {scenario.complianceScore}
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
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="w-4 h-4 mr-1" />
            {t.execute}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scenario.targetCustomers.toLocaleString()}</p>
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
              <p className="text-2xl font-bold">{scenario.expectedROI}x</p>
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
              <p className="text-2xl font-bold">{scenario.schedule.frequency}</p>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">{t.config}</TabsTrigger>
          <TabsTrigger value="target">{t.target}</TabsTrigger>
          <TabsTrigger value="content">{t.content}</TabsTrigger>
          <TabsTrigger value="channels">{t.channels}</TabsTrigger>
          <TabsTrigger value="preview">{t.preview}</TabsTrigger>
        </TabsList>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <Card className="p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              {t.conditions}
            </h4>
            <div className="space-y-3">
              {scenario.conditions.map((condition, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <Badge variant="outline">{condition.field}</Badge>
                  <span className="text-slate-400">{condition.operator}</span>
                  <Badge variant="secondary">{condition.value}</Badge>
                  <span className="text-xs text-slate-400">{condition.duration}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t.schedule}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t.startDate}</label>
                <Input type="date" value={scenario.schedule.startDate} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t.endDate}</label>
                <Input type="date" value={scenario.schedule.endDate} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t.frequency}</label>
                <Select defaultValue={scenario.schedule.frequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="每日">{t.daily}</SelectItem>
                    <SelectItem value="每周">每周</SelectItem>
                    <SelectItem value="每月">每月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Target Tab */}
        <TabsContent value="target" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.level}</TableHead>
                  <TableHead>{t.assets}</TableHead>
                  <TableHead>{t.decline}</TableHead>
                  <TableHead>{t.channel}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.response}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.level}</Badge>
                    </TableCell>
                    <TableCell>¥{customer.assets.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="text-rose-600 font-medium">{customer.decline}%</span>
                    </TableCell>
                    <TableCell>{customer.channel}</TableCell>
                    <TableCell>
                      <Badge variant={customer.status === '已触达' ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.response}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">{t.content}</h4>
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-1" />
                {t.aiOptimize}
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t.contentTitle}</label>
                <Input value={scenario.content.title} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t.contentBody}</label>
                <Textarea rows={4} value={scenario.content.body} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">{t.buttons}</label>
                <div className="flex gap-2">
                  {scenario.content.buttons.map((btn, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1">{btn}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
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
                      max={5} 
                      min={1} 
                      step={1}
                      disabled={!channel.enabled}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <Card className="p-6">
            <h4 className="font-bold mb-4">{t.preview}</h4>
            <div className="max-w-md mx-auto">
              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-indigo-600 p-4 text-white">
                  <p className="font-bold">FinMark</p>
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="font-bold text-lg">{scenario.content.title}</h4>
                  <p className="text-sm text-slate-600">{scenario.content.body}</p>
                  <div className="flex gap-2 pt-2">
                    {scenario.content.buttons.map((btn, idx) => (
                      <Button key={idx} size="sm" className="flex-1">
                        {btn}
                      </Button>
                    ))}
                  </div>
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
