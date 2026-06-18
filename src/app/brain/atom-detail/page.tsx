import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Trash2, Tag, TrendingUp, MessageSquare, Zap, BarChart3, Clock, Users, ShieldCheck, Edit3, Play } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { getAtom, updateAtom, deleteAtom, type Atom } from '@/services/strategy';

export function BrainAtomDetailPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('config');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Atom>>({});

  const { data: atomData, isLoading, isError } = useQuery({
    queryKey: ['atom', id],
    queryFn: () => getAtom(id!),
    enabled: !!id,
  });

  const atom: Atom | undefined = atomData?.data ?? atomData;

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Atom>) => updateAtom(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atom', id] });
      queryClient.invalidateQueries({ queryKey: ['atoms'] });
      setIsEditing(false);
      setEditData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAtom(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atoms'] });
      navigate('/brain');
    },
  });

  const handleEdit = () => {
    if (!atom) return;
    setEditData({ name: atom.name, description: atom.description, tags: atom.tags, status: atom.status, version: atom.version });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (Object.keys(editData).length > 0) {
      updateMutation.mutate(editData);
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm(language === 'zh' ? '确认删除此原子？此操作不可撤销。' : 'Confirm delete? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !atom) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">{language === 'zh' ? '未找到该原子' : 'Atom not found'}</p>
        <Button onClick={() => navigate('/brain')}>{language === 'zh' ? '返回列表' : 'Back to list'}</Button>
      </div>
    );
  }

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
              {isEditing ? (
                <Input
                  value={editData.name ?? atom.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-2xl font-bold h-9 w-64"
                />
              ) : (
                <h2 className="text-2xl font-bold text-slate-900">{atom.name}</h2>
              )}
              <Badge variant="outline">{atom.version}</Badge>
            </div>
            {isEditing ? (
              <Input
                value={editData.description ?? atom.description ?? ''}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 h-8 w-96"
                placeholder={t.description}
              />
            ) : (
              <p className="text-slate-500">{atom.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={atom.status === 'active'} onCheckedChange={(checked) => {
            if (isEditing) setEditData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }));
          }} />
          <span className="text-sm text-slate-600">{atom.status === 'active' ? t.active : t.inactive}</span>
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-1" />
            {t.duplicate}
          </Button>
          <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="w-4 h-4 mr-1" />
            {t.delete}
          </Button>
          {isEditing ? (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {t.save}
            </Button>
          ) : (
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleEdit}>
              <Edit3 className="w-4 h-4 mr-1" />
              {t.edit}
            </Button>
          )}
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
              <p className="text-2xl font-bold">{atom.usageCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{t.totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.successRate ? `${atom.successRate}%` : '-'}</p>
              <p className="text-xs text-slate-500">{t.accuracy}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.updatedAt ? new Date(atom.updatedAt).toLocaleDateString() : '-'}</p>
              <p className="text-xs text-slate-500">{t.lastUpdated}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atom.scenarios?.length ?? 0}</p>
              <p className="text-xs text-slate-500">{t.scenarioCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tags */}
      <Card className="p-4">
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
          <Card className="p-6">
            <h4 className="font-bold mb-4">{t.description}</h4>
            <p className="text-slate-600">{atom.description || '-'}</p>
          </Card>
          {atom.config && (
            <Card className="p-6">
              <h4 className="font-bold mb-4">Config</h4>
              <pre className="text-sm text-slate-600 bg-slate-50 p-3 rounded overflow-auto">
                {JSON.stringify(atom.config, null, 2)}
              </pre>
            </Card>
          )}
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.usedIn}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(atom.scenarios ?? []).length > 0 ? atom.scenarios!.map((scenario, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{scenario}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell className="text-slate-400 text-center py-8">
                      {language === 'zh' ? '暂无使用记录' : 'No usage data'}
                    </TableCell>
                  </TableRow>
                )}
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
