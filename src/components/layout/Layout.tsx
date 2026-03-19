import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './Sidebar';
import { AppHeader } from './Header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MockModeBanner } from '@/components/common/MockModeBanner';

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <div className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MockModeBanner />
    </TooltipProvider>
  );
}