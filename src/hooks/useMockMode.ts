import { useState, useEffect } from 'react';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL as string;
    const hasToken = !!localStorage.getItem('auth-token');
    if (!apiBase && !hasToken) {
      setIsMockMode(true);
    }
  }, []);

  return isMockMode;
}
