import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Factory, 
  Edit3, 
  Save, 
  Copy, 
  Sparkles, 
  Wand2, 
  Plus, 
  Loader2, 
  ShieldCheck, 
  Target, 
  Zap, 
  ArrowRight, 
  Users, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical,
  PenTool,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Markdown from 'react-markdown';
import { callAgent, streamAgent } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AgentType = 'insight' | 'segment' | 'content' | 'strategy' | 'analyst';

interface AgentState {
  type: AgentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const AGENTS: AgentState[] = [
  { 
    type: 'insight', 
    label: '洞察智能体', 
    icon: <Users className="w-5 h-5" />, 
    color: 'bg-blue-500', 
    description: '分析客户行为，挖掘潜在金融需求。',
  },
  { 
    type: 'segment', 
    label: '客群智能体', 
    icon: <Target className="w-5 h-5" />, 
    color: 'bg-emerald-500', 
    description: '精准定义目标客群，实现分层营销。',
  },
  { 
    type: 'content', 
    label: '内容智能体', 
    icon: <PenTool className="w-5 h-5" />, 
    color: 'bg-purple-500', 
    description: '生成符合合规要求的个性化营销文案。',
  },
  { 
    type: 'strategy', 
    label: '策略智能体', 
    icon: <Zap className="w-5 h-5" />, 
    color: 'bg-orange-500', 
    description: '制定多渠道触达路径与预算分配。',
  },
  { 
    type: 'analyst', 
    label: '评估智能体', 
    icon: <BarChart3 className="w-5 h-5" />, 
    color: 'bg-rose-500', 
    description: '实时监控营销效果，提供ROI分析。',
  },
];

const MOCK_CHART_DATA = [
  { name: '周一', value: 400 },
  { name: '周二', value: 300 },
  { name: '周三', value: 600 },
  { name: '周四', value: 800 },
  { name: '周五', value: 500 },
  { name: '周六', value: 900 },
  { name: '周日', value: 700 },
];

const PIE_DATA = [
  { name: '高净值', value: 400 },
  { name: '大众理财', value: 300 },
  { name: '年轻白领', value: 300 },
  { name: '退休养老', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#f43f5e'];

import { translations, type Language } from './i18n';
import type { Scenario, StrategyTemplate, StrategyAtom } from './types';

const DEFAULT_ATOMS = (t: any): StrategyAtom[] => [
  { id: '1', name: t.strategyAtomType?.hook || '高收益钩子', category: 'hook', description: '使用高于市场平均水平的理财收益率吸引客户点击。', successRate: 0.12, usageCount: 1240, tags: ['理财', '高收益'] },
  { id: '2', name: t.strategyAtomType?.channel || '企微+短信组合', category: 'channel', description: '先通过企微触达，未读客户在4小时后自动补发短信。', successRate: 0.25, usageCount: 850, tags: ['全渠道', '自动化'] },
  { id: '3', name: t.strategyAtomType?.content || '温情关怀模版', category: 'content', description: '以节日或生日为契机，结合资产变动提醒的温情文案。', successRate: 0.08, usageCount: 2100, tags: ['情感营销', '存量挽回'] },
  { id: '4', name: t.strategyAtomType?.risk || '风险承受匹配', category: 'risk', description: '强制校验客户风险等级，仅向匹配的客户展示高风险产品。', successRate: 0.99, usageCount: 5000, tags: ['合规', '风控'] },
];

const DEFAULT_SCENARIOS = (t: any): Scenario[] => [
  { 
    id: 'churn', 
    title: t.churnTitle || '流失预警挽回', 
    icon: 'Users', 
    goal: t.churnGoal || '识别近30天资产下降超过30%的客户并进行挽回营销', 
    color: 'bg-rose-50',
    template: {
      insightLogic: '分析近30天AUM变动，识别资产流失前兆。',
      segmentCriteria: 'AUM下降 > 30% 且 风险等级 <= R3',
      contentStyle: '关怀式、提供专属理财顾问服务',
      strategyPath: 'APP Push -> 客户经理外呼'
    }
  },
  { 
    id: 'new_fund', 
    title: t.fundTitle || '新发基金推广', 
    icon: 'Zap', 
    goal: t.fundGoal || '针对有理财经验且风险偏好为中高风险的客户推广新发ESG基金', 
    color: 'bg-indigo-50',
    template: {
      insightLogic: '筛选历史基金交易活跃客户。',
      segmentCriteria: '风险承受能力 >= R4 且 有ESG投资偏好',
      contentStyle: '专业、强调长期价值与社会责任',
      strategyPath: '微信公众号 -> 企微私聊'
    }
  },
  { 
    id: 'credit', 
    title: t.creditTitle || '信用卡分期提升', 
    icon: 'TrendingUp', 
    goal: t.creditGoal || '筛选有大额消费记录但未办理分期的客户，推送分期优惠券', 
    color: 'bg-emerald-50',
    template: {
      insightLogic: '识别单笔消费 > 5000元 且 未办理分期的交易。',
      segmentCriteria: '信用卡活跃用户 且 信用评分良好',
      contentStyle: '利益导向、强调分期优惠与额度灵活',
      strategyPath: '短信 -> APP 弹窗'
    }
  },
  { 
    id: 'pension', 
    title: t.pensionTitle || '个人养老金开户', 
    icon: 'ShieldCheck', 
    goal: t.pensionGoal || '针对符合开户条件且未开立养老金账户的代发工资客户进行推广', 
    color: 'bg-orange-50',
    template: {
      insightLogic: '匹配代发工资名单与养老金开户状态。',
      segmentCriteria: '年龄 25-55 岁 且 未开立养老金账户',
      contentStyle: '稳健、强调税收优惠与养老保障',
      strategyPath: '代发工资短信 -> 手机银行首页 Banner'
    }
  },
];

const PROFESSIONAL_FEATURES = (t: any) => [
  { title: t.auditTrail, desc: t.auditTrailDesc, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
  { title: t.rmCopilot, desc: t.rmCopilotDesc, icon: <MessageSquare className="w-4 h-4 text-indigo-600" /> },
  { title: t.privacyComputing, desc: t.privacyComputingDesc, icon: <Zap className="w-4 h-4 text-amber-600" /> },
  { title: t.kycRisk, desc: t.kycRiskDesc, icon: <BarChart3 className="w-4 h-4 text-rose-600" /> },
];

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const t = translations[lang];
  
  const [mode, setMode] = useState<'copilot' | 'expert' | 'factory' | 'brain' | 'agents' | 'performance'>('copilot');
  const [activeAgent, setActiveAgent] = useState<AgentType>('insight');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, { content: string; data?: any }>>({});
  const [goal, setGoal] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [strategyAtoms, setStrategyAtoms] = useState<StrategyAtom[]>([]);
  const [editingAtom, setEditingAtom] = useState<StrategyAtom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setScenarios(DEFAULT_SCENARIOS(t));
    setStrategyAtoms(DEFAULT_ATOMS(t));
  }, [lang]);

  const [isOrchestrating, setIsOrchestrating] = useState(false);

  const handleRunAgent = async (agentType: AgentType, isAuto: boolean = false) => {
    setLoading(true);
    try {
      const res = await callAgent(agentType, goal, responses, lang);
      setResponses(prev => ({ ...prev, [agentType]: res }));
      const currentIndex = AGENTS.findIndex(a => a.type === agentType);
      const nextIndex = currentIndex + 2;
      setCurrentStep(nextIndex);
      
      // Auto-chaining logic
      if (isAuto && isOrchestrating && currentIndex < AGENTS.length - 1) {
        const nextAgent = AGENTS[currentIndex + 1];
        setTimeout(() => {
          if (isOrchestrating) handleRunAgent(nextAgent.type, true);
        }, 800);
      } else if (isAuto && currentIndex === AGENTS.length - 1) {
        setIsOrchestrating(false);
      }
    } catch (error) {
      console.error(`API Error for ${agentType}, using mock fallback:`, error);
      const mockRes = {
        content: lang === 'zh'
          ? `这是来自**${translations[lang].agents[agentType]}**的模拟分析报告。基于当前目标“${goal}”，我们识别了核心风险点并制定了相应的对策。`
          : `This is a simulated analysis report from **${translations[lang].agents[agentType]}**. Based on the goal "${goal}", we identified core risks and developed countermeasures.`
      };
      setResponses(prev => ({ ...prev, [agentType]: mockRes }));
      const currentIndex = AGENTS.findIndex(a => a.type === agentType);
      const nextIndex = currentIndex + 2;
      setCurrentStep(nextIndex);

      // Auto-chaining logic for fallback
      if (isAuto && isOrchestrating && currentIndex < AGENTS.length - 1) {
        const nextAgent = AGENTS[currentIndex + 1];
        setTimeout(() => {
          if (isOrchestrating) handleRunAgent(nextAgent.type, true);
        }, 800);
      } else if (isAuto && currentIndex === AGENTS.length - 1) {
        setIsOrchestrating(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmartGenerate = async () => {
    if (!aiInput) return;
    setLoading(true);
    try {
      const res = await callAgent('architect', aiInput, {}, lang);
      try {
        const blueprint = JSON.parse(res.content.replace(/```json|```/g, ''));
        const newScenario: Scenario = {
          id: Date.now().toString(),
          title: blueprint.title,
          goal: blueprint.goal,
          icon: 'Sparkles',
          color: 'bg-violet-50',
          isCustom: true,
          template: {
            insightLogic: blueprint.insightLogic,
            segmentCriteria: blueprint.segmentCriteria,
            contentStyle: blueprint.contentStyle,
            strategyPath: blueprint.strategyPath
          }
        };
        setEditingScenario(newScenario);
        setShowAiWizard(false);
        setAiInput('');
      } catch (e) {
        console.error("Failed to parse AI blueprint", e);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMaster = async (scenario?: Scenario) => {
    const finalGoal = scenario?.goal || goal;
    if (!finalGoal) return;
    setGoal(finalGoal);
    setLoading(true);
    setIsOrchestrating(true);
    setMode('copilot');
    setResponses(prev => ({ ...prev, master: { content: '' } }));
    
    try {
      const context = { 
        responses, 
        template: scenario?.template,
        isOptimized: !!scenario?.template 
      };
      
      const stream = streamAgent('master', finalGoal, context, lang);
      let fullContent = '';
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setResponses(prev => ({
          ...prev,
          master: { content: fullContent }
        }));
        // If we have content, we can show the step 1 (master plan generated)
        if (fullContent.length > 10) {
          setCurrentStep(1);
        }
      }

      // Automatically trigger the first agent after master plan is ready
      setTimeout(() => {
        if (isOrchestrating) handleRunAgent(AGENTS[0].type, true);
      }, 800);

    } catch (error) {
      console.error("Streaming Error, using mock fallback:", error);
      // Mock fallback for prototype stability
      const mockRes = {
        content: lang === 'zh' 
          ? `### 营销方案：${finalGoal}\n\n**1. 核心目标**：提升目标客群转化率 15%。\n**2. 洞察逻辑**：基于历史交易数据与行为偏好分析。\n**3. 执行路径**：洞察 -> 客群 -> 内容 -> 策略 -> 评估。\n\n*注意：当前处于演示模式，以上内容为系统生成的模拟方案。*`
          : `### Marketing Plan: ${finalGoal}\n\n**1. Core Goal**: Increase conversion rate by 15%.\n**2. Insight Logic**: Based on historical transaction data and behavioral preference analysis.\n**3. Execution Path**: Insight -> Segment -> Content -> Strategy -> Analyst.\n\n*Note: Currently in demo mode, the above content is a simulated plan.*`
      };
      setResponses(prev => ({ ...prev, master: mockRes }));
      setCurrentStep(1);
      // Fallback auto-trigger
      setTimeout(() => {
        if (isOrchestrating) handleRunAgent(AGENTS[0].type, true);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScenario = (scenario: Scenario) => {
    setScenarios(prev => {
      const exists = prev.find(s => s.id === scenario.id);
      if (exists) {
        return prev.map(s => s.id === scenario.id ? scenario : s);
      }
      return [...prev, scenario];
    });
    setEditingScenario(null);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">{t.appName}</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t.appSubtitle}</p>
        </div>

        <nav className="flex-1 p-4 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">{t.interactionMode}</div>
            <button
              onClick={() => setMode('copilot')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                mode === 'copilot' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium text-sm">{t.copilotMode}</span>
            </button>
            <button
              onClick={() => setMode('factory')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                mode === 'factory' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Factory className="w-4 h-4" />
              <span className="font-medium text-sm">{t.scenarioFactory}</span>
            </button>
            <button
              onClick={() => setMode('brain')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                mode === 'brain' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium text-sm">{t.strategyBrain}</span>
            </button>
            <button
              onClick={() => setMode('performance')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                mode === 'performance' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium text-sm">{t.performanceDashboard}</span>
            </button>
            <button
              onClick={() => setMode('expert')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                mode === 'expert' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium text-sm">{t.expertMode}</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">{t.agentManagement}</div>
            <button
              onClick={() => setMode('agents')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                mode === 'agents' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium text-sm">{t.agentManagement}</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600">{t.systemStatus}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {t.systemStatusDesc}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LayoutDashboard className="w-4 h-4" />
              <span>{mode === 'copilot' ? t.copilotMode : mode === 'factory' ? t.scenarioFactory : t.expertMode}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 mr-2">
              <button 
                onClick={() => setLang('zh')}
                className={cn("px-3 py-1 text-[10px] font-bold rounded-full transition-all", lang === 'zh' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
              >
                中文
              </button>
              <button 
                onClick={() => setLang('en')}
                className={cn("px-3 py-1 text-[10px] font-bold rounded-full transition-all", lang === 'en' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
              >
                EN
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">JD</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {mode === 'copilot' ? (
              <div className="space-y-12">
                {/* Goal Input Section */}
                <section className="text-center space-y-8">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{t.goalQuestion}</h2>
                    <p className="text-slate-500 text-lg">{t.goalSubtitle}</p>
                  </motion.div>

                  <div className="relative max-w-2xl mx-auto">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder={t.goalInputPlaceholder}
                      className="w-full bg-white border-2 border-slate-200 rounded-3xl px-8 py-6 text-xl shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    />
                    <button 
                      onClick={() => handleRunMaster()}
                      disabled={loading || !goal}
                      className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      {loading ? (lang === 'zh' ? '正在编排...' : 'Orchestrating...') : t.generatePlan}
                    </button>
                  </div>

                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-3 text-indigo-600"
                    >
                      <div className="flex gap-1">
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
                      </div>
                      <p className="text-sm font-bold animate-pulse">
                        {lang === 'zh' ? '营销总监正在调集智能体资源...' : 'Marketing Director is gathering agent resources...'}
                      </p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {scenarios.map(scenario => (
                      <button 
                        key={scenario.id}
                        onClick={() => handleRunMaster(scenario)}
                        disabled={loading}
                        className={cn(
                          "p-4 rounded-2xl border border-slate-100 text-left transition-all hover:shadow-md group relative overflow-hidden",
                          scenario.color,
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {loading && (
                          <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          {getIcon(scenario.icon)}
                        </div>
                        <h4 className="font-bold text-sm mb-1">{scenario.title}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{scenario.goal}</p>
                      </button>
                    ))}
                  </div>

                  {/* Professional Features Grid */}
                  <div className="pt-8 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{t.proFeaturesTitle}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PROFESSIONAL_FEATURES(t).map(feature => (
                        <div key={feature.title} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 text-left">
                          <div className="p-2 bg-slate-50 rounded-lg">{feature.icon}</div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-900">{feature.title}</h5>
                            <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Orchestration Workflow */}
                <AnimatePresence>
                  {responses.master && (
                    <motion.section 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8 pb-20"
                    >
                      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-10 space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
                              isOrchestrating ? "bg-indigo-600 animate-pulse" : "bg-slate-900"
                            )}>
                              {isOrchestrating ? <Sparkles className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-xl">
                                {isOrchestrating ? (lang === 'zh' ? '多智能体协同编排中...' : 'Multi-Agent Orchestrating...') : t.masterReady}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {isOrchestrating ? (lang === 'zh' ? '正在按序激活专家智能体执行子任务' : 'Activating expert agents to execute sub-tasks') : t.masterReadyDesc}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOrchestrating && (
                              <button 
                                onClick={() => setIsOrchestrating(false)}
                                className="mr-4 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all border border-rose-100"
                              >
                                {lang === 'zh' ? '停止编排' : 'Stop'}
                              </button>
                            )}
                            {isOrchestrating && (
                              <div className="flex gap-1 mr-4">
                                <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
                                <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
                                <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
                              </div>
                            )}
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{t.planGenerated}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-4 relative">
                          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-100 -z-10" />
                          
                          {AGENTS.map((agent, index) => {
                            const isCompleted = !!responses[agent.type];
                            const isActive = currentStep === index + 1;
                            
                            return (
                              <div key={agent.type} className="flex flex-col items-center text-center space-y-4">
                                <button
                                  onClick={() => {
                                    setIsOrchestrating(false);
                                    handleRunAgent(agent.type);
                                  }}
                                  disabled={loading}
                                  className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative",
                                    isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" :
                                    isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110" :
                                    "bg-white border-2 border-slate-100 text-slate-300"
                                  )}
                                >
                                  {isCompleted ? <ShieldCheck className="w-6 h-6" /> : (isActive && loading ? <Loader2 className="w-6 h-6 animate-spin" /> : agent.icon)}
                                  {isActive && !loading && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping" />}
                                </button>
                                <div className="space-y-1">
                                  <p className={cn("text-xs font-bold", isCompleted ? "text-emerald-600" : isActive ? "text-indigo-600" : "text-slate-400")}>
                                    {t.agents[agent.type as keyof typeof t.agents]}
                                  </p>
                                  <p className="text-[10px] text-slate-400 leading-tight px-2">{lang === 'zh' ? agent.description.split('，')[0] : agent.description.split(',')[0]}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">{t.executionDetails}</h4>
                            <div className="flex gap-2">
                              <button className="text-xs font-bold text-indigo-600 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">{t.exportPdf}</button>
                              <button className="text-xs font-bold text-indigo-600 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">{t.sharePlan}</button>
                            </div>
                          </div>
                          <div className="markdown-body prose prose-slate max-w-none bg-white p-6 rounded-2xl border border-slate-100">
                            <Markdown>{responses.master.content}</Markdown>
                          </div>

                          {/* Reasoning Trace Section */}
                          <div className="pt-6 border-t border-slate-200">
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <h5 className="text-sm font-bold text-slate-900">{t.traceProcess}</h5>
                              <span className="text-[10px] text-slate-400 font-normal">{t.traceDesc}</span>
                            </div>
                            <div className="space-y-3">
                              {AGENTS.filter(a => responses[a.type]).map((agent, idx) => (
                                <div key={agent.type} className="flex gap-4 group">
                                  <div className="flex flex-col items-center">
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold", agent.color)}>
                                      {idx + 1}
                                    </div>
                                    {idx < AGENTS.filter(a => responses[a.type]).length - 1 && (
                                      <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                                    )}
                                  </div>
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-slate-800">{t.agents[agent.type as keyof typeof t.agents]}</span>
                                      <span className="text-[10px] text-slate-400">Decision Point: {agent.type === 'insight' ? 'Demand Analysis' : agent.type === 'segment' ? 'Audience Selection' : 'Strategy Optimization'}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 bg-white border border-slate-100 p-3 rounded-xl shadow-sm group-hover:border-indigo-100 transition-colors">
                                      {lang === 'zh' 
                                        ? `基于“${responses.master.content?.slice(0, 30)}...”的上下文，我执行了${agent.description}，并输出了核心逻辑。` 
                                        : `Based on the context of "${responses.master.content?.slice(0, 30)}...", I executed ${agent.description} and outputted the core logic.`}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Dynamic Content from Agents */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {AGENTS.filter(a => responses[a.type]).map(agent => (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={agent.type} 
                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("p-1.5 rounded-lg text-white", agent.color)}>{agent.icon}</div>
                                    <span className="font-bold text-sm">{t.agents[agent.type as keyof typeof t.agents]}{lang === 'zh' ? '报告' : ' Report'}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t.completed}</span>
                                </div>
                                <div className="text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                  <Markdown>{responses[agent.type].content}</Markdown>
                                </div>
                                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                                  <button className="text-[10px] font-bold text-indigo-600 hover:underline">{t.viewMetrics} →</button>
                                  <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600">{t.regenerate}</button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
                            {t.saveDraft}
                          </button>
                          <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                            {t.launchCampaign}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>
            ) : mode === 'factory' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{t.scenarioFactory}</h2>
                    <p className="text-slate-500">{t.scenarioFactoryDesc}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowAiWizard(true)}
                      className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all"
                    >
                      <Wand2 className="w-5 h-5" />
                      {t.smartGenerate}
                    </button>
                    <button 
                      onClick={() => setEditingScenario({ id: Date.now().toString(), title: '', icon: 'Target', goal: '', color: 'bg-slate-50', isCustom: true })}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                      <Plus className="w-5 h-5" />
                      {t.createScenario}
                    </button>
                  </div>
                </div>

                {/* Market Inspiration Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[32px] p-8 border border-amber-100">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
                        <Sparkles className="w-5 h-5" />
                        {t.marketInspiration}
                      </div>
                      <p className="text-amber-800/60 text-sm">{t.marketInspirationDesc}</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
                      {t.realtimeUpdate}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: lang === 'zh' ? '黄金价格突破历史新高' : 'Gold Price Hits Record High', tag: lang === 'zh' ? '贵金属' : 'Precious Metals', action: lang === 'zh' ? '启动黄金定投场景' : 'Start Gold AIP Scenario' },
                      { title: lang === 'zh' ? '央行宣布降准 0.5%' : 'Central Bank Cuts RRR by 0.5%', tag: lang === 'zh' ? '货币政策' : 'Monetary Policy', action: lang === 'zh' ? '启动信贷促活场景' : 'Start Credit Activation' },
                      { title: lang === 'zh' ? '纳斯达克科技股集体回调' : 'Nasdaq Tech Stocks Correction', tag: lang === 'zh' ? '权益市场' : 'Equity Market', action: lang === 'zh' ? '启动防御性资产配置' : 'Start Defensive Allocation' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white hover:bg-white transition-all cursor-pointer group">
                        <div className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-tight">{item.tag}</div>
                        <div className="font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">{item.title}</div>
                        <button className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          <Wand2 className="w-3 h-3" />
                          {item.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Wizard Modal */}
                <AnimatePresence>
                  {showAiWizard && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6" />
                            <div>
                              <h3 className="text-xl font-bold">{t.aiArchitect}</h3>
                              <p className="text-xs text-indigo-100">{t.aiArchitectDesc}</p>
                            </div>
                          </div>
                          <button onClick={() => setShowAiWizard(false)} className="text-white/60 hover:text-white text-2xl">×</button>
                        </div>
                        <div className="p-8 space-y-6">
                          <textarea 
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            placeholder={t.aiArchitectPlaceholder}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-lg h-40 focus:border-indigo-500 outline-none transition-all resize-none"
                          />
                          <button 
                            onClick={handleSmartGenerate}
                            disabled={loading || !aiInput}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            {loading ? t.suggesting : t.smartGenerate}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {scenarios.map(scenario => (
                    <div key={scenario.id} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", scenario.color)}>
                            {getIcon(scenario.icon)}
                          </div>
                          <h4 className="font-bold text-lg">{scenario.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingScenario(scenario)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRunMaster(scenario)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{scenario.goal}</p>
                      
                      <div className="flex items-center gap-4 py-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <ShieldCheck className="w-3 h-3" />
                          {t.complianceScore}: 98
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          <Target className="w-3 h-3" />
                          {t.riskLevel}: {t.lowRisk}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{t.insightLogic}: <span className="text-slate-600 normal-case font-medium">{scenario.template?.insightLogic?.substring(0, 15)}...</span></div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{t.strategyPath}: <span className="text-slate-600 normal-case font-medium">{scenario.template?.strategyPath?.substring(0, 15)}...</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                {editingScenario && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xl font-bold">{t.templateSettings}</h3>
                        <button onClick={() => setEditingScenario(null)} className="text-slate-400 hover:text-slate-600">×</button>
                      </div>
                      <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'zh' ? '场景名称' : 'Scenario Name'}</label>
                            <input 
                              type="text" 
                              value={editingScenario.title}
                              onChange={(e) => setEditingScenario({ ...editingScenario, title: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'zh' ? '核心目标' : 'Core Goal'}</label>
                            <input 
                              type="text" 
                              value={editingScenario.goal}
                              onChange={(e) => setEditingScenario({ ...editingScenario, goal: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <div className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">{t.templateSettings}</div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.insightLogic}</label>
                              <textarea 
                                value={editingScenario.template?.insightLogic}
                                onChange={(e) => setEditingScenario({ ...editingScenario, template: { ...editingScenario.template, insightLogic: e.target.value } })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-20 resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.segmentCriteria}</label>
                              <textarea 
                                value={editingScenario.template?.segmentCriteria}
                                onChange={(e) => setEditingScenario({ ...editingScenario, template: { ...editingScenario.template, segmentCriteria: e.target.value } })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-20 resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.strategyPath}</label>
                              <textarea 
                                value={editingScenario.template?.strategyPath}
                                onChange={(e) => setEditingScenario({ ...editingScenario, template: { ...editingScenario.template, strategyPath: e.target.value } })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm h-20 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button 
                          onClick={() => setEditingScenario(null)}
                          className="px-6 py-3 text-slate-600 font-bold"
                        >
                          {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                        <button 
                          onClick={() => handleSaveScenario(editingScenario)}
                          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                        >
                          {t.saveTemplate}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            ) : mode === 'brain' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{t.strategyBrain}</h2>
                    <p className="text-slate-500">{t.strategyBrainDesc}</p>
                  </div>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200">
                    <Plus className="w-5 h-5" />
                    {lang === 'zh' ? '沉淀新原子' : 'New Atom'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: lang === 'zh' ? '总原子数' : 'Total Atoms', value: '128', color: 'text-indigo-600' },
                    { label: lang === 'zh' ? '平均成功率' : 'Avg Success Rate', value: '18.5%', color: 'text-emerald-600' },
                    { label: lang === 'zh' ? '本月复用' : 'Monthly Reuse', value: '2,450', color: 'text-amber-600' },
                    { label: lang === 'zh' ? '策略覆盖率' : 'Strategy Coverage', value: '92%', color: 'text-purple-600' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">{stat.label}</p>
                      <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">{t.strategyAtoms}</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder={t.searchPlaceholder} className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all w-64" />
                      </div>
                      <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.atomName}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.atomCategory}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.successRate}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.usageCount}</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {strategyAtoms.map(atom => (
                          <tr key={atom.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-bold text-slate-800">{atom.name}</div>
                                <div className="text-[10px] text-slate-400 line-clamp-1">{atom.description}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                                {atom.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${atom.successRate * 100}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{(atom.successRate * 100).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">{atom.usageCount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                {atom.tags.map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded">#{tag}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : mode === 'agents' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{t.agentManagement}</h2>
                    <p className="text-slate-500">{t.agentManagementDesc}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                      <FileText className="w-5 h-5" />
                      {t.auditLog}
                    </button>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200">
                      <Plus className="w-5 h-5" />
                      {t.newTask}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {AGENTS.map(agent => (
                    <div key={agent.type} className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", agent.color)}>
                            {agent.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-900">{t.agents[agent.type as keyof typeof t.agents]}</h4>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t.agentPrompt}</div>
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic">"{agent.description}"</p>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">{t.promptVersion}</span>
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">v2.4.1</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Last Audit</span>
                          <span className="text-slate-600 font-medium">2024-03-02 14:20</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex gap-2">
                        <button className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                          Edit Prompt
                        </button>
                        <button className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                          History
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : mode === 'performance' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{t.performanceDashboard}</h2>
                    <p className="text-slate-500">{t.performanceDashboardDesc}</p>
                  </div>
                  <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-200">
                    {['7D', '30D', '90D', 'ALL'].map(period => (
                      <button key={period} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", period === '30D' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600")}>
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{t.conversionRate}</h4>
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_CHART_DATA}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold text-slate-900">24.8%</div>
                        <div className="text-xs text-emerald-600 font-bold">+12.5% vs last month</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{t.roi}</h4>
                      <BarChart3 className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_CHART_DATA}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold text-slate-900">1:8.4</div>
                        <div className="text-xs text-indigo-600 font-bold">+5.2% vs last month</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{t.segmentDist}</h4>
                      <PieChart className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={PIE_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {PIE_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PIE_DATA.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Original Expert Mode UI (Simplified) */
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 h-[600px] flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                      {responses[activeAgent] ? (
                        <div className="markdown-body prose prose-sm max-w-none">
                          <Markdown>{responses[activeAgent].content}</Markdown>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                          <Zap className="w-12 h-12 mb-4" />
                          <p>{t.waitingCommandDesc}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          placeholder={lang === 'zh' ? `给${t.agents[activeAgent as keyof typeof t.agents]}下达指令...` : `Command ${t.agents[activeAgent as keyof typeof t.agents]}...`}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">{lang === 'zh' ? '执行' : 'Execute'}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold mb-4">{t.smartSuggestion}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {lang === 'zh' ? '当前选定的智能体正在分析实时市场数据。建议关注近期波动较大的基金板块。' : 'The selected agent is analyzing real-time market data. Suggest focusing on volatile fund sectors.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
