import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 *
 * 功能：
 * - 检查用户是否已认证
 * - 未认证用户重定向到 /login
 * - 已认证用户正常渲染子组件
 *
 * 白名单路由（不需要认证）：
 * - /login
 * - /404
 */
const WHITE_LIST = ['/login', '/404'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // 白名单路由，直接放行
  if (WHITE_LIST.includes(location.pathname)) {
    return <>{children}</>;
  }

  // 检查认证状态
  if (!isAuthenticated) {
    // 重定向到登录页，并记录原始访问路径
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * 未认证守卫组件（用于登录页）
 * 已认证用户访问登录页时，重定向到首页
 */
export function GuestGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/copilot" replace />;
  }

  return <>{children}</>;
}

/**
 * 带加载状态的认证守卫
 * 在检查认证状态时显示加载动画
 */
export function AuthGuardWithLoader({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // 白名单路由
  if (WHITE_LIST.includes(location.pathname)) {
    return <>{children}</>;
  }

  // 加载中状态（可用于异步检查 token 有效性）
  if (isAuthenticated === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-sm text-slate-500">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default AuthGuard;
