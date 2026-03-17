import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, Filter, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const trendData = [
  { name: '周一', reach: 4000, response: 2400, conversion: 240 },
  { name: '周二', reach: 3000, response: 1398, conversion: 210 },
  { name: '周三', reach: 2000, response: 9800, conversion: 290 },
  { name: '周四', reach: 2780, response: 3908, conversion: 200 },
  { name: '周五', reach: 1890, response: 4800, conversion: 181 },
  { name: '周六', reach: 2390, response: 3800, conversion: 250 },
  { name: '周日', reach: 3490, response: 4300, conversion: 210 },
];

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

const activityData = [
  { name: '流失挽回', reach: '8,500', response: '12.5%', conversion: '1.2%', roi: '2.8', status: 'completed' },
  { name: '新发基金推广', reach: '12,000', response: '15.2%', conversion: '2.1%', roi: '3.5', status: 'running' },
  { name: '信用卡分期', reach: '6,800', response: '8.3%', conversion: '0.8%', roi: '1.9', status: 'completed' },
  { name: '养老金开户', reach: '4,200', response: '18.5%', conversion: '3.2%', roi: '4.1', status: 'running' },
];

export function PerformancePage() {
  const { language } = useAppStore();
  const [timeRange, setTimeRange] = useState('week');

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

  const metrics = [
    { title: t.reach, value: '85,000', change: 12.5, up: true },
    { title: t.response, value: '12.5%', change: 2.3, up: true },
    { title: t.conversion, value: '1.2%', change: -0.3, up: false },
    { title: t.roi, value: '2.8', change: 0.5, up: true },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="today">{t.today}</TabsTrigger>
              <TabsTrigger value="week">{t.week}</TabsTrigger>
              <TabsTrigger value="month">{t.month}</TabsTrigger>
              <TabsTrigger value="quarter">{t.quarter}</TabsTrigger>
              <TabsTrigger value="year">{t.year}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold text-lg mb-6">{t.reachTrend}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name={t.reach} />
              <Line type="monotone" dataKey="response" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name={t.response} />
              <Line type="monotone" dataKey="conversion" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name={t.conversion} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Channel Distribution */}
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segment Distribution */}
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

        {/* Activity Ranking */}
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
                {activityData.map((activity, idx) => (
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
                      <Button variant="ghost" size="sm" className="text-indigo-600">
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
    </div>
  );
}