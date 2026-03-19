import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-react';

const WHITE_LIST = ['/login', '/404'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchCurrentUser();
    }
  }, []);

  if (WHITE_LIST.includes(location.pathname)) {
    return <>{children}</>;
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/copilot" replace />;
  }

  return <>{children}</>;
}

export function AuthGuardWithLoader({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (WHITE_LIST.includes(location.pathname)) {
    return <>{children}</>;
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      {children}
    </>
  );
}

export default AuthGuard;
