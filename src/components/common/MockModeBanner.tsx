import { useMockMode } from '@/hooks/useMockMode';
import { AlertTriangle } from 'lucide-react';

export function MockModeBanner() {
  const isMockMode = useMockMode();

  if (!isMockMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 max-w-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <div>
          <p className="text-xs font-medium text-amber-800">Mock 模式</p>
          <p className="text-xs text-amber-600">
            当前使用 Mock 数据。设置 VITE_API_BASE_URL 启用真实 API。
          </p>
        </div>
      </div>
    </div>
  );
}
