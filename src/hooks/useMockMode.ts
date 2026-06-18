import { useState, useEffect } from 'react';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    const useMock = import.meta.env.VITE_USE_MOCK;
    const apiBase = import.meta.env.VITE_API_BASE_URL as string;
    const hasToken = !!localStorage.getItem('auth-token');

    if (useMock === 'true') {
      setIsMockMode(true);
    } else if (useMock === 'false') {
      setIsMockMode(false);
    } else if (!apiBase && !hasToken) {
      setIsMockMode(true);
    }
  }, []);

  return isMockMode;
}
