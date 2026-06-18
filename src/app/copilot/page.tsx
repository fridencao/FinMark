import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Network, MessageSquare, Save, Loader2, ShieldCheck, BotMessageSquare, Lock, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { useCopilotStore } from '@/stores/copilot';
import { translations } from '@/i18n';
import { GoalInputSection } from '@/components/copilot/GoalInputSection';
import { QuickScenariosSection } from '@/components/copilot/QuickScenariosSection';
import { WorkflowSection } from '@/components/copilot/WorkflowSection';
import { AgentResultsSection } from '@/components/copilot/AgentResultsSection';
import { RMChatDialog } from '@/components/copilot/RMChatDialog';
import { ABTestCanvas } from '@/components/copilot/ABTestCanvas';
import { Button } from '@/components/ui/button';

export default function CopilotPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const { masterResult, isOrchestrating, isLoading, stopOrchestration } = useCopilotStore();
  const [showRMChat, setShowRMChat] = useState(false);
  const [showABTest, setShowABTest] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  const t = translations[language].copilotPage;

  const handleStopOrchestration = () => {
    stopOrchestration();
  };

  return (
    <div className="space-y-8">
      <section className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-slate-900">{t.goalQuestion}</h2>
          <p className="text-slate-500">{t.goalSubtitle}</p>
        </motion.div>

        <GoalInputSection />

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 text-indigo-600"
          >
            <div className="flex gap-1">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-600 rounded-full" />
            </div>
            <p className="text-sm font-semibold animate-pulse">
              {language === 'zh' ? '营销总监正在调集智能体资源...' : 'Marketing Director is gathering agent resources...'}
            </p>
            {isOrchestrating && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStopOrchestration}
                className="mt-2"
              >
                {language === 'zh' ? '停止编排' : 'Stop'}
              </Button>
            )}
          </motion.div>
        )}

        <QuickScenariosSection />

        <div className="pt-8 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{t.proFeaturesTitle}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: t.auditTrail, desc: t.auditTrailDesc, Icon: ShieldCheck, iconColor: 'text-indigo-500', bgColor: 'bg-indigo-50' },
              { title: t.rmCopilot, desc: t.rmCopilotDesc, Icon: BotMessageSquare, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
              { title: t.privacyComputing, desc: t.privacyComputingDesc, Icon: Lock, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50' },
              { title: t.kycRisk, desc: t.kycRiskDesc, Icon: BarChart3, iconColor: 'text-amber-500', bgColor: 'bg-amber-50' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.bgColor}`}>
                  <feature.Icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{feature.title}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(masterResult || isOrchestrating) && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <WorkflowSection />

          <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
            <AgentResultsSection />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all"
              onClick={() => {
                if (masterResult) {
                  localStorage.setItem('copilot-draft', JSON.stringify({ goal: masterResult, savedAt: new Date().toISOString() }));
                  setDraftSaved(true);
                  draftTimerRef.current = setTimeout(() => setDraftSaved(false), 2000);
                }
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              {draftSaved ? (language === 'zh' ? '已保存' : 'Saved') : t.saveDraft}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowABTest(true)}
              className="px-6 py-3 bg-white text-emerald-600 border border-emerald-200 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-all flex items-center gap-2"
            >
              <Network className="w-4 h-4" />
              {t.strategyCanvas}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRMChat(true)}
              className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {t.rmCopilotBtn}
            </Button>
            <Button
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 flex items-center gap-2"
              onClick={() => navigate('/factory')}
            >
              {t.launchCampaign}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.section>
      )}

      <RMChatDialog open={showRMChat} onOpenChange={setShowRMChat} />
      <ABTestCanvas open={showABTest} onOpenChange={setShowABTest} />
    </div>
  );
}