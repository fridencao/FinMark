import React, { useState } from 'react';
import { Users, Database, GitBranch, FileText, Settings as SettingsIcon, Plus, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/stores/app';
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

  const t = language === 'zh' ? {
    title: '专家模式',
    subtitle: '高级配置和批量操作',
    modules: '功能模块',
    audience: '高级客群圈选',
    batch: '批量策略配置',
    workflow: '自定义工作流',
    template: '模板管理',
    conditionBuilder: '条件构建器',
    addCondition: '添加条件',
    clear: '清除',
    apply: '应用',
    targetAudience: '目标客群',
    audienceSize: '客群规模',
    estimatedReach: '预计触达',
    generateAudience: '生成客群',
  } : {
    title: 'Expert Mode',
    subtitle: 'Advanced configuration and batch operations',
    modules: 'Modules',
    audience: 'Advanced Audience',
    batch: 'Batch Strategy',
    workflow: 'Custom Workflow',
    template: 'Template Manager',
    conditionBuilder: 'Condition Builder',
    addCondition: 'Add Condition',
    clear: 'Clear',
    apply: 'Apply',
    targetAudience: 'Target Audience',
    audienceSize: 'Audience Size',
    estimatedReach: 'Estimated Reach',
    generateAudience: 'Generate Audience',
  };

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
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
        <p className="text-slate-500">{t.subtitle}</p>
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
            {/* Condition Row */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Select defaultValue="age">
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(f => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select defaultValue=">=">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(o => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input placeholder="值" className="flex-1" defaultValue="30" />
              
              <Select defaultValue="and">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">{language === 'zh' ? '且' : 'AND'}</SelectItem>
                  <SelectItem value="or">{language === 'zh' ? '或' : 'OR'}</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Additional Conditions */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Select defaultValue="risk_level">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(f => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select defaultValue="in">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(o => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input placeholder="值" className="flex-1" defaultValue="R3, R4, R5" />
              
              <div className="w-24" />
              <div className="w-8" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button variant="outline" className="rounded-xl">{t.clear}</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">{t.apply}</Button>
            </div>
          </div>

          {/* Results Preview */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-indigo-600">8,500</div>
                <div className="text-xs text-slate-500 mt-1">{t.audienceSize}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-emerald-600">65%</div>
                <div className="text-xs text-slate-500 mt-1">{language === 'zh' ? '预计触达率' : 'Est. Reach Rate'}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">5,525</div>
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