import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Animation */}
        <div className="relative">
          <div className="text-[120px] font-bold text-indigo-600 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <HelpCircle className="w-16 h-16 text-indigo-300 opacity-50" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-slate-900">
            页面未找到
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            抱歉，您访问的页面不存在或已被移除。
            <br />
            请检查 URL 是否正确，或返回首页继续浏览。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上一页
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-400 mb-3">常用页面</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { name: '智能营销助手', path: '/copilot' },
              { name: '场景工厂', path: '/factory' },
              { name: '策略原子库', path: '/brain' },
              { name: '效果仪表盘', path: '/performance' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
