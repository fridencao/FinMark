import React, { useState } from 'react';
import { Brain, Plus, Search, Zap, MessageCircle, FileText, ShieldAlert, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAtoms, createAtom, deleteAtom, Atom } from '@/services/strategy';

const typeConfig = (lang: 'zh' | 'en') => ({
  hook: { label: lang === 'zh' ? '钩子' : 'Hook', color: 'bg-orange-100 text-orange-700' },
  channel: { label: lang === 'zh' ? '渠道' : 'Channel', color: 'bg-blue-100 text-blue-700' },
  content: { label: lang === 'zh' ? '内容' : 'Content', color: 'bg-purple-100 text-purple-700' },
  risk: { label: lang === 'zh' ? '风险' : 'Risk', color: 'bg-red-100 text-red-700' },
});

export function BrainPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('usage');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: atomsData, isLoading } = useQuery({
    queryKey: ['atoms', typeFilter],
    queryFn: () => getAtoms(typeFilter !== 'all' ? { type: typeFilter } : {}),
  });

  const atoms = atomsData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: deleteAtom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atoms'] });
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message || (language === 'zh' ? '删除失败' : 'Failed to delete'));
    },
  });

  const t = language === 'zh' ? {
    title: '策略原子库',
    subtitle: '管理和复用营销策略组件',
    createAtom: '创建原子',
    searchPlaceholder: '搜索策略原子...',
    all: '全部',
    hook: '钩子',
    channel: '渠道',
    content: '内容',
    risk: '风险',
    successRate: '成功率',
    usageCount: '使用次数',
    applicableScenarios: '适用场景',
    addScenario: '添加场景',
    edit: '编辑',
    delete: '删除',
  } : {
    title: 'Strategy Brain',
    subtitle: 'Manage and reuse marketing strategy components',
    createAtom: 'Create Atom',
    searchPlaceholder: 'Search strategy atoms...',
    all: 'All',
    hook: 'Hook',
    channel: 'Channel',
    content: 'Content',
    risk: 'Risk',
    successRate: 'Success Rate',
    usageCount: 'Usage Count',
    applicableScenarios: 'Applicable Scenarios',
    addScenario: 'Add Scenario',
    edit: 'Edit',
    delete: 'Delete',
  };

  const types = typeConfig(language);

  const filteredAtoms = atoms
    .filter(atom => {
      const matchSearch = !searchTerm ||
        atom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (atom.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'usage') return b.usageCount - a.usageCount;
      if (sortBy === 'rate') return (b.successRate || 0) - (a.successRate || 0);
      return 0;
    });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
            <p className="text-slate-500">{t.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <Button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          {t.createAtom}
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList>
          <TabsTrigger value="all">{t.all}</TabsTrigger>
          <TabsTrigger value="hook">{t.hook}</TabsTrigger>
          <TabsTrigger value="channel">{t.channel}</TabsTrigger>
          <TabsTrigger value="content">{t.content}</TabsTrigger>
          <TabsTrigger value="risk">{t.risk}</TabsTrigger>
        </TabsList>
      </Tabs>

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{deleteError}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAtoms.map(atom => (
          <Card key={atom.id} className="p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  atom.type === 'hook' ? 'bg-orange-100' :
                  atom.type === 'channel' ? 'bg-blue-100' :
                  atom.type === 'content' ? 'bg-purple-100' : 'bg-red-100'
                }`}>
                  {atom.type === 'hook' && <Zap className="w-5 h-5 text-orange-600" />}
                  {atom.type === 'channel' && <MessageCircle className="w-5 h-5 text-blue-600" />}
                  {atom.type === 'content' && <FileText className="w-5 h-5 text-purple-600" />}
                  {atom.type === 'risk' && <ShieldAlert className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{atom.name}</h4>
                  <Badge variant="secondary" className={`text-xs ${types[atom.type].color}`}>
                    {types[atom.type].label}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{atom.description}</p>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400">{t.successRate}: </span>
                <span className="font-bold text-emerald-600">{atom.successRate !== undefined ? `${atom.successRate}%` : '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">{t.usageCount}: </span>
                <span className="font-bold text-indigo-600">{atom.usageCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {atom.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-50">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-2">{t.applicableScenarios}</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px] bg-slate-100">{language === 'zh' ? '流失挽回' : 'Churn Recovery'}</Badge>
                <Badge variant="secondary" className="text-[10px] bg-slate-100">{language === 'zh' ? '新发基金' : 'New Fund'}</Badge>
                <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2">
                  + {t.addScenario}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" className="text-xs rounded-xl">{t.edit}</Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 rounded-xl"
                onClick={() => {
                  setDeleteError(null);
                  deleteMutation.mutate(atom.id);
                }}
                disabled={deleteMutation.isPending}
              >
                {t.delete}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
