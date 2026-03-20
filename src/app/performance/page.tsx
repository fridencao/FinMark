import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, ArrowUpRight, Plus, Pencil, Trash2, Bell, BellOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getDashboardMetrics, getDashboardTrend, getActivityReports,
  getAlarmRules, createAlarmRule, updateAlarmRule, deleteAlarmRule, toggleAlarmRule,
  AlarmRule
} from '@/services/performance';

const channelData = [
  { name: '企微', value: 65, color: '#10b981' },
  { name: '短信', value: 25, color: '#3b82f6' },
  { name: 'APP', value: 8, color: '#8b5cf6' },
  { name: '外呼', value: 2, color: '#f59e0b' },
];

const segmentData = [
  { name: '高净值', value: 40, color: '#3b82f6' },
  { name: '大众理财', value: 30, color: '#10b981' },
  { name: '年轻白领', value: 20, color: '#8b5cf6' },
  { name: '退休养老', value: 10, color: '#f59e0b' },
];

export function PerformancePage() {
  const { language } = useAppStore();
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmRule | null>(null);
  const [alarmForm, setAlarmForm] = useState({
    name: '',
    type: 'metric' as 'metric' | 'task' | 'system',
    metric: 'reach',
    operator: '>',
    value: '',
    duration: '',
    notifyMethods: [] as string[],
    notifyUsers: '',
  });
  const [alarmError, setAlarmError] = useState('');

  const qc = useQueryClient();

  const { data: alarmData } = useQuery({
    queryKey: ['performance', 'alarms'],
    queryFn: getAlarmRules,
  });

  const createMutation = useMutation({
    mutationFn: createAlarmRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance', 'alarms'] });
      setAlarmDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => setAlarmError(err?.message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlarmRule> }) =>
      updateAlarmRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance', 'alarms'] });
      setAlarmDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => setAlarmError(err?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarmRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'alarms'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'enabled' | 'disabled' }) =>
      toggleAlarmRule(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance', 'alarms'] }),
  });

  function resetForm() {
    setEditingAlarm(null);
    setAlarmForm({
      name: '', type: 'metric', metric: 'reach', operator: '>', value: '',
      duration: '', notifyMethods: [], notifyUsers: '',
    });
    setAlarmError('');
  }

  function openCreate() {
    resetForm();
    setAlarmDialogOpen(true);
  }

  function openEdit(alarm: AlarmRule) {
    setEditingAlarm(alarm);
    setAlarmForm({
      name: alarm.name,
      type: alarm.type,
      metric: alarm.condition.metric,
      operator: alarm.condition.operator,
      value: String(alarm.condition.value),
      duration: String(alarm.condition.duration || ''),
      notifyMethods: alarm.notify.methods,
      notifyUsers: alarm.notify.users.join(', '),
    });
    setAlarmDialogOpen(true);
  }

  function handleAlarmSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlarmError('');
    const data: Partial<AlarmRule> = {
      name: alarmForm.name,
      type: alarmForm.type,
      condition: {
        metric: alarmForm.metric,
        operator: alarmForm.operator,
        value: Number(alarmForm.value),
        ...(alarmForm.duration ? { duration: Number(alarmForm.duration) } : {}),
      },
      notify: {
        methods: alarmForm.notifyMethods.length ? alarmForm.notifyMethods : ['email'],
        users: alarmForm.notifyUsers.split(',').map(u => u.trim()).filter(Boolean),
      },
    };
    if (editingAlarm) {
      updateMutation.mutate({ id: editingAlarm.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const { data: metricsData } = useQuery({
    queryKey: ['performance', 'metrics', timeRange],
    queryFn: () => getDashboardMetrics({ timeRange }),
  });

  const { data: trendDataRaw } = useQuery({
    queryKey: ['performance', 'trend', timeRange],
    queryFn: () => getDashboardTrend({ timeRange }),
  });

  const { data: reportsData } = useQuery({
    queryKey: ['performance', 'reports'],
    queryFn: () => getActivityReports(),
  });

  const t = language === 'zh' ? {
    title: '效果仪表盘',
    subtitle: '查看营销效果数据和报表',
    reach: '触达量',
    response: '响应率',
    conversion: '转化率',
    roi: 'ROI',
    reachTrend: '触达量趋势',
    channelDist: '渠道分布',
    segmentDist: '客群分布',
    activityRank: '活动效果排名',
    export: '导出',
    today: '今日',
    week: '本周',
    month: '本月',
    quarter: '本季',
    year: '本年',
    completed: '已完成',
    running: '进行中',
    paused: '已暂停',
    viewDetails: '查看详情',
  } : {
    title: 'Performance Dashboard',
    subtitle: 'View marketing performance data and reports',
    reach: 'Reach',
    response: 'Response',
    conversion: 'Conversion',
    roi: 'ROI',
    reachTrend: 'Reach Trend',
    channelDist: 'Channel Distribution',
    segmentDist: 'Segment Distribution',
    activityRank: 'Activity Ranking',
    export: 'Export',
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
    completed: 'Completed',
    running: 'Running',
    paused: 'Paused',
    viewDetails: 'View Details',
  };

  const metricsRaw = metricsData?.data;
  const metrics = metricsRaw ? [
    { title: t.reach, value: metricsRaw.reach?.toLocaleString() || '—', change: metricsRaw.reachChange || 0, up: (metricsRaw.reachChange || 0) >= 0 },
    { title: t.response, value: metricsRaw.responseRate ? `${metricsRaw.responseRate}%` : '—', change: metricsRaw.responseChange || 0, up: (metricsRaw.responseChange || 0) >= 0 },
    { title: t.conversion, value: metricsRaw.conversionRate ? `${metricsRaw.conversionRate}%` : '—', change: metricsRaw.conversionChange || 0, up: (metricsRaw.conversionChange || 0) >= 0 },
    { title: t.roi, value: metricsRaw.roi?.toString() || '—', change: metricsRaw.roiChange || 0, up: (metricsRaw.roiChange || 0) >= 0 },
  ] : [
    { title: t.reach, value: '85,000', change: 12.5, up: true },
    { title: t.response, value: '12.5%', change: 2.3, up: true },
    { title: t.conversion, value: '1.2%', change: -0.3, up: false },
    { title: t.roi, value: '2.8', change: 0.5, up: true },
  ];

  const trendData = trendDataRaw?.data?.map((d: any) => ({
    name: d.date,
    reach: d.reach,
    response: d.response,
    conversion: d.conversion,
  })) || [
    { name: '周一', reach: 4000, response: 2400, conversion: 240 },
    { name: '周二', reach: 3000, response: 1398, conversion: 210 },
    { name: '周三', reach: 2000, response: 9800, conversion: 290 },
    { name: '周四', reach: 2780, response: 3908, conversion: 200 },
    { name: '周五', reach: 1890, response: 4800, conversion: 181 },
    { name: '周六', reach: 2390, response: 3800, conversion: 250 },
    { name: '周日', reach: 3490, response: 4300, conversion: 210 },
  ];

  const activityData = reportsData?.data || [
    { name: '流失挽回', reach: '8,500', response: '12.5%', conversion: '1.2%', roi: '2.8', status: 'completed' },
    { name: '新发基金推广', reach: '12,000', response: '15.2%', conversion: '2.1%', roi: '3.5', status: 'running' },
    { name: '信用卡分期', reach: '6,800', response: '8.3%', conversion: '0.8%', roi: '1.9', status: 'completed' },
    { name: '养老金开户', reach: '4,200', response: '18.5%', conversion: '3.2%', roi: '4.1', status: 'running' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard">{language === 'zh' ? '数据看板' : 'Dashboard'}</TabsTrigger>
              <TabsTrigger value="alarms">{language === 'zh' ? '告警规则' : 'Alarm Rules'}</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === 'dashboard' && (
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList>
                <TabsTrigger value="today">{t.today}</TabsTrigger>
                <TabsTrigger value="week">{t.week}</TabsTrigger>
                <TabsTrigger value="month">{t.month}</TabsTrigger>
                <TabsTrigger value="quarter">{t.quarter}</TabsTrigger>
                <TabsTrigger value="year">{t.year}</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {activeTab === 'dashboard' && (
          <Button variant="outline" className="flex items-center gap-2" onClick={() => {
            const headers = ['活动', '触达', '响应率', '转化率', 'ROI', '状态'];
            const rows = activityData.map((a: any) => [a.name, a.reach, a.response, a.conversion, a.roi, a.status]);
            const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `finmark-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="w-4 h-4" />
            {t.export}
          </Button>
          )}
        </div>
      </div>

      <TabsContent value="dashboard" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{metric.title}</span>
              {metric.up ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</div>
            <div className={`text-xs font-medium ${metric.up ? 'text-emerald-500' : 'text-red-500'}`}>
              {metric.change > 0 ? '+' : ''}{metric.change}% vs {language === 'zh' ? '上周' : 'last week'}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold text-lg mb-6">{t.reachTrend}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name={t.reach} />
              <Line type="monotone" dataKey="response" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name={t.response} />
              <Line type="monotone" dataKey="conversion" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name={t.conversion} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">{t.channelDist}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">{t.segmentDist}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold text-lg mb-6">{t.activityRank}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{language === 'zh' ? '活动名称' : 'Activity'}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.reach}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.response}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.conversion}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.roi}</th>
                  <th className="text-center text-xs font-bold text-slate-400 uppercase py-3">Status</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activityData.map((activity: any, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-4 font-medium text-sm">{activity.name}</td>
                    <td className="py-4 text-sm text-right">{activity.reach}</td>
                    <td className="py-4 text-sm text-right">{activity.response}</td>
                    <td className="py-4 text-sm text-right">{activity.conversion}</td>
                    <td className="py-4 text-sm text-right font-bold text-emerald-600">{activity.roi}</td>
                    <td className="py-4 text-center">
                      <Badge className={activity.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}>
                        {activity.status === 'running' ? t.running : t.completed}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-indigo-600" onClick={() => alert(language === 'zh' ? '活动详情功能开发中' : 'Activity detail coming soon')}>
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      </TabsContent>

      <TabsContent value="alarms">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg">{language === 'zh' ? '告警规则' : 'Alarm Rules'}</h3>
              <p className="text-sm text-slate-500">
                {language === 'zh' ? '设置指标阈值告警，自动通知相关人员' : 'Set metric threshold alerts and auto-notify relevant staff'}
              </p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'zh' ? '添加规则' : 'Add Rule'}
            </Button>
          </div>

          {(alarmData?.data?.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{language === 'zh' ? '暂无告警规则' : 'No alarm rules configured'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{language === 'zh' ? '规则名称' : 'Rule Name'}</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{language === 'zh' ? '类型' : 'Type'}</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{language === 'zh' ? '条件' : 'Condition'}</th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{language === 'zh' ? '通知方式' : 'Notify'}</th>
                    <th className="text-center text-xs font-bold text-slate-400 uppercase py-3">{language === 'zh' ? '状态' : 'Status'}</th>
                    <th className="text-right text-xs font-bold text-slate-400 uppercase py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {alarmData?.data?.map((alarm: AlarmRule) => (
                    <tr key={alarm.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-4 font-medium text-sm">{alarm.name}</td>
                      <td className="py-4">
                        <Badge className={
                          alarm.type === 'metric' ? 'bg-blue-100 text-blue-700' :
                          alarm.type === 'task' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }>
                          {alarm.type === 'metric' ? (language === 'zh' ? '指标' : 'Metric') :
                           alarm.type === 'task' ? (language === 'zh' ? '任务' : 'Task') :
                           (language === 'zh' ? '系统' : 'System')}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-slate-600">
                        {alarm.condition.metric} {alarm.condition.operator} {alarm.condition.value}
                        {alarm.condition.duration ? ` (${language === 'zh' ? '持续' : 'for'} ${alarm.condition.duration}m)` : ''}
                      </td>
                      <td className="py-4 text-sm text-slate-600">{alarm.notify.methods.join(', ')}</td>
                      <td className="py-4 text-center">
                        {alarm.status === 'enabled' ? (
                          <Bell className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <BellOff className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={alarm.status === 'enabled'}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: alarm.id, status: checked ? 'enabled' : 'disabled' })
                            }
                          />
                          <Button variant="ghost" size="sm" onClick={() => openEdit(alarm)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteMutation.mutate(alarm.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </TabsContent>

      <Dialog open={alarmDialogOpen} onOpenChange={setAlarmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAlarm ? (language === 'zh' ? '编辑规则' : 'Edit Rule') : (language === 'zh' ? '添加规则' : 'Add Rule')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAlarmSubmit} className="space-y-4">
            {alarmError && <p className="text-sm text-red-500">{alarmError}</p>}
            <div className="space-y-2">
              <Label>{language === 'zh' ? '规则名称' : 'Rule Name'}</Label>
              <Input
                value={alarmForm.name}
                onChange={e => setAlarmForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'zh' ? '类型' : 'Type'}</Label>
                <Select value={alarmForm.type} onValueChange={v => setAlarmForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">{language === 'zh' ? '指标' : 'Metric'}</SelectItem>
                    <SelectItem value="task">{language === 'zh' ? '任务' : 'Task'}</SelectItem>
                    <SelectItem value="system">{language === 'zh' ? '系统' : 'System'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'zh' ? '指标' : 'Metric'}</Label>
                <Select value={alarmForm.metric} onValueChange={v => setAlarmForm(f => ({ ...f, metric: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reach">{language === 'zh' ? '触达量' : 'Reach'}</SelectItem>
                    <SelectItem value="response">{language === 'zh' ? '响应率' : 'Response Rate'}</SelectItem>
                    <SelectItem value="conversion">{language === 'zh' ? '转化率' : 'Conversion'}</SelectItem>
                    <SelectItem value="roi">ROI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'zh' ? '运算符' : 'Operator'}</Label>
                <Select value={alarmForm.operator} onValueChange={v => setAlarmForm(f => ({ ...f, operator: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">&gt;</SelectItem>
                    <SelectItem value="<">&lt;</SelectItem>
                    <SelectItem value=">=">&gt;=</SelectItem>
                    <SelectItem value="<=">&lt;=</SelectItem>
                    <SelectItem value="=">=</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'zh' ? '阈值' : 'Threshold'}</Label>
                <Input
                  type="number"
                  value={alarmForm.value}
                  onChange={e => setAlarmForm(f => ({ ...f, value: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'zh' ? '持续时间(分钟)' : 'Duration (min)'}</Label>
                <Input
                  type="number"
                  placeholder={language === 'zh' ? '可选' : 'Optional'}
                  value={alarmForm.duration}
                  onChange={e => setAlarmForm(f => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'zh' ? '通知用户' : 'Notify Users'}</Label>
                <Input
                  placeholder={language === 'zh' ? '逗号分隔' : 'comma separated'}
                  value={alarmForm.notifyUsers}
                  onChange={e => setAlarmForm(f => ({ ...f, notifyUsers: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'zh' ? '通知方式' : 'Notify Methods'}</Label>
              <div className="flex gap-4">
                {(['email', 'sms', 'wechat'] as const).map(method => (
                  <label key={method} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={alarmForm.notifyMethods.includes(method)}
                      onChange={e => {
                        setAlarmForm(f => ({
                          ...f,
                          notifyMethods: e.target.checked
                            ? [...f.notifyMethods, method]
                            : f.notifyMethods.filter(m => m !== method),
                        }));
                      }}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAlarmDialogOpen(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? (language === 'zh' ? '保存中...' : 'Saving...')
                  : (language === 'zh' ? '保存' : 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
