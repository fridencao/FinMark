import React, { useState } from 'react';
import { Activity, Clock, Coins, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getMonitoringStats, getModelStats, getDailyStats, getErrorStats, getRecentCalls,
} from '@/services/monitoring';

const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const FALLBACK_MODELS = [
  { model: 'gemini-2.5-flash', calls: 12480, successRate: 98.2, avgResponseTime: 820, totalTokens: 3840000 },
  { model: 'gemini-2.5-pro', calls: 3200, successRate: 99.1, avgResponseTime: 1540, totalTokens: 2560000 },
  { model: 'deepseek-chat', calls: 8960, successRate: 97.5, avgResponseTime: 650, totalTokens: 2880000 },
];

const FALLBACK_DAILY = [
  { date: '06/11', calls: 4520, successCount: 4438, errorCount: 82, avgResponseTime: 780, totalTokens: 1280000 },
  { date: '06/12', calls: 5120, successCount: 5028, errorCount: 92, avgResponseTime: 810, totalTokens: 1440000 },
  { date: '06/13', calls: 4880, successCount: 4792, errorCount: 88, avgResponseTime: 760, totalTokens: 1360000 },
  { date: '06/14', calls: 6240, successCount: 6136, errorCount: 104, avgResponseTime: 850, totalTokens: 1680000 },
  { date: '06/15', calls: 5680, successCount: 5592, errorCount: 88, avgResponseTime: 790, totalTokens: 1520000 },
  { date: '06/16', calls: 5920, successCount: 5828, errorCount: 92, avgResponseTime: 830, totalTokens: 1600000 },
  { date: '06/17', calls: 4320, successCount: 4256, errorCount: 64, avgResponseTime: 770, totalTokens: 1200000 },
];

const FALLBACK_ERRORS = [
  { errorType: 'Rate Limit', count: 142, percentage: 38.2 },
  { errorType: 'Timeout', count: 98, percentage: 26.4 },
  { errorType: 'Invalid Request', count: 76, percentage: 20.5 },
  { errorType: 'Server Error', count: 38, percentage: 10.2 },
  { errorType: 'Auth Failed', count: 18, percentage: 4.7 },
];

const FALLBACK_CALLS = [
  { id: '1', model: 'gemini-2.5-flash', agent: 'Insight Agent', promptTokens: 1250, completionTokens: 680, totalTokens: 1930, responseTime: 820, status: 'success' as const, createdAt: '2026-06-17T10:32:00Z' },
  { id: '2', model: 'deepseek-chat', agent: 'Content Agent', promptTokens: 2100, completionTokens: 1540, totalTokens: 3640, responseTime: 1120, status: 'success' as const, createdAt: '2026-06-17T10:30:15Z' },
  { id: '3', model: 'gemini-2.5-flash', agent: 'Compliance Agent', promptTokens: 890, completionTokens: 320, totalTokens: 1210, responseTime: 540, status: 'success' as const, createdAt: '2026-06-17T10:28:42Z' },
  { id: '4', model: 'gemini-2.5-pro', agent: 'Strategy Agent', promptTokens: 3200, completionTokens: 2100, totalTokens: 5300, responseTime: 2340, status: 'error' as const, errorMessage: 'Rate limit exceeded', createdAt: '2026-06-17T10:25:10Z' },
  { id: '5', model: 'gemini-2.5-flash', agent: 'Analyst Agent', promptTokens: 1580, completionTokens: 920, totalTokens: 2500, responseTime: 680, status: 'success' as const, createdAt: '2026-06-17T10:22:55Z' },
];

