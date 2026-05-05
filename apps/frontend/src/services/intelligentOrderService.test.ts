import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Import after mock
import intelligentOrderService from './intelligentOrderService';

describe('intelligentOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── getAutoOrderRecommendations ───────────────────────────────────────────

  describe('getAutoOrderRecommendations', () => {
    it('returns empty array on error', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));
      const result = await intelligentOrderService.getAutoOrderRecommendations();
      expect(result).toEqual([]);
    });

    it('returns empty array on error with siteId', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));
      const result = await intelligentOrderService.getAutoOrderRecommendations('site-1');
      expect(result).toEqual([]);
    });

    it('returns data on success', async () => {
      const mockData = [{ materialId: 'mat-1', urgencyLevel: 'critical' }];
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });
      const result = await intelligentOrderService.getAutoOrderRecommendations();
      expect(result).toEqual(mockData);
    });

    it('calls correct URL without siteId', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      await intelligentOrderService.getAutoOrderRecommendations();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('auto-order/recommendations')
      );
    });

    it('calls correct URL with siteId', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      await intelligentOrderService.getAutoOrderRecommendations('site-123');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('siteId=site-123')
      );
    });
  });

  // ─── checkAutoOrder ────────────────────────────────────────────────────────

  describe('checkAutoOrder', () => {
    it('returns null on error', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('Not found'));
      const result = await intelligentOrderService.checkAutoOrder('mat-1');
      expect(result).toBeNull();
    });

    it('returns data on success', async () => {
      const mockData = { materialId: 'mat-1', autoSuggestOrder: true };
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });
      const result = await intelligentOrderService.checkAutoOrder('mat-1');
      expect(result).toEqual(mockData);
    });

    it('calls correct URL', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: null });
      await intelligentOrderService.checkAutoOrder('mat-42');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('mat-42/auto-order')
      );
    });
  });

  // ─── getSupplierSuggestions ────────────────────────────────────────────────

  describe('getSupplierSuggestions', () => {
    it('returns empty array on error', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('Server error'));
      const result = await intelligentOrderService.getSupplierSuggestions('mat-1');
      expect(result).toEqual([]);
    });

    it('returns data on success', async () => {
      const mockData = [{ supplierId: 'sup-1', isPreferred: true }];
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });
      const result = await intelligentOrderService.getSupplierSuggestions('mat-1');
      expect(result).toEqual(mockData);
    });

    it('calls correct URL', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      await intelligentOrderService.getSupplierSuggestions('mat-99');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('mat-99/suppliers')
      );
    });
  });
});
