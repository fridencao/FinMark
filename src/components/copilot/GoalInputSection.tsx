import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { useCopilotStore } from '@/stores/copilot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { translations } from '@/i18n';

export function GoalInputSection() {
  const { language } = useAppStore();
  const { goal, setGoal, isLoading, startOrchestration, orchestrationError } = useCopilotStore();

  const t = translations[language].goalInput;

  const handleSubmit = () => {
    if (!goal.trim()) return;
    startOrchestration();
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <Input
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder={t.placeholder}
        className="w-full bg-white border-2 border-slate-200 rounded-3xl px-8 py-6 text-xl shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={isLoading}
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !goal}
        className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
        {isLoading ? t.orchestrating : t.generatePlan}
      </Button>
      {orchestrationError && (
        <p className="absolute -bottom-6 left-0 text-xs text-red-500">{orchestrationError}</p>
      )}
    </div>
  );
}
