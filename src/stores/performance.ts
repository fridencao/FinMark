import { create } from 'zustand';

interface MetricData {
  reach: number;
  responseRate: number;
  conversionRate: number;
  roi: number;
}

interface PerformanceState {
  metrics: MetricData | null;
  trendData: any[];
  channelData: any[];
  segmentData: any[];
  activityData: any[];
  alarmRules: any[];
  isLoading: boolean;
  error: string | null;
  timeRange: string;
  setMetrics: (metrics: MetricData) => void;
  setTrendData: (data: any[]) => void;
  setChannelData: (data: any[]) => void;
  setSegmentData: (data: any[]) => void;
  setActivityData: (data: any[]) => void;
  setAlarmRules: (rules: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimeRange: (range: string) => void;
  reset: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  metrics: null,
  trendData: [],
  channelData: [],
  segmentData: [],
  activityData: [],
  alarmRules: [],
  isLoading: false,
  error: null,
  timeRange: 'week',
  
  setMetrics: (metrics) => set({ metrics }),
  setTrendData: (trendData) => set({ trendData }),
  setChannelData: (channelData) => set({ channelData }),
  setSegmentData: (segmentData) => set({ segmentData }),
  setActivityData: (activityData) => set({ activityData }),
  setAlarmRules: (alarmRules) => set({ alarmRules }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTimeRange: (timeRange) => set({ timeRange }),
  reset: () =>
    set({
      metrics: null,
      trendData: [],
      channelData: [],
      segmentData: [],
      activityData: [],
      alarmRules: [],
      isLoading: false,
      error: null,
    }),
}));