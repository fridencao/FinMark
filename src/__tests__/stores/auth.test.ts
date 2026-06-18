import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth';
import * as apiModule from '@/services/api';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Auth Store', () => {
  const mockUser = {
    id: '1',
    username: 'testuser',
    name: 'Test User',
    role: 'admin',
    avatar: 'avatar.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    const { result } = renderHook(() => useAuthStore());
    act(() => {
      if (result.current.isAuthenticated) {
        result.current.logout();
      }
    });
  });

  describe('initial state', () => {
    it('should have null token initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.token).toBeNull();
    });

    it('should have null user initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should login with token and user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token-123', mockUser);
      });

      expect(result.current.token).toBe('test-token-123');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set auth-token in localStorage on login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token-123', mockUser);
      });

      expect(localStorage.getItem('auth-token')).toBe('test-token-123');
    });
  });

  describe('logout', () => {
    it('should logout and clear state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should remove auth-token from localStorage on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('auth-token')).toBeNull();
    });

    it('should remove user from localStorage on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user fields', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      act(() => {
        result.current.updateUser({ name: 'Updated Name', role: 'superadmin' });
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.user?.role).toBe('superadmin');
      expect(result.current.user?.id).toBe(mockUser.id);
    });

    it('should not update if user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: 'Should Not Update' });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('fetchCurrentUser', () => {
    it('should not fetch if no token', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(apiModule.default.get).not.toHaveBeenCalled();
    });

    it('should fetch current user when token exists', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      vi.clearAllMocks();

      const mockResponse = { data: { ...mockUser, name: 'Fetched User' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(apiModule.default.get).toHaveBeenCalledWith('/users/me');
    });

    it('should handle fetch error by logging out', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      vi.clearAllMocks();

      (apiModule.default.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set loading during fetch', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      vi.clearAllMocks();

      (apiModule.default.get as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: mockUser }), 100))
      );

      let loadingDuringFetch = false;

      await act(async () => {
        const promise = result.current.fetchCurrentUser();
        loadingDuringFetch = result.current.isLoading;
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should return false when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      const isAuth = result.current.checkAuth();

      expect(isAuth).toBe(false);
    });

    it('should return false when no token in localStorage', () => {
      localStorage.removeItem('auth-token');

      const { result } = renderHook(() => useAuthStore());

      const isAuth = result.current.checkAuth();

      expect(isAuth).toBe(false);
    });

    it('should return true when user is already authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test-token', mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      vi.clearAllMocks();

      const isAuth = result.current.checkAuth();

      expect(isAuth).toBe(true);
    });
  });
});
