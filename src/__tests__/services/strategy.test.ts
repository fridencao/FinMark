import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiModule from '@/services/api';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import * as strategyService from '@/services/strategy';

describe('Strategy Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAtoms', () => {
    it('should fetch atoms without params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getAtoms();

      expect(apiModule.default.get).toHaveBeenCalledWith('/atoms', { params: undefined });
    });

    it('should fetch atoms with type filter', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getAtoms({ type: 'hook', page: 1, limit: 20 });

      expect(apiModule.default.get).toHaveBeenCalledWith('/atoms', {
        params: { type: 'hook', page: 1, limit: 20 },
      });
    });
  });

  describe('getAtom', () => {
    it('should fetch a single atom', async () => {
      const mockResponse = { data: { id: '1', name: 'Test Atom' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getAtom('1');

      expect(apiModule.default.get).toHaveBeenCalledWith('/atoms/1');
    });
  });

  describe('createAtom', () => {
    it('should create a new atom', async () => {
      const mockResponse = { data: { id: '2', name: 'New Atom' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'New Atom', type: 'hook' as const, tags: ['test'] };
      await strategyService.createAtom(data);

      expect(apiModule.default.post).toHaveBeenCalledWith('/atoms', data);
    });
  });

  describe('updateAtom', () => {
    it('should update an existing atom', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated Atom' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated Atom' };
      await strategyService.updateAtom('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith('/atoms/1', data);
    });
  });

  describe('deleteAtom', () => {
    it('should delete an atom', async () => {
      (apiModule.default.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });

      await strategyService.deleteAtom('1');

      expect(apiModule.default.delete).toHaveBeenCalledWith('/atoms/1');
    });
  });

  describe('getABTests', () => {
    it('should fetch AB tests', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getABTests();

      expect(apiModule.default.get).toHaveBeenCalledWith('/strategy/abtests', { params: undefined });
    });

    it('should fetch AB tests with params', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getABTests({ status: 'running' });

      expect(apiModule.default.get).toHaveBeenCalledWith('/strategy/abtests', { params: { status: 'running' } });
    });
  });

  describe('getABTest', () => {
    it('should fetch a single AB test', async () => {
      const mockResponse = { data: { id: '1', name: 'Test AB' } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getABTest('1');

      expect(apiModule.default.get).toHaveBeenCalledWith('/strategy/abtests/1');
    });
  });

  describe('createABTest', () => {
    it('should create a new AB test', async () => {
      const mockResponse = { data: { id: '2', name: 'New AB Test' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = {
        name: 'New AB Test',
        type: 'content' as const,
        branches: [{ id: 'b1', name: 'A', weight: 50, config: {} }],
        metric: 'conversion',
      };
      await strategyService.createABTest(data);

      expect(apiModule.default.post).toHaveBeenCalledWith('/strategy/abtests', data);
    });
  });

  describe('updateABTest', () => {
    it('should update an existing AB test', async () => {
      const mockResponse = { data: { id: '1', name: 'Updated AB' } };
      (apiModule.default.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = { name: 'Updated AB' };
      await strategyService.updateABTest('1', data);

      expect(apiModule.default.put).toHaveBeenCalledWith('/strategy/abtests/1', data);
    });
  });

  describe('startABTest', () => {
    it('should start an AB test', async () => {
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'running' } });

      await strategyService.startABTest('1');

      expect(apiModule.default.post).toHaveBeenCalledWith('/strategy/abtests/1/start');
    });
  });

  describe('stopABTest', () => {
    it('should stop an AB test', async () => {
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'paused' } });

      await strategyService.stopABTest('1');

      expect(apiModule.default.post).toHaveBeenCalledWith('/strategy/abtests/1/stop');
    });
  });

  describe('getABTestResult', () => {
    it('should fetch AB test result', async () => {
      const mockResponse = { data: { winner: 'A', lift: 0.15 } };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getABTestResult('1');

      expect(apiModule.default.get).toHaveBeenCalledWith('/strategy/abtests/1/result');
    });
  });

  describe('getSchedules', () => {
    it('should fetch schedules', async () => {
      const mockResponse = { data: [] };
      (apiModule.default.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await strategyService.getSchedules();

      expect(apiModule.default.get).toHaveBeenCalledWith('/strategy/schedules', { params: undefined });
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule', async () => {
      const mockResponse = { data: { id: '2', name: 'New Schedule' } };
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const data = {
        name: 'New Schedule',
        triggerType: 'periodic' as const,
        triggerConfig: { interval: 'daily' },
        channels: ['短信'],
      };
      await strategyService.createSchedule(data);

      expect(apiModule.default.post).toHaveBeenCalledWith('/strategy/schedules', data);
    });
  });

  describe('pauseSchedule', () => {
    it('should pause a schedule', async () => {
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'paused' } });

      await strategyService.pauseSchedule('1');

      expect(apiModule.default.post).toHaveBeenCalledWith('/strategy/schedules/1/pause');
    });
  });

  describe('resumeSchedule', () => {
    it('should resume a schedule', async () => {
      (apiModule.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'active' } });

      await strategyService.resumeSchedule('1');

      expect(apiModule.default.post).toHaveBeenCalledWith('/strategy/schedules/1/resume');
    });
  });
});
