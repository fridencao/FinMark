import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Network, MessageSquare, Save, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { useCopilotStore } from '@/stores/copilot';
import { GoalInputSection } from '@/components/copilot/GoalInputSection';
import { QuickScenariosSection } from '@/components/copilot/QuickScenariosSection';
import { WorkflowSection } from '@/components/copilot/WorkflowSection';
import { AgentResultsSection } from '@/components/copilot/AgentResultsSection';
import { RMChatDialog } from '@/components/copilot/RMChatDialog';
import { ABTestCanvas } from '@/components/copilot/ABTestCanvas';
import { Button } from '@/components/ui/button';

export default function CopilotPage() {
  const { language } = useAppStore();
  const { masterResult, isOrchestrating, isLoading, stopOrchestration } = useCopilotStore();
  const [showRMChat, setShowRMChat] = useState(false);
  const [showABTest, setShowABTest] = useState(false);

  const t = language === 'zh' ? {
    goalQuestion: '您想要达成什么营销目标？',
    goalSubtitle: '输入您的营销目标，AI将为您自动生成完整的营销方案',
    proFeaturesTitle: '专业功能',
    auditTrail: '审计追踪',
    auditTrailDesc: '完整的操作记录，满足金融合规要求',
    rmCopilot: 'RM Copilot',
    rmCopilotDesc: 'AI助手辅助客户经理进行话术对练',
    privacyComputing: '隐私计算',
    privacyComputingDesc: '数据不出网，保障客户隐私安全',
    kycRisk: 'KYC风控',
    kycRiskDesc: '智能识别客户风险等级，精准匹配产品',
    saveDraft: '保存草稿',
    strategyCanvas: '策略画布 (A/B测试)',
    rmCopilotBtn: 'RM Copilot 话术对练',
    launchCampaign: '执行营销',
  } : {
    goalQuestion: 'What marketing goal do you want to achieve?',
    goalSubtitle: 'Enter your marketing goal, AI will generate a complete marketing plan',
    proFeaturesTitle: 'Professional Features',
    auditTrail: 'Audit Trail',
    auditTrailDesc: 'Complete operation records for financial compliance',
    rmCopilot: 'RM Copilot',
    rmCopilotDesc: 'AI assistant for role-play training',
    privacyComputing: 'Privacy Computing',
    privacyComputingDesc: 'Data stays local, protecting customer privacy',
    kycRisk: 'KYC Risk',
    kycRiskDesc: 'Intelligent risk assessment and product matching',
    saveDraft: 'Save Draft',
    strategyCanvas: 'Strategy Canvas (A/B Test)',
    rmCopilotBtn: 'RM Copilot Roleplay',
    launchCampaign: 'Launch Campaign',
  };

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
              { title: t.auditTrail, desc: t.auditTrailDesc, icon: '🛡️' },
              { title: t.rmCopilot, desc: t.rmCopilotDesc, icon: '💬' },
              { title: t.privacyComputing, desc: t.privacyComputingDesc, icon: '🔐' },
              { title: t.kycRisk, desc: t.kycRiskDesc, icon: '📊' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 text-left">
                <div className="text-2xl">{feature.icon}</div>
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
            <Button variant="outline" className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all">
              <Save className="w-4 h-4 mr-2" />
              {t.saveDraft}
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
            <Button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 flex items-center gap-2">
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