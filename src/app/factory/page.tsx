import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wand2, Users, Zap, TrendingUp, ShieldCheck, Sparkles, Edit3, Zap as Execute, Search, Trash2, Loader2, ChevronDown, ChevronUp, Users as UsersIcon, Target, FileText, Route, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getScenarios, getDefaultScenarios, createScenario, deleteScenario, generateScenarioByAI, type GeneratedFourStageScenario, type ScenarioCategory } from '@/services/scenario';

type WizardMode = 'ai-input' | 'ai-preview' | 'manual';

const categoryOptions: { value: ScenarioCategory; labelZh: string; labelEn: string }[] = [
  { value: 'acquisition', labelZh: '获客期', labelEn: 'Acquisition' },
  { value: 'growth', labelZh: '成长期', labelEn: 'Growth' },
  { value: 'mature', labelZh: '成熟期', labelEn: 'Mature' },
  { value: 'declining', labelZh: '衰退期', labelEn: 'Declining' },
  { value: 'recovery', labelZh: '挽回期', labelEn: 'Recovery' },
];

const categories = (lang: 'zh' | 'en') => {
  const t = translations[lang].factoryPage;
  return [
    { value: 'all', label: t.all },
    ...categoryOptions.map(c => ({ value: c.value, label: lang === 'zh' ? c.labelZh : c.labelEn })),
  ];
};

