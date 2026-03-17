import React, { useState } from 'react';
import { Brain, Plus, Search, Zap, MessageCircle, FileText, ShieldAlert, Filter, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StrategyAtom {
  id: string;
  name: string;
  type: 'hook' | 'channel' | 'content' | 'risk';
  description: string;
  successRate: number;
  usageCount: number;
  tags: string[];
}

const defaultAtoms: StrategyAtom[] = [
  { id: '1', name: '高收益钩子', type: 'hook', description: '使用高于市场平均水平的理财收益率吸引客户点击。', successRate: 12, usageCount: 1240, tags: ['理财', '高收益'] },
  { id: '2', name: '企微+短信组合', type: 'channel', description: '先通过企微触达，未读客户在4小时后自动补发短信。', successRate: 25, usageCount: 850, tags: ['全渠道', '自动化'] },
  { id: '3', name: '温情关怀模版', type: 'content', description: '以节日或生日为契机，结合资产变动提醒的温情文案。', successRate: 8, usageCount: 2100, tags: ['情感营销', '存量挽回'] },
  { id: '4', name: '风险承受匹配', type: 'risk', description: '强制校验客户风险等级，仅向匹配的客户展示高风险产品。', successRate: 99, usageCount: 5000, tags: ['合规', '风控'] },
  { id: '5', name: '限时优惠刺激', type: 'hook', description: '使用限时优惠、限量抢购等方式制造紧迫感。', successRate: 18, usageCount: 920, tags: ['促销', '紧迫感'] },
  { id: '6', name: 'APP Push+外呼', type: 'channel', description: 'APP推送触达，未接通客户由客户经理外呼跟进。', successRate: 22, usageCount: 680, tags: ['全渠道', '人工介入'] },
];

const typeConfig = (lang: 'zh' | 'en') => ({
  hook: { label: lang === 'zh' ? '钩子' : 'Hook', color: 'bg-orange-100 text-orange-700' },
  channel: { label: lang === 'zh' ? '渠道' : 'Channel', color: 'bg-blue-100 text-blue-700' },
  content: { label: lang === 'zh' ? '内容' : 'Content', color: 'bg-purple-100 text-purple-700' },
  risk: { label: lang === 'zh' ? '风险' : 'Risk', color: 'bg-red-100 text-red-700' },
});

export function BrainPage() {
  const { language } = useAppStore();
  const [atoms, setAtoms] = useState<StrategyAtom[]>(defaultAtoms);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('usage');

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
    sortBy: '排序',
    usage: '使用次数',
    rate: '成功率',
    name: '名称',
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
    sortBy: 'Sort by',
    usage: 'Usage',
    rate: 'Success Rate',
    name: 'Name',
  };

  const types = typeConfig(language);

  const filteredAtoms = atoms
    .filter(atom => {
      const matchType = typeFilter === 'all' || atom.type === typeFilter;
      const matchSearch = atom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        atom.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'usage') return b.usageCount - a.usageCount;
      if (sortBy === 'rate') return b.successRate - a.successRate;
      return 0;
    });

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Filter Bar */}
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
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder={t.all} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            <SelectItem value="hook">{t.hook}</SelectItem>
            <SelectItem value="channel">{t.channel}</SelectItem>
            <SelectItem value="content">{t.content}</SelectItem>
            <SelectItem value="risk">{t.risk}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder={t.sortBy} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usage">{t.usage}</SelectItem>
            <SelectItem value="rate">{t.rate}</SelectItem>
            <SelectItem value="name">{t.name}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Atom Type Tabs */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList>
          <TabsTrigger value="all">{t.all}</TabsTrigger>
          <TabsTrigger value="hook">{t.hook}</TabsTrigger>
          <TabsTrigger value="channel">{t.channel}</TabsTrigger>
          <TabsTrigger value="content">{t.content}</TabsTrigger>
          <TabsTrigger value="risk">{t.risk}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Atom Cards */}
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
                <span className="font-bold text-emerald-600">{atom.successRate}%</span>
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
              <Button variant="ghost" size="sm" className="text-xs text-red-500 rounded-xl">{t.delete}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}