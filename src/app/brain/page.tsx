import React, { useState } from 'react';
import { Brain, Plus, Search, Zap, MessageCircle, FileText, ShieldAlert, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getAtoms, createAtom, deleteAtom, Atom } from '@/services/strategy';

const typeConfig = (lang: 'zh' | 'en') => ({
  hook: { label: lang === 'zh' ? '钩子' : 'Hook', badgeVariant: 'orange' as const },
  channel: { label: lang === 'zh' ? '渠道' : 'Channel', badgeVariant: 'info' as const },
  content: { label: lang === 'zh' ? '内容' : 'Content', badgeVariant: 'purple' as const },
  risk: { label: lang === 'zh' ? '风险' : 'Risk', badgeVariant: 'error' as const },
});

export function BrainPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('usage');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [atomForm, setAtomForm] = useState({ name: '', type: 'hook' as 'hook' | 'channel' | 'content' | 'risk', description: '', successRate: 80, tags: '' });

  const { data: atomsData, isLoading } = useQuery({
    queryKey: ['atoms', typeFilter],
    queryFn: () => getAtoms(typeFilter !== 'all' ? { type: typeFilter } : {}),
  });

  const atoms = atomsData?.data || [];

  const createMutation = useMutation({
    mutationFn: createAtom,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['atoms'] }); setDialogOpen(false); },
    onError: (err: any) => setCreateError(err?.response?.data?.message || (language === 'zh' ? '创建失败' : 'Failed to create')),
  });

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
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setAtomForm({ name: '', type: 'hook', description: '', successRate: 80, tags: '' }); setDialogOpen(true); }}>
          <Plus className="w-5 h-5" />
          {t.createAtom}
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
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
          <Card key={atom.id} className="p-6 space-y-4 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
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
                  <Badge variant={types[atom.type].badgeVariant} className="text-xs">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'zh' ? '创建策略原子' : 'Create Strategy Atom'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'zh' ? '原子名称' : 'Atom Name'}</Label>
              <Input value={atomForm.name} onChange={e => setAtomForm(f => ({ ...f, name: e.target.value }))} placeholder={language === 'zh' ? '例如：限时加息钩子' : 'e.g. Limited-time rate hook'} />
            </div>
            <div>
              <Label>{language === 'zh' ? '类型' : 'Type'}</Label>
              <Select value={atomForm.type} onValueChange={v => setAtomForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hook">{language === 'zh' ? '钩子' : 'Hook'}</SelectItem>
                  <SelectItem value="channel">{language === 'zh' ? '渠道' : 'Channel'}</SelectItem>
                  <SelectItem value="content">{language === 'zh' ? '内容' : 'Content'}</SelectItem>
                  <SelectItem value="risk">{language === 'zh' ? '风险' : 'Risk'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'zh' ? '描述' : 'Description'}</Label>
              <Input value={atomForm.description} onChange={e => setAtomForm(f => ({ ...f, description: e.target.value }))} placeholder={language === 'zh' ? '原子功能描述' : 'Describe this atom'} />
            </div>
            <div>
              <Label>{language === 'zh' ? '成功率' : 'Success Rate'}: {atomForm.successRate}%</Label>
              <Input type="range" min={0} max={100} value={atomForm.successRate} onChange={e => setAtomForm(f => ({ ...f, successRate: parseInt(e.target.value) }))} className="py-1" />
            </div>
            <div>
              <Label>{language === 'zh' ? '标签（逗号分隔）' : 'Tags (comma-separated)'}</Label>
              <Input value={atomForm.tags} onChange={e => setAtomForm(f => ({ ...f, tags: e.target.value }))} placeholder={language === 'zh' ? '新客, 限时, 加息' : 'new_customer, limited, bonus'} />
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
            <Button onClick={() => { if (!atomForm.name) return; createMutation.mutate({ name: atomForm.name, type: atomForm.type, description: atomForm.description, successRate: atomForm.successRate, tags: atomForm.tags.split(',').map(t => t.trim()).filter(Boolean) }); }} disabled={!atomForm.name || createMutation.isPending}>
              {language === 'zh' ? '创建' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