export function FactoryPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
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

  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      setShowWizard(false);
      setWizardMode('ai-input');
      setAiInput('');
      setAiResult(null);
      setAiErrors([]);
      setManualTitle('');
      setManualGoal('');
      setManualCategory('growth');
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.message || (language === 'zh' ? '创建失败' : 'Failed to create'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message || (language === 'zh' ? '删除失败' : 'Failed to delete'));
    },
  });

  const t = translations[language].factoryPage;

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState<WizardMode>('ai-input');
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState<GeneratedFourStageScenario | null>(null);
  const [aiErrors, setAiErrors] = useState<string[]>([]);
  // Manual config form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualGoal, setManualGoal] = useState('');
  const [manualCategory, setManualCategory] = useState<ScenarioCategory>('growth');
  // Preview collapsibles (default all expanded)
  const [previewOpen, setPreviewOpen] = useState<{ insight: boolean; segment: boolean; content: boolean; strategy: boolean }>({
    insight: true, segment: true, content: true, strategy: true,
  });

  const openWizard = (mode: WizardMode = 'ai-input') => {
    setWizardMode(mode);
    setCreateError(null);
    setShowWizard(true);
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

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) return;
    setCreateError(null);
    setAiErrors([]);
    try {
      const res = await generateScenarioByAI(aiInput);
      const result = res.data;
      if (!result.valid) {
        // result is the { valid: false; errors: string[] } branch; cast helps the
        // non-strict tsconfig narrow on discriminated unions.
        setAiErrors((result as { valid: false; errors: string[] }).errors);
        return;
      }
      setAiResult(result.scenario);
      setWizardMode('ai-preview');
    } catch (e) {
      setAiErrors([language === 'zh' ? 'AI 生成失败，请稍后重试' : 'AI generation failed, please retry']);
    }
  };

  const handleRetryAI = () => {
    setAiErrors([]);
    handleAIGenerate();
  };

  const handleConfirmAI = () => {
    if (!aiResult) return;
    createMutation.mutate({
      title: aiResult.title,
      goal: aiResult.goal,
      category: aiResult.category,
      icon: aiResult.icon,
      color: aiResult.color,
      config: {
        insightConfig: aiResult.insightConfig,
        segmentConfig: aiResult.segmentConfig,
        contentConfig: aiResult.contentConfig,
        strategyConfig: aiResult.strategyConfig,
      },
    });
  };

  const handleManualCreate = () => {
    if (!manualTitle.trim() || !manualGoal.trim()) {
      setCreateError(language === 'zh' ? '请填写标题和目标' : 'Title and goal are required');
      return;
    }
    setCreateError(null);
    createMutation.mutate({
      title: manualTitle.trim(),
      goal: manualGoal.trim(),
      category: manualCategory,
      icon: 'Sparkles',
      color: 'blue',
    });
  };

  const handleMarketInspire = (action: string) => {
    const scenarioMap: Record<string, { title: string; goal: string; category: string }> = {
      gold: { title: '黄金定投场景', goal: '针对高净值客户，基于黄金价格上涨趋势，推荐黄金定投产品', category: 'growth' },
      rrr: { title: '信贷促活场景', goal: '响应央行降准政策，向潜力客户推荐信用贷款产品', category: 'acquisition' },
      nasdaq: { title: '防御性资产配置', goal: '纳斯达克科技股回调期间，推荐客户进行防御性资产配置', category: 'mature' },
    };
    const config = scenarioMap[action];
    if (!config) return;
    setCreateError(null);
    createMutation.mutate(config);
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
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => openWizard('ai-input')}
            className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            {t.smartGenerate}
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => openWizard('manual')}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.createScenario}
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
              <Sparkles className="w-5 h-5" />
              {t.marketInspiration}
            </div>
            <p className="text-indigo-800/60 dark:text-indigo-300/60 text-sm mt-0.5">{t.marketInspirationDesc}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full uppercase tracking-wider">
            {t.realtimeUpdate}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: t.goldUpdate, tag: t.goldTag, action: 'gold' },
            { title: t.rrrUpdate, tag: t.rrrTag, action: 'rrr' },
            { title: t.nasdaqUpdate, tag: t.nasdaqTag, action: 'nasdaq' },
          ].map((item) => (
            <div key={item.action} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-5 rounded-xl border border-white dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-tight">{item.tag}</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</div>
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 p-0 h-auto rounded-xl" onClick={() => handleMarketInspire(item.action)}>
                <Wand2 className="w-3 h-3" />
                {t.startScenario}
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
            className="pl-10 rounded-xl bg-white dark:bg-slate-900"
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

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{deleteError}</p>
      )}

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
                    onClick={() => {
                      setDeleteError(null);
                      deleteMutation.mutate(scenario.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600" onClick={() => navigate(`/factory/${scenario.id}`)}>
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

      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) { setShowWizard(false); setCreateError(null); } }}>
        <DialogContent className="max-w-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {wizardMode === 'manual' ? t.manualTitle : t.aiArchitect}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {wizardMode === 'manual' ? t.manualDesc : t.aiArchitectDesc}
                </p>
              </div>
            </div>
          </div>

          {/* AI Input view */}
          {wizardMode === 'ai-input' && (
            <div className="space-y-4 pt-2">
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={t.aiPlaceholder}
                className="min-h-[120px]"
              />
              {aiErrors.length > 0 && (
                <div className="text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2 space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">{t.aiErrorTitle}</p>
                  <ul className="list-disc list-inside text-amber-700 dark:text-amber-400 text-xs space-y-0.5">
                    {aiErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                  <p className="text-amber-600 dark:text-amber-400 text-xs pt-1">{t.aiErrorHint}</p>
                </div>
              )}
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">{createError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setWizardMode('manual')}
                  className="flex-1"
                >
                  {t.switchToManual}
                </Button>
                {aiErrors.length > 0 ? (
                  <Button
                    onClick={handleRetryAI}
                    disabled={createMutation.isPending || !aiInput.trim()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {t.retry}
                  </Button>
                ) : (
                  <Button
                    onClick={handleAIGenerate}
                    disabled={createMutation.isPending || !aiInput.trim()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {t.generate}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* AI Preview view */}
          {wizardMode === 'ai-preview' && aiResult && (
            <div className="space-y-4 pt-2">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600">{aiResult.category}</Badge>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{aiResult.title}</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{aiResult.goal}</p>
              </div>

              <PreviewSection
                icon={<UsersIcon className="w-4 h-4" />}
                title={t.insightSection}
                open={previewOpen.insight}
                onToggle={() => setPreviewOpen(p => ({ ...p, insight: !p.insight }))}
              >
                <Field label={t.targetTags} value={aiResult.insightConfig.targetTags.join('、')} />
                <Field label={t.analysisLogic} value={aiResult.insightConfig.analysisLogic} />
              </PreviewSection>

              <PreviewSection
                icon={<Target className="w-4 h-4" />}
                title={t.segmentSection}
                open={previewOpen.segment}
                onToggle={() => setPreviewOpen(p => ({ ...p, segment: !p.segment }))}
              >
                <Field label={t.criteria} value={aiResult.segmentConfig.criteria} />
                <Field label={t.maxCount} value={String(aiResult.segmentConfig.maxCount)} />
              </PreviewSection>

              <PreviewSection
                icon={<FileText className="w-4 h-4" />}
                title={t.contentSection}
                open={previewOpen.content}
                onToggle={() => setPreviewOpen(p => ({ ...p, content: !p.content }))}
              >
                <Field label={t.style} value={aiResult.contentConfig.style} />
                <Field label={t.channels} value={aiResult.contentConfig.channels.join('、')} />
              </PreviewSection>

              <PreviewSection
                icon={<Route className="w-4 h-4" />}
                title={t.strategySection}
                open={previewOpen.strategy}
                onToggle={() => setPreviewOpen(p => ({ ...p, strategy: !p.strategy }))}
              >
                <Field label={t.path} value={aiResult.strategyConfig.path} />
              </PreviewSection>

              {createError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">{createError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setWizardMode('ai-input'); setAiResult(null); }}
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {t.backToEdit}
                </Button>
                <Button
                  onClick={handleConfirmAI}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {t.confirmSave}
                </Button>
              </div>
            </div>
          )}

          {/* Manual config view */}
          {wizardMode === 'manual' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={language === 'zh' ? '场景名称' : 'Scenario title'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Goal</label>
                <Textarea
                  value={manualGoal}
                  onChange={(e) => setManualGoal(e.target.value)}
                  placeholder={language === 'zh' ? '营销目标描述' : 'Marketing goal description'}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
                <Tabs value={manualCategory} onValueChange={(v) => setManualCategory(v as ScenarioCategory)}>
                  <TabsList>
                    {categoryOptions.map(c => (
                      <TabsTrigger key={c.value} value={c.value}>
                        {language === 'zh' ? c.labelZh : c.labelEn}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">{createError}</p>
              )}
              <Button
                onClick={handleManualCreate}
                disabled={createMutation.isPending || !manualTitle.trim() || !manualGoal.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {t.manualSave}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewSection({ icon, title, open, onToggle, children }: { icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-white dark:bg-slate-950">{children}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">{label}</div>
      <div className="text-sm text-slate-700 dark:text-slate-200">{value}</div>
    </div>
  );
}
