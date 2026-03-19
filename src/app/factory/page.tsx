import React, { useState } from 'react';
import { Factory, Plus, Wand2, Users, Zap, TrendingUp, ShieldCheck, Sparkles, Edit3, Zap as Execute, Search, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getScenarios, getDefaultScenarios, createScenario, deleteScenario, Scenario } from '@/services/scenario';

const categories = (lang: 'zh' | 'en') => [
  { value: 'all', label: lang === 'zh' ? '全部' : 'All' },
  { value: 'acquisition', label: lang === 'zh' ? '获客期' : 'Acquisition' },
  { value: 'growth', label: lang === 'zh' ? '成长期' : 'Growth' },
  { value: 'mature', label: lang === 'zh' ? '成熟期' : 'Mature' },
  { value: 'declining', label: lang === 'zh' ? '衰退期' : 'Declining' },
  { value: 'recovery', label: lang === 'zh' ? '挽回期' : 'Recovery' },
];

export function FactoryPage() {
  const { language } = useAppStore();
  const queryClient = useQueryClient();

  const { data: scenariosData, isLoading: isLoadingScenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => getScenarios(),
  });

  const { data: defaultScenariosData } = useQuery({
    queryKey: ['scenarios', 'defaults'],
    queryFn: getDefaultScenarios,
  });

  const scenarios = scenariosData?.data || defaultScenariosData?.data || [];

  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenarios'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenarios'] }),
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const t = language === 'zh' ? {
    title: '场景工厂',
    subtitle: '创建和管理营销场景模板',
    smartGenerate: 'AI智能生成',
    createScenario: '创建场景',
    marketInspiration: '市场洞察',
    marketInspirationDesc: '实时热点助力营销灵感',
    realtimeUpdate: '实时',
    goldUpdate: '黄金价格突破历史新高',
    goldTag: '贵金属',
    goldAction: '启动黄金定投场景',
    rrrUpdate: '央行宣布降准 0.5%',
    rrrTag: '货币政策',
    rrrAction: '启动信贷促活场景',
    nasdaqUpdate: '纳斯达克科技股集体回调',
    nasdaqTag: '权益市场',
    nasdaqAction: '启动防御性资产配置',
    complianceScore: '合规评分',
    riskLevel: '风险等级',
    lowRisk: '低风险',
    mediumRisk: '中风险',
    highRisk: '高风险',
    insightLogic: '洞察逻辑',
    strategyPath: '策略路径',
    edit: '编辑',
    execute: '执行',
    aiArchitect: 'AI智能生成场景',
    aiArchitectDesc: '描述您的需求，AI帮您创建场景',
    aiPlaceholder: '帮我创建一个针对高净值客户的理财赎回预警场景...',
    generating: '生成中...',
    generate: '生成场景',
    cancel: '取消',
    searchPlaceholder: '搜索场景...',
  } : {
    title: 'Scenario Factory',
    subtitle: 'Create and manage marketing scenario templates',
    smartGenerate: 'AI Generate',
    createScenario: 'Create Scenario',
    marketInspiration: 'Market Insights',
    marketInspirationDesc: 'Real-time hotspots for marketing inspiration',
    realtimeUpdate: 'Real-time',
    goldUpdate: 'Gold Price Hits Record High',
    goldTag: 'Precious Metals',
    goldAction: 'Start Gold AIP',
    rrrUpdate: 'Central Bank Cuts RRR by 0.5%',
    rrrTag: 'Monetary Policy',
    rrrAction: 'Start Credit Activation',
    nasdaqUpdate: 'Nasdaq Tech Stocks Correction',
    nasdaqTag: 'Equity Market',
    nasdaqAction: 'Start Defensive Allocation',
    complianceScore: 'Compliance',
    riskLevel: 'Risk',
    lowRisk: 'Low',
    mediumRisk: 'Medium',
    highRisk: 'High',
    insightLogic: 'Insight',
    strategyPath: 'Strategy',
    edit: 'Edit',
    execute: 'Execute',
    aiArchitect: 'AI Generate Scenario',
    aiArchitectDesc: 'Describe your needs, AI creates the scenario',
    aiPlaceholder: 'Create a wealth warning scenario for high-net-worth clients...',
    generating: 'Generating...',
    generate: 'Generate',
    cancel: 'Cancel',
    searchPlaceholder: 'Search scenarios...',
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const filteredScenarios = scenarios.filter(s => {
    const matchCategory = activeCategory === 'all' || s.category === activeCategory;
    const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       s.goal.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleAIGenerate = () => {
    if (!aiInput.trim()) return;
    createMutation.mutate(
      { title: aiInput.substring(0, 30), goal: aiInput, category: 'growth' },
      {
        onSuccess: () => {
          setShowAIWizard(false);
          setAiInput('');
        },
      }
    );
  };

  if (isLoadingScenarios) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
            <p className="text-slate-500">{t.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIWizard(true)}
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-50"
          >
            <Wand2 className="w-5 h-5" />
            {t.smartGenerate}
          </Button>
          <Button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700">
            <Plus className="w-5 h-5" />
            {t.createScenario}
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <Sparkles className="w-5 h-5" />
              {t.marketInspiration}
            </div>
            <p className="text-amber-800/60 text-sm">{t.marketInspirationDesc}</p>
          </div>
          <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full uppercase tracking-wider">
            {t.realtimeUpdate}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: t.goldUpdate, tag: t.goldTag, action: t.goldAction },
            { title: t.rrrUpdate, tag: t.rrrTag, action: t.rrrAction },
            { title: t.nasdaqUpdate, tag: t.nasdaqTag, action: t.nasdaqAction },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-white hover:bg-white transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-amber-600 mb-2 uppercase tracking-tight">{item.tag}</div>
              <div className="font-semibold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">{item.title}</div>
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600 flex items-center gap-1 p-0 h-auto rounded-xl">
                <Wand2 className="w-3 h-3" />
                {item.action}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-10 rounded-xl"
          />
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            {categories(language).map(cat => (
              <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredScenarios.map(scenario => (
          <Card key={scenario.id} className="p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scenario.color || 'bg-slate-100'}`}>
                  {getIcon(scenario.icon)}
                </div>
                <h4 className="font-semibold text-base">{scenario.title}</h4>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                  <Edit3 className="w-4 h-4" />
                </Button>
                {scenario.isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => deleteMutation.mutate(scenario.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600">
                  <Execute className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{scenario.goal}</p>

            <div className="flex items-center gap-4 py-2">
              {scenario.complianceScore !== undefined && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-xl">
                  <ShieldCheck className="w-3 h-3" />
                  {t.complianceScore}: {scenario.complianceScore}
                </div>
              )}
              {scenario.riskLevel && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-xl">
                  <Zap className="w-3 h-3" />
                  {t.riskLevel}: {scenario.riskLevel === 'low' ? t.lowRisk : scenario.riskLevel === 'medium' ? t.mediumRisk : t.highRisk}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.insightLogic}: <span className="text-slate-600 normal-case font-medium">{scenario.goal.substring(0, 15)}...</span></div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.strategyPath}: <span className="text-slate-600 normal-case font-medium">APP Push → 外呼</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showAIWizard} onOpenChange={setShowAIWizard}>
        <DialogContent className="max-w-xl">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white rounded-t-xl -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold">{t.aiArchitect}</h3>
                <p className="text-xs text-indigo-100">{t.aiArchitectDesc}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder={t.aiPlaceholder}
              className="h-32"
            />
            <Button
              onClick={handleAIGenerate}
              disabled={createMutation.isPending || !aiInput.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.generating}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {t.generate}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