export function MonitoringPage() {
  const { language } = useAppStore();
  const [timeRange, setTimeRange] = useState('week');

  const { data: statsRaw, isLoading: statsLoading } = useQuery({
    queryKey: ['monitoring', 'stats', timeRange],
    queryFn: () => getMonitoringStats({ timeRange }),
  });

  const { data: modelDataRaw } = useQuery({
    queryKey: ['monitoring', 'models', timeRange],
    queryFn: () => getModelStats({ timeRange }),
  });

  const { data: dailyDataRaw } = useQuery({
    queryKey: ['monitoring', 'daily', timeRange],
    queryFn: () => getDailyStats({ timeRange }),
  });

  const { data: errorDataRaw } = useQuery({
    queryKey: ['monitoring', 'errors', timeRange],
    queryFn: () => getErrorStats({ timeRange }),
  });

  const { data: callsDataRaw } = useQuery({
    queryKey: ['monitoring', 'calls', timeRange],
    queryFn: () => getRecentCalls({ timeRange, pageSize: 10 }),
  });

  const stats = statsRaw?.data || {
    totalCalls: 24640, successRate: 98.1, avgResponseTime: 812, totalTokens: 9280000,
    callsChange: 12.3, successRateChange: 0.4, responseTimeChange: -5.2, tokensChange: 15.8,
  };

  const modelStats = modelDataRaw?.data || FALLBACK_MODELS;
  const dailyStats = dailyDataRaw?.data || FALLBACK_DAILY;
  const errorStats = errorDataRaw?.data || FALLBACK_ERRORS;
  const recentCalls = callsDataRaw?.data || FALLBACK_CALLS;

  const t = translations[language].monitoringPage;

  const overviewCards = [
    {
      title: t.totalCalls,
      value: stats.totalCalls.toLocaleString(),
      change: stats.callsChange,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: t.successRate,
      value: `${stats.successRate}%`,
      change: stats.successRateChange,
      icon: RefreshCw,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: t.avgResponseTime,
      value: `${stats.avgResponseTime} ${t.ms}`,
      change: stats.responseTimeChange,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      invertChange: true,
    },
    {
      title: t.totalTokens,
      value: stats.totalTokens >= 1000000 ? `${(stats.totalTokens / 1000000).toFixed(1)}M` : stats.totalTokens.toLocaleString(),
      change: stats.tokensChange,
      icon: Coins,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="today">{t.today}</TabsTrigger>
            <TabsTrigger value="week">{t.week}</TabsTrigger>
            <TabsTrigger value="month">{t.month}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, idx) => (
          <Card key={idx} className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{card.title}</span>
              <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {statsLoading ? '—' : card.value}
            </div>
            <div className={`text-xs font-medium flex items-center gap-1 ${
              card.invertChange
                ? (card.change <= 0 ? 'text-emerald-500' : 'text-red-500')
                : (card.change >= 0 ? 'text-emerald-500' : 'text-red-500')
            }`}>
              {card.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(card.change)}% vs {language === 'zh' ? '上周' : 'last week'}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">{t.modelUsage}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="model" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="calls" name={t.calls} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">{t.responseTime}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="avgResponseTime" name={t.avgResponseTime} stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">{t.dailyTrend}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="successCount" name={t.success} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="errorCount" name={t.error} stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">{t.errorRate}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={errorStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="errorType"
              >
                {errorStats.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
        <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">{t.recentCalls}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{t.model}</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{t.agent}</th>
                <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.promptTokens}</th>
                <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.completionTokens}</th>
                <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.tokens}</th>
                <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.avgResponseTime}</th>
                <th className="text-center text-xs font-bold text-slate-400 uppercase py-3">{t.status}</th>
                <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.time}</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call: any) => (
                <tr key={call.id} className="border-b border-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-4 text-sm font-medium">
                    <Badge variant="outline" className="text-[10px]">{call.model}</Badge>
                  </td>
                  <td className="py-4 text-sm text-slate-600">{call.agent}</td>
                  <td className="py-4 text-sm text-right text-slate-600">{call.promptTokens.toLocaleString()}</td>
                  <td className="py-4 text-sm text-right text-slate-600">{call.completionTokens.toLocaleString()}</td>
                  <td className="py-4 text-sm text-right font-medium">{call.totalTokens.toLocaleString()}</td>
                  <td className="py-4 text-sm text-right">
                    <span className={call.responseTime > 1500 ? 'text-red-500' : call.responseTime > 1000 ? 'text-amber-500' : 'text-emerald-500'}>
                      {call.responseTime}ms
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <Badge variant={call.status === 'success' ? 'info' : 'destructive'} className="text-[10px]">
                      {call.status === 'success' ? t.success : t.error}
                    </Badge>
                  </td>
                  <td className="py-4 text-sm text-right text-slate-500">
                    {new Date(call.createdAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
                      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
