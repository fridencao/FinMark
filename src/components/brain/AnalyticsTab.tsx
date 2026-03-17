import React from 'react';
import { TrendingUp, Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsTabProps {
  atomId?: string;
  atomName?: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#ef4444'];

// Mock data generators
const generateUsageTrendData = () => [
  { date: '2024-01-01', usage: 120, success: 115 },
  { date: '2024-01-02', usage: 132, success: 128 },
  { date: '2024-01-03', usage: 101, success: 98 },
  { date: '2024-01-04', usage: 134, success: 130 },
  { date: '2024-01-05', usage: 190, success: 185 },
  { date: '2024-01-06', usage: 230, success: 225 },
  { date: '2024-01-07', usage: 210, success: 205 },
  { date: '2024-01-08', usage: 180, success: 175 },
  { date: '2024-01-09', usage: 150, success: 145 },
  { date: '2024-01-10', usage: 170, success: 165 },
  { date: '2024-01-11', usage: 195, success: 190 },
  { date: '2024-01-12', usage: 220, success: 215 },
  { date: '2024-01-13', usage: 240, success: 235 },
  { date: '2024-01-14', usage: 260, success: 255 },
];

const generateSuccessRateData = () => [
  { name: '原子标签', success: 98.5, target: 95 },
  { name: '客群圈选', success: 96.2, target: 95 },
  { name: '营销策略', success: 94.8, target: 90 },
  { name: '智能推荐', success: 97.1, target: 95 },
  { name: '实时计算', success: 99.2, target: 99 },
];

const generateChannelDistributionData = () => [
  { name: '短信', value: 35, count: 4200 },
  { name: 'APP 推送', value: 28, count: 3360 },
  { name: '微信', value: 18, count: 2160 },
  { name: '电话', value: 12, count: 1440 },
  { name: '邮件', value: 7, count: 840 },
];

const generateSegmentCoverageData = () => [
  { segment: '高净值客户', coverage: 85, total: 15000, covered: 12750 },
  { segment: '年轻客群', coverage: 72, total: 25000, covered: 18000 },
  { segment: '代发工资', coverage: 91, total: 20000, covered: 18200 },
  { segment: '理财客户', coverage: 68, total: 18000, covered: 12240 },
  { segment: '贷款客户', coverage: 79, total: 12000, covered: 9480 },
];

export function AnalyticsTab({ atomId, atomName }: AnalyticsTabProps) {
  const usageTrendData = generateUsageTrendData();
  const successRateData = generateSuccessRateData();
  const channelDistributionData = generateChannelDistributionData();
  const segmentCoverageData = generateSegmentCoverageData();

  return (
    <div className="space-y-6">
      {/* Chart 1: Usage Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700">使用趋势</h4>
              <p className="text-xs text-slate-500">近 14 天调用量与成功量对比</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
              <span className="text-slate-600">调用量</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600">成功量</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="调用量"
              />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="成功量"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 2: Success Rate Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700">成功率对比</h4>
              <p className="text-xs text-slate-500">各模块成功率与目标对比</p>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={successRateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value}%`, '成功率']}
              />
              <Legend />
              <Bar dataKey="success" fill="#10b981" radius={[0, 4, 4, 0]} name="实际成功率" />
              <Bar dataKey="target" fill="#94a3b8" radius={[0, 4, 4, 0]} name="目标成功率" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Chart 3: Channel Distribution */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700">渠道分布</h4>
              <p className="text-xs text-slate-500">各触达渠道使用占比</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">12,000</p>
            <p className="text-xs text-slate-500">总触达量</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {channelDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value}% (${props.payload.count}次)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="col-span-2">
            <div className="space-y-3">
              {channelDistributionData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-700 w-20">{item.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-12 text-right">
                    {item.value}%
                  </span>
                  <span className="text-xs text-slate-500 w-20 text-right">
                    {item.count.toLocaleString()}次
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Chart 4: Segment Coverage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700">客群覆盖率</h4>
              <p className="text-xs text-slate-500">各客群的标签覆盖情况</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {segmentCoverageData.map((item) => (
            <div key={item.segment} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{item.segment}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">
                    已覆盖 <span className="font-bold text-slate-900">{item.covered.toLocaleString()}</span> /{' '}
                    {item.total.toLocaleString()}
                  </span>
                  <span className="font-bold text-indigo-600 w-12 text-right">{item.coverage}%</span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${item.coverage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AnalyticsTab;
