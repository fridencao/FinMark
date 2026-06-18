import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerformanceStore } from '@/stores/performance';

describe('Performance Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePerformanceStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have null metrics', () => {
      const { result } = renderHook(() => usePerformanceStore());
      expect(result.current.metrics).toBeNull();
    });

    it('should have empty arrays for data', () => {
      const { result } = renderHook(() => usePerformanceStore());
      expect(result.current.trendData).toEqual([]);
      expect(result.current.channelData).toEqual([]);
      expect(result.current.segmentData).toEqual([]);
      expect(result.current.activityData).toEqual([]);
      expect(result.current.alarmRules).toEqual([]);
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => usePerformanceStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have null error', () => {
      const { result } = renderHook(() => usePerformanceStore());
      expect(result.current.error).toBeNull();
    });

    it('should have default timeRange as week', () => {
      const { result } = renderHook(() => usePerformanceStore());
      expect(result.current.timeRange).toBe('week');
    });
  });

  describe('setMetrics', () => {
    it('should set metrics', () => {
      const { result } = renderHook(() => usePerformanceStore());
      const metrics = { reach: 1000, responseRate: 0.5, conversionRate: 0.1, roi: 2.5 };

      act(() => {
        result.current.setMetrics(metrics);
      });

      expect(result.current.metrics).toEqual(metrics);
    });
  });

  describe('setTrendData', () => {
    it('should set trend data', () => {
      const { result } = renderHook(() => usePerformanceStore());
      const data = [{ date: '2024-01-01', value: 100 }];

      act(() => {
        result.current.setTrendData(data);
      });

      expect(result.current.trendData).toEqual(data);
    });
  });

  describe('setChannelData', () => {
    it('should set channel data', () => {
      const { result } = renderHook(() => usePerformanceStore());
      const data = [{ channel: '短信', count: 500 }];

      act(() => {
        result.current.setChannelData(data);
      });

      expect(result.current.channelData).toEqual(data);
    });
  });

  describe('setSegmentData', () => {
    it('should set segment data', () => {
      const { result } = renderHook(() => usePerformanceStore());
      const data = [{ segment: 'Young Adults', count: 200 }];

      act(() => {
        result.current.setSegmentData(data);
      });

      expect(result.current.segmentData).toEqual(data);
    });
  });

  describe('setActivityData', () => {
    it('should set activity data', () => {
      const { result } = renderHook(() => usePerformanceStore());
      const data = [{ id: '1', name: 'Activity 1' }];

      act(() => {
        result.current.setActivityData(data);
      });

      expect(result.current.activityData).toEqual(data);
    });
  });

  describe('setAlarmRules', () => {
    it('should set alarm rules', () => {
      const { result } = renderHook(() => usePerformanceStore());
      const rules = [{ id: '1', name: 'Rule 1', status: 'enabled' }];

      act(() => {
        result.current.setAlarmRules(rules);
      });

      expect(result.current.alarmRules).toEqual(rules);
    });
  });

  describe('setLoading', () => {
    it('should set loading', () => {
      const { result } = renderHook(() => usePerformanceStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      const { result } = renderHook(() => usePerformanceStore());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });
  });

  describe('setTimeRange', () => {
    it('should set time range', () => {
      const { result } = renderHook(() => usePerformanceStore());

      act(() => {
        result.current.setTimeRange('month');
      });

      expect(result.current.timeRange).toBe('month');
    });
  });

  describe('reset', () => {
    it('should reset main state but preserve timeRange', () => {
      const { result } = renderHook(() => usePerformanceStore());

      act(() => {
        result.current.setMetrics({ reach: 1000, responseRate: 0.5, conversionRate: 0.1, roi: 2.5 });
        result.current.setTrendData([{ date: '2024-01-01', value: 100 }]);
        result.current.setChannelData([{ channel: '短信', count: 500 }]);
        result.current.setSegmentData([{ segment: 'Young', count: 200 }]);
        result.current.setActivityData([{ id: '1' }]);
        result.current.setAlarmRules([{ id: '1' }]);
        result.current.setLoading(true);
        result.current.setError('error');
        result.current.setTimeRange('month');
        result.current.reset();
      });

      expect(result.current.metrics).toBeNull();
      expect(result.current.trendData).toEqual([]);
      expect(result.current.channelData).toEqual([]);
      expect(result.current.segmentData).toEqual([]);
      expect(result.current.activityData).toEqual([]);
      expect(result.current.alarmRules).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
