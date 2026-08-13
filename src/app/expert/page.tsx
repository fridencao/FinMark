import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Users, Database, GitBranch, FileText, Settings as SettingsIcon, Plus, ArrowRight, Trash2, Server } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { getAudiencePreview } from '@/services/audience';
import { getAudiencePreview as getBigDataAudiencePreview, searchSegmentCustomers, type AudiencePreviewResult, type SegmentCustomersResult } from '@/services/bigdata';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BatchStrategyConfig } from '@/components/expert/BatchStrategyConfig';
import { WorkflowBuilder } from '@/components/expert/WorkflowBuilder';
import { TemplateManager } from '@/components/expert/TemplateManager';

const expertModules = [
  { id: 'audience', title: '高级客群圈选', desc: '自定义复杂筛选条件，组合多个标签', icon: Database, color: 'bg-blue-100 text-blue-600' },
  { id: 'batch', title: '批量策略配置', desc: '批量创建和修改营销策略', icon: GitBranch, color: 'bg-purple-100 text-purple-600' },
  { id: 'workflow', title: '自定义工作流', desc: '可视化编排营销流程', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'template', title: '模板管理', desc: '创建和管理营销模板库', icon: FileText, color: 'bg-orange-100 text-orange-600' },
];

export function ExpertPage() {
  const { language } = useAppStore();
  const [activeModule, setActiveModule] = useState('audience');
  const [audienceStats, setAudienceStats] = useState({ size: 8500, reachRate: 65, estimated: 5525 });
  const [isGenerating, setIsGenerating] = useState(false);
  // bigdata 真实数据源:大 GraphQL 端点(行方)或本地 mock
  const [bigDataPreview, setBigDataPreview] = useState<AudiencePreviewResult | null>(null);
  const [bigDataSegment, setBigDataSegment] = useState<SegmentCustomersResult | null>(null);
  const [bigDataError, setBigDataError] = useState<string | null>(null);

  interface ConditionRow {
    id: string;
    field: string;
    operator: string;
    value: string;
    logic?: 'and' | 'or';
  }

  const [conditions, setConditions] = useState<ConditionRow[]>([
    { id: '1', field: 'age', operator: '>=', value: '30', logic: 'and' },
    { id: '2', field: 'risk_level', operator: 'in', value: 'R3,R4,R5' },
  ]);

  const previewMutation = useMutation({
    mutationFn: (conds: ConditionRow[]) => getAudiencePreview(conds, 10000),
    onSuccess: (res: any) => {
      const data = res.data?.data ?? res.data;
      setAudienceStats({
        size: data?.totalCount ?? data?.count ?? 0,
        reachRate: data?.reachRate ?? 65,
        estimated: data?.estimatedReach ?? Math.floor((data?.totalCount ?? 0) * 0.65),
      });
    },
    onError: (err: unknown) => {
      console.error('Audience preview failed:', err);
      setAudienceStats({ size: 0, reachRate: 0, estimated: 0 });
    },
  });

  /** P1-B 大数据预览:走 /api/bigdata/audience/preview,真实 GraphQL 数据 */
  const bigDataPreviewMutation = useMutation({
    mutationFn: (conds: ConditionRow[]) => getBigDataAudiencePreview(
      conds.map((c) => ({ field: c.field, op: c.operator, value: c.value })),
      10,
    ),
    onSuccess: (res) => {
      setBigDataPreview(res.data.data);
      setBigDataError(null);
    },
    onError: (err: unknown) => {
      setBigDataError(err instanceof Error ? err.message : '大数据预览失败');
      setBigDataPreview(null);
    },
  });

  /** P1-B 分群客户查询:按分群 ID 拉样例客户(20 个) */
  const segmentQueryMutation = useMutation({
    mutationFn: (segmentId: string) => searchSegmentCustomers(segmentId),
    onSuccess: (res) => {
      setBigDataSegment(res.data.data);
      setBigDataError(null);
    },
    onError: (err: unknown) => {
      setBigDataError(err instanceof Error ? err.message : '分群查询失败');
      setBigDataSegment(null);
    },
  });

  const addCondition = () => {
    setConditions(prev => [...prev, { id: Date.now().toString(), field: 'age', operator: '=', value: '', logic: 'and' }]);
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev);
  };

  const updateCondition = (id: string, field: keyof ConditionRow, value: string) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const t = translations[language].expertPage;

  const fields = [
    { key: 'age', label: language === 'zh' ? '年龄' : 'Age' },
    { key: 'gender', label: language === 'zh' ? '性别' : 'Gender' },
    { key: 'aum', label: language === 'zh' ? 'AUM资产' : 'AUM' },
    { key: 'risk_level', label: language === 'zh' ? '风险等级' : 'Risk Level' },
    { key: 'product_hold', label: language === 'zh' ? '持有产品' : 'Products' },
    { key: 'transaction', label: language === 'zh' ? '交易行为' : 'Transactions' },
    { key: 'lifecycle', label: language === 'zh' ? '客户生命周期' : 'Lifecycle' },
  ];

  const operators = [
    { key: '=', label: '=' },
    { key: '>', label: '>' },
    { key: '<', label: '<' },
    { key: '>=', label: '>=' },
    { key: '<=', label: '<=' },
    { key: 'in', label: language === 'zh' ? '在...中' : 'in' },
    { key: 'between', label: language === 'zh' ? '介于' : 'between' },
  ];

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
      </div>

      {/* Module Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {expertModules.map(module => (
          <Card
            key={module.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-md ${
              activeModule === module.id ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setActiveModule(module.id)}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${module.color}`}>
              <module.icon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm mb-1">{module.title}</h4>
            <p className="text-xs text-slate-500">{module.desc}</p>
          </Card>
        ))}
      </div>

      {/* Advanced Audience Builder */}
      {activeModule === 'audience' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">{t.conditionBuilder}</h3>
          
          <div className="space-y-4">
            {conditions.map((row, idx) => (
              <div key={row.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Select value={row.field} onValueChange={(v) => updateCondition(row.id, 'field', v)}>
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map(f => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={row.operator} onValueChange={(v) => updateCondition(row.id, 'operator', v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map(o => (
                      <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder={language === 'zh' ? '值' : 'Value'}
                  className="flex-1"
                  value={row.value}
                  onChange={(e) => updateCondition(row.id, 'value', e.target.value)}
                />

                {idx < conditions.length - 1 ? (
                  <Select value={row.logic ?? 'and'} onValueChange={(v) => updateCondition(row.id, 'logic', v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="and">{language === 'zh' ? '且' : 'AND'}</SelectItem>
                      <SelectItem value="or">{language === 'zh' ? '或' : 'OR'}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="w-24" />
                )}

                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeCondition(row.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addCondition} className="ml-4">
              <Plus className="w-4 h-4 mr-1" />
              {t.addCondition}
            </Button>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => {
                setAudienceStats({ size: 0, reachRate: 0, estimated: 0 });
                setConditions([{ id: '1', field: 'age', operator: '>=', value: '30', logic: 'and' }]);
              }}>{t.clear}</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                onClick={() => previewMutation.mutate(conditions)}
              >
                {previewMutation.isPending ? (language === 'zh' ? '生成中...' : 'Generating...') : t.apply}
              </Button>
            </div>
          </div>

          {/* Results Preview */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-indigo-600">{audienceStats.size.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">{t.audienceSize}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-emerald-600">{audienceStats.reachRate}%</div>
                <div className="text-xs text-slate-500 mt-1">{language === 'zh' ? '预计触达率' : 'Est. Reach Rate'}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">{audienceStats.estimated.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">{t.estimatedReach}</div>
              </div>
            </div>
          </div>

          {/* P1-B: 大数据真实数据源(走 /api/bigdata/* 调 GraphQL) */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                {language === 'zh' ? '大数据真实数据源(GraphQL)' : 'Live bigdata source (GraphQL)'}
              </h4>
              <Badge variant="outline" className="text-xs">P1-B</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'zh'
                ? '走 data-service 的 /api/bigdata/* 路由,后端调用真实 GraphQL 端点(行方大数据或本地 mock)。'
                : 'Routes through data-service /api/bigdata/* to a real GraphQL endpoint (prod or local mock).'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Button
                onClick={() => bigDataPreviewMutation.mutate(conditions)}
                disabled={bigDataPreviewMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {bigDataPreviewMutation.isPending
                  ? (language === 'zh' ? '查询中...' : 'Querying...')
                  : (language === 'zh' ? '调大数据预览' : 'Query bigdata preview')}
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  className="w-32"
                  placeholder="seg-vip"
                  defaultValue="seg-vip"
                  onKeyDown={(e) => { if (e.key === 'Enter') segmentQueryMutation.mutate((e.target as HTMLInputElement).value); }}
                />
                <Button
                  variant="outline"
                  onClick={() => segmentQueryMutation.mutate('seg-vip')}
                  disabled={segmentQueryMutation.isPending}
                >
                  {segmentQueryMutation.isPending
                    ? (language === 'zh' ? '查询中...' : 'Querying...')
                    : (language === 'zh' ? '查分群客户' : 'Query segment')}
                </Button>
              </div>
            </div>
            {bigDataError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2 mb-4">
                {bigDataError}
              </div>
            )}
            {bigDataPreview && (
              <div className="bg-indigo-50/40 dark:bg-indigo-950/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">{language === 'zh' ? '总客群数' : 'Total'}</div>
                    <div className="text-xl font-bold text-indigo-600">{bigDataPreview.total.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{language === 'zh' ? '样本数' : 'Sample'}</div>
                    <div className="text-xl font-bold text-slate-700">{bigDataPreview.sample.length}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  {language === 'zh' ? '样本前 5:' : 'Top 5 sample:'}
                </div>
                <div className="mt-1 space-y-1">
                  {bigDataPreview.sample.slice(0, 5).map((row) => (
                    <div key={row.id} className="text-xs flex justify-between bg-white/60 dark:bg-slate-900/60 rounded px-2 py-1">
                      <span>{row.name} <span className="text-slate-400">({row.id})</span></span>
                      <span className="text-slate-500">¥{row.asset.toLocaleString()} · {row.segment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bigDataSegment && (
              <div className="bg-emerald-50/40 dark:bg-emerald-950/30 rounded-xl p-4">
                <div className="text-sm">
                  <span className="font-semibold">{language === 'zh' ? '分群' : 'Segment'}:</span>{' '}
                  <code className="text-xs bg-white/60 dark:bg-slate-900/60 px-1.5 py-0.5 rounded">{bigDataSegment.total.toLocaleString()}</code>{' '}
                  {language === 'zh' ? '个客户' : 'customers'} ({language === 'zh' ? '显示前' : 'showing first'} {bigDataSegment.customers.length})
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bigDataSegment.customers.slice(0, 6).map((row) => (
                    <div key={row.id} className="text-xs bg-white/60 dark:bg-slate-900/60 rounded-lg p-2">
                      <div className="font-semibold">{row.name} <span className="text-slate-400 font-normal">({row.id})</span></div>
                      <div className="text-slate-500">¥{row.asset.toLocaleString()} · {row.segment}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Batch Strategy Config */}
      {activeModule === 'batch' && (
        <Card className="p-6">
          <BatchStrategyConfig />
        </Card>
      )}

      {/* Custom Workflow */}
      {activeModule === 'workflow' && (
        <Card className="p-6">
          <WorkflowBuilder />
        </Card>
      )}

      {/* Template Manager */}
      {activeModule === 'template' && (
        <Card className="p-6">
          <TemplateManager />
        </Card>
      )}
    </div>
  );
}