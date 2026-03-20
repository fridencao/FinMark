import React from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, Factory, Brain, BarChart3, Users, ShieldCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app';

const navItems = [
  { path: '/copilot', label: '智能营销助手', icon: Zap },
  { path: '/factory', label: '场景工厂', icon: Factory },
  { path: '/brain', label: '策略原子库', icon: Brain },
  { path: '/performance', label: '效果仪表盘', icon: BarChart3 },
  { path: '/expert', label: '专家模式', icon: Users },
];

const adminItems = [
  { path: '/agents', label: '智能体管理', icon: ShieldCheck },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export function AppSidebar() {
  const { language } = useAppStore();
  const t = language === 'zh' ? {
    interactionMode: '交互模式',
    management: '系统管理',
    systemStatus: '系统状态',
    systemStatusDesc: '所有服务运行正常'
  } : {
    interactionMode: 'Interaction',
    management: 'Management',
    systemStatus: 'System Status',
    systemStatusDesc: 'All services running normally'
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-screen">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">FinMark AI</h1>
        </div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          {language === 'zh' ? '金融智能营销平台' : 'Financial AI Marketing'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            {t.interactionMode}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  isActive ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            {t.management}
          </div>
          {adminItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  isActive ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.systemStatus}</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            {t.systemStatusDesc}
          </p>
        </div>
      </div>
    </aside>
  );
}