import { useState, useEffect } from 'react';

export function useMockMode() {
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
    if (apiBase === '/api' || apiBase.includes('localhost')) {
      setIsMockMode(true);
    }
  }, []);

  return isMockMode;
}
