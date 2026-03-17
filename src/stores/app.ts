import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'zh' | 'en';
export type Theme = 'light' | 'dark';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AppState {
  language: Language;
  theme: Theme;
  sidebarCollapsed: boolean;
  breadcrumbs: { label: string; href?: string }[];
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'zh',
      theme: 'light',
      sidebarCollapsed: false,
      breadcrumbs: [],
      
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
    }),
    {
      name: 'app-storage',
    }
  )
);