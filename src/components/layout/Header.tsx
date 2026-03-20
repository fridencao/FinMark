import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const routeTitles: Record<string, { zh: string; en: string }> = {
  '/copilot': { zh: '智能营销助手', en: 'Copilot' },
  '/factory': { zh: '场景工厂', en: 'Scenario Factory' },
  '/factory/:id': { zh: '场景详情', en: 'Scenario Detail' },
  '/brain': { zh: '策略原子库', en: 'Strategy Brain' },
  '/brain/atom/:id': { zh: '原子详情', en: 'Atom Detail' },
  '/performance': { zh: '效果仪表盘', en: 'Performance' },
  '/performance/report': { zh: '报表中心', en: 'Report Center' },
  '/performance/alarm': { zh: '告警管理', en: 'Alarm Management' },
  '/expert': { zh: '专家模式', en: 'Expert Mode' },
  '/agents': { zh: '智能体管理', en: 'Agent Management' },
  '/settings': { zh: '系统设置', en: 'Settings' },
};

export function AppHeader() {
  const location = useLocation();
  const { language, setLanguage } = useAppStore();

  const getCurrentTitle = () => {
    const path = location.pathname;
    if (routeTitles[path]) {
      return language === 'zh' ? routeTitles[path].zh : routeTitles[path].en;
    }
    for (const [key, value] of Object.entries(routeTitles)) {
      if (key.includes(':') && path.match(new RegExp('^' + key.replace(/:[^/]+/, '[^/]+') + '$'))) {
        return language === 'zh' ? value.zh : value.en;
      }
    }
    return 'FinMark AI';
  };

  const currentTitle = getCurrentTitle();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LayoutDashboard className="w-4 h-4" />
          <span>{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage('zh')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
              language === 'zh' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            中文
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
              language === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'
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