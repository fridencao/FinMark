import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Users, Database, GitBranch, FileText, Settings as SettingsIcon, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { getAudiencePreview } from '@/services/audience';
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