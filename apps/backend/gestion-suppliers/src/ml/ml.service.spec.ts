import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MLService, PredictDelayInput, PredictDelayOutput } from './ml.service';

describe('MLService', () => {
  let service: MLService;
  let httpService: jest.Mocked<HttpService>;

  const mockPredictDelayInput: PredictDelayInput = {
    supplierId: '123',
    amount: 15000,
    days: 7,
    month: 6,
    supplierRating: 8.5,
  };

  const mockPredictDelayOutput: PredictDelayOutput = {
    risk_percentage: 35,
    risk_level: 'Modéré',
    risk_color: '#f97316',
    recommendation: 'Surveiller ce fournisseur',
    will_be_late: false,
  };

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MLService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<MLService>(MLService);
    httpService = module.get(HttpService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── predictDelay ───────────────────────────────────────────────────────────

  describe('predictDelay', () => {
    it('should return prediction from ML API on success', async () => {
      const mockResponse: AxiosResponse<PredictDelayOutput> = {
        data: mockPredictDelayOutput,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.predictDelay(mockPredictDelayInput);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:8001/predict',
        {
          supplier_id: 123,
          order_amount: 15000,
          planned_days: 7,
          supplier_rating: 8.5,
          order_month: 6,
        },
        { timeout: 5000 },
      );
      expect(result).toEqual(mockPredictDelayOutput);
    });

    it('should handle missing optional fields with defaults', async () => {
      const inputWithoutOptionals: PredictDelayInput = {
        supplierId: 'abc',
        amount: 0,
        days: 0,
        month: 0,
      };

      const mockResponse: AxiosResponse<PredictDelayOutput> = {
        data: mockPredictDelayOutput,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      await service.predictDelay(inputWithoutOptionals);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:8001/predict',
        expect.objectContaining({
          supplier_id: 0,
          supplier_rating: 0,
        }),
        { timeout: 5000 },
      );
    });

    it('should return fallback prediction on API error', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const result = await service.predictDelay({
        supplierId: '123',
        amount: 10000,
        days: 5,
        month: 3,
      });

      expect(result).toMatchObject({
        risk_percentage: 35,
        risk_level: 'Modéré',
        risk_color: '#f97316',
        will_be_late: false,
      });
      expect(result.recommendation).toContain('API ML est indisponible');
    });

    it('should return high risk fallback for short delays (days <= 3)', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('API unavailable')),
      );

      const result = await service.predictDelay({
        supplierId: '123',
        amount: 10000,
        days: 2,
        month: 3,
      });

      expect(result.risk_percentage).toBe(15);
      expect(result.risk_level).toBe('Faible');
      expect(result.risk_color).toBe('#22c55e');
      expect(result.will_be_late).toBe(false);
    });

    it('should return moderate risk fallback for medium delays (4-7 days)', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('API unavailable')),
      );

      const result = await service.predictDelay({
        supplierId: '123',
        amount: 10000,
        days: 5,
        month: 3,
      });

      expect(result.risk_percentage).toBe(35);
      expect(result.risk_level).toBe('Modéré');
      expect(result.risk_color).toBe('#f97316');
      expect(result.will_be_late).toBe(false);
    });

    it('should return high risk fallback for long delays (days > 7)', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('API unavailable')),
      );

      const result = await service.predictDelay({
        supplierId: '123',
        amount: 10000,
        days: 15,
        month: 3,
      });

      expect(result.risk_percentage).toBe(60);
      expect(result.risk_level).toBe('Élevé');
      expect(result.risk_color).toBe('#ef4444');
      expect(result.will_be_late).toBe(true);
    });
  });

  // ── getSupplierStats ───────────────────────────────────────────────────────

  describe('getSupplierStats', () => {
    it('should return supplier stats from ML API on success', async () => {
      const mockStats = {
        name: 'Test Supplier',
        late_rate: 0.25,
        avg_delay: 3.5,
        total_orders: 40,
      };

      const mockResponse: AxiosResponse = {
        data: mockStats,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getSupplierStats('123');

      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:8001/supplier/123/stats',
        { timeout: 5000 },
      );
      expect(result).toEqual(mockStats);
    });

    it('should return null on API error', async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error('API unavailable')),
      );

      const result = await service.getSupplierStats('123');

      expect(result).toBeNull();
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'ML API /supplier/stats unavailable',
        'API unavailable',
      );
    });

    it('should handle network timeout', async () => {
      httpService.get.mockReturnValue(
        throwError(() => ({ message: 'Timeout exceeded' })),
      );

      const result = await service.getSupplierStats('456');

      expect(result).toBeNull();
    });
  });

  // ── getFallbackPrediction (private method testing via predictDelay) ────────

  describe('fallback prediction logic', () => {
    beforeEach(() => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('API down')),
      );
    });

    it('should calculate risk_percentage correctly for boundary values', async () => {
      const result3Days = await service.predictDelay({
        supplierId: '1',
        amount: 1000,
        days: 3,
        month: 1,
      });
      expect(result3Days.risk_percentage).toBe(15);

      const result7Days = await service.predictDelay({
        supplierId: '1',
        amount: 1000,
        days: 7,
        month: 1,
      });
      expect(result7Days.risk_percentage).toBe(35);

      const result8Days = await service.predictDelay({
        supplierId: '1',
        amount: 1000,
        days: 8,
        month: 1,
      });
      expect(result8Days.risk_percentage).toBe(60);
    });

    it('should set will_be_late to true when risk >= 50%', async () => {
      const result = await service.predictDelay({
        supplierId: '1',
        amount: 1000,
        days: 10,
        month: 1,
      });

      expect(result.risk_percentage).toBe(60);
      expect(result.will_be_late).toBe(true);
    });

    it('should set will_be_late to false when risk < 50%', async () => {
      const result = await service.predictDelay({
        supplierId: '1',
        amount: 1000,
        days: 5,
        month: 1,
      });

      expect(result.risk_percentage).toBe(35);
      expect(result.will_be_late).toBe(false);
    });
  });
});
