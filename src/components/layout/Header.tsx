import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const routeTitles: Record<string, { zh: string; en: string }> = {
  '/copilot': { zh: '智能营销助手', en: 'Copilot' },
  '/factory': { zh: '场景工厂', en: 'Scenario Factory' },
  '/brain': { zh: '策略原子库', en: 'Strategy Brain' },
  '/performance': { zh: '效果仪表盘', en: 'Performance' },
  '/expert': { zh: '专家模式', en: 'Expert Mode' },
  '/agents': { zh: '智能体管理', en: 'Agent Management' },
  '/settings': { zh: '系统设置', en: 'Settings' },
};

export function AppHeader() {
  const location = useLocation();
  const { language, setLanguage } = useAppStore();

  const currentTitle = routeTitles[location.pathname] || { zh: 'FinMark AI', en: 'FinMark AI' };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LayoutDashboard className="w-4 h-4" />
          <span>{language === 'zh' ? currentTitle.zh : currentTitle.en}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-slate-100 rounded-full p-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage('zh')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
              language === 'zh' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            中文
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
              language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
            }`}
          >
            EN
          </Button>
        </div>
        <Avatar className="w-8 h-8 bg-indigo-100">
          <AvatarFallback className="text-xs text-indigo-700 font-bold">JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}