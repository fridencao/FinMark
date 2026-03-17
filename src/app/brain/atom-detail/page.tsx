import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Trash2, Tag, TrendingUp, MessageSquare, Zap, BarChart3, Clock, Users, ShieldCheck, Edit3, Play } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnalyticsTab } from '@/components/brain/AnalyticsTab';

const defaultAtom = {
  id: 'atom_001',
  name: '高净值客户识别',
  type: 'customer_segment',
  category: '客群标签',
  tags: ['高净值', 'VIP', '资产配置'],
  description: '识别资产超过500万且持有多种金融产品的客户',
  conditions: [
    { field: '总资产', operator: '>=', value: '5000000', unit: '元' },
    { field: '产品持有数', operator: '>=', value: '3', unit: '个' },
    { field: '风险偏好', operator: 'in', value: '稳健型,平衡型,进取型', unit: 'enum' },
  ],
  metrics: {
    totalCount: 12580,
    accuracy: 95.8,
    lastUpdated: '2024-01-10',
  },
  usage: [
    { scenario: '流失挽回', count: 4500 },
    { scenario: '新客推荐', count: 3200 },
    { scenario: '产品升级', count: 2800 },
    { scenario: '活动触达', count: 2100 },
  ],
  status: 'active',
  version: 'v2.1',
};

export function BrainAtomDetailPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const [atom, setAtom] = useState(defaultAtom);
  const [activeTab, setActiveTab] = useState('config');

  const t = language === 'zh' ? {
    title: '原子详情',
    edit: '编辑',
    save: '保存',
    duplicate: '复制',
    delete: '删除',
    back: '返回',
    config: '基础配置',
    usage: '使用记录',
    analytics: '效果分析',
    version: '版本',
    status: '状态',
    active: '启用',
    inactive: '停用',
    type: '类型',
    category: '分类',
    tags: '标签',
    description: '描述',
    conditions: '计算条件',
    field: '字段',
    operator: '运算符',
    value: '值',
    unit: '单位',
    metrics: '统计数据',
    totalCount: '总数量',
    accuracy: '准确率',
    lastUpdated: '最后更新',
    usedIn: '应用于',
    scenarioCount: '场景数',
    create: '创建原子',
  } : {
    title: 'Atom Detail',
    edit: 'Edit',
    save: 'Save',
    duplicate: 'Duplicate',
    delete: 'Delete',
    back: 'Back',
    config: 'Config',
    usage: 'Usage',
    analytics: 'Analytics',
    version: 'Version',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    type: 'Type',
    category: 'Category',
    tags: 'Tags',
    description: 'Description',
    conditions: 'Conditions',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    unit: 'Unit',
    metrics: 'Metrics',
    totalCount: 'Total Count',
    accuracy: 'Accuracy',
    lastUpdated: 'Last Updated',
    usedIn: 'Used In',
    scenarioCount: 'Scenarios',
    create: 'Create Atom',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/brain')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{atom.name}</h2>
              <Badge variant="outline">{atom.version}</Badge>
            </div>
            <p className="text-slate-500">{atom.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={atom.status === 'active'} />
          <span className="text-sm text-slate-600">{atom.status === 'active' ? t.active : t.inactive}</span>
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-1" />
            {t.duplicate}
          </Button>
          <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700">
            <Trash2 className="w-4 h-4 mr-1" />
            {t.delete}
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Edit3 className="w-4 h-4 mr-1" />
            {t.edit}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.metrics.totalCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{t.totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.metrics.accuracy}%</p>
              <p className="text-xs text-slate-500">{t.accuracy}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.metrics.lastUpdated}</p>
              <p className="text-xs text-slate-500">{t.lastUpdated}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.usage.length}</p>
              <p className="text-xs text-slate-500">{t.scenarioCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tags */}
      <Card className="p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">{t.tags}</span>
        </div>
        <div className="flex gap-2">
          {atom.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="px-3 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">{t.config}</TabsTrigger>
          <TabsTrigger value="usage">{t.usage}</TabsTrigger>
          <TabsTrigger value="analytics">{t.analytics}</TabsTrigger>
        </TabsList>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <Card className="p-6 rounded-xl">
            <h4 className="font-bold mb-4">{t.conditions}</h4>
            <div className="space-y-3">
              {atom.conditions.map((condition, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <Badge variant="outline" className="w-32">{condition.field}</Badge>
                  <span className="text-slate-400">{condition.operator}</span>
                  <Badge variant="secondary" className="flex-1">{condition.value}</Badge>
                  <span className="text-xs text-slate-400">{condition.unit}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-6">
          <Card className="rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.usedIn}</TableHead>
                  <TableHead>{t.totalCount}</TableHead>
                  <TableHead>{t.description}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atom.usage.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.scenario}</TableCell>
                    <TableCell>{item.count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Play className="w-3 h-3 mr-1" />
                        查看
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab atomId={atom.id} atomName={atom.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BrainAtomDetailPage;
