import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '@/stores/app';

describe('App Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.setLanguage('zh');
      result.current.setTheme('light');
      result.current.setSidebarCollapsed(false);
      result.current.setBreadcrumbs([]);
    });
  });

  describe('language', () => {
    it('should have default language as zh', () => {
      const { result } = renderHook(() => useAppStore());
      expect(result.current.language).toBe('zh');
    });

    it('should set language to en', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');
    });

    it('should set language to zh', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLanguage('zh');
      });

      expect(result.current.language).toBe('zh');
    });
  });

  describe('theme', () => {
    it('should have default theme as light', () => {
      const { result } = renderHook(() => useAppStore());
      expect(result.current.theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should set theme to light', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('sidebarCollapsed', () => {
    it('should have default sidebarCollapsed as false', () => {
      const { result } = renderHook(() => useAppStore());
      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it('should set sidebarCollapsed to true', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSidebarCollapsed(true);
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });
  });

  describe('breadcrumbs', () => {
    it('should have default empty breadcrumbs', () => {
      const { result } = renderHook(() => useAppStore());
      expect(result.current.breadcrumbs).toEqual([]);
    });

    it('should set breadcrumbs', () => {
      const { result } = renderHook(() => useAppStore());

      const crumbs = [
        { label: 'Home', href: '/' },
        { label: 'Settings' },
      ];

      act(() => {
        result.current.setBreadcrumbs(crumbs);
      });

      expect(result.current.breadcrumbs).toEqual(crumbs);
    });

    it('should update breadcrumbs', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setBreadcrumbs([{ label: 'Home' }]);
      });

      expect(result.current.breadcrumbs).toHaveLength(1);

      act(() => {
        result.current.setBreadcrumbs([
          { label: 'Home', href: '/' },
          { label: 'Profile', href: '/profile' },
        ]);
      });

      expect(result.current.breadcrumbs).toHaveLength(2);
    });
  });

  describe('state transitions', () => {
    it('should handle multiple state changes', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLanguage('en');
        result.current.setTheme('dark');
        result.current.setSidebarCollapsed(true);
        result.current.setBreadcrumbs([{ label: 'Test' }]);
      });

      expect(result.current.language).toBe('en');
      expect(result.current.theme).toBe('dark');
      expect(result.current.sidebarCollapsed).toBe(true);
      expect(result.current.breadcrumbs).toHaveLength(1);
    });
  });
});
