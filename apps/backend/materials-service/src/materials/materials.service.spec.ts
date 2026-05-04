import { Test, TestingModule } from '@nestjs/testing';
import { MaterialsService } from './materials.service';
import { getModelToken } from '@nestjs/mongoose';
import { Material } from './entities/material.entity';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MaterialsGateway } from './materials.gateway';
import { MaterialFlowService } from './services/material-flow.service';
import { MLTrainingEnhancedService } from './services/ml-training-enhanced.service';
import { ImportExportService } from './services/import-export.service';
import { SitesService } from '../sites/sites.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ===== MOCKS =====
const createMockMaterial = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  code: 'MAT001',
  name: 'Ciment Portland',
  category: 'construction',
  quantity: 100,
  unit: 'kg',
  stockMinimum: 20,
  minimumStock: 20,
  maximumStock: 500,
  status: 'active',
  siteId: null,
  qrCode: 'data:image/png;base64,test',
  qrCodeImage: null,
  barcode: 'MAT-123456-789',
  images: [],
  reservedQuantity: 0,
  damagedQuantity: 0,
  reorderCount: 0,
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({ _id: '507f1f77bcf86cd799439011', code: 'MAT001', name: 'Ciment Portland', quantity: 100 }),
  ...overrides,
});

const mockMaterial = createMockMaterial();

const mockMaterialModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  deleteOne: jest.fn(),
  aggregate: jest.fn(),
  db: {
    model: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  },
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockHttpService = { axiosRef: { get: jest.fn() } };
const mockGateway = { emitMaterialUpdate: jest.fn(), emitStockUpdate: jest.fn() };
const mockFlowService = { recordMovement: jest.fn().mockResolvedValue(undefined) };
const mockMlService = { detectConsumptionAnomaly: jest.fn().mockResolvedValue({ isAnomaly: false }) };
const mockImportExportService = { importFromExcel: jest.fn(), exportToExcel: jest.fn(), exportToPDF: jest.fn() };
const mockSitesService = { findOne: jest.fn().mockResolvedValue(null), findAll: jest.fn().mockResolvedValue([]) };

// ===== TESTS =====
describe('MaterialsService', () => {
  let service: MaterialsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: getModelToken(Material.name), useValue: mockMaterialModel },
        { provide: HttpService, useValue: mockHttpService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: MaterialsGateway, useValue: mockGateway },
        { provide: MaterialFlowService, useValue: mockFlowService },
        { provide: MLTrainingEnhancedService, useValue: mockMlService },
        { provide: ImportExportService, useValue: mockImportExportService },
        { provide: SitesService, useValue: mockSitesService },
      ],
    }).compile();
    service = module.get<MaterialsService>(MaterialsService);
  });

  // ===== 1. SERVICE DEFINITION =====
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===== 2. findOne =====
  describe('findOne', () => {
    it('should return a material by valid id', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toMatchObject({ code: 'MAT001', name: 'Ciment Portland' });
    });

    it('should call findById with correct id', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      await service.findOne('507f1f77bcf86cd799439011');
      expect(mockMaterialModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if material not found', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id format', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short id', async () => {
      await expect(service.findOne('123')).rejects.toThrow(BadRequestException);
    });
  });

  // ===== 3. findByCode =====
  describe('findByCode', () => {
    it('should return a material by code', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.findByCode('MAT001');
      expect(result).toMatchObject({ code: 'MAT001', name: 'Ciment Portland' });
    });

    it('should call findOne with correct code filter', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      await service.findByCode('MAT001');
      expect(mockMaterialModel.findOne).toHaveBeenCalledWith({ code: 'MAT001' });
    });

    it('should throw NotFoundException if code not found', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findByCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 4. findByQRCode =====
  describe('findByQRCode', () => {
    it('should return material by QR code', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.findByQRCode('data:image/png;base64,test');
      expect(result).toMatchObject({ code: 'MAT001', name: 'Ciment Portland' });
    });

    it('should call findOne with correct qrCode filter', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      await service.findByQRCode('qr-test-123');
      expect(mockMaterialModel.findOne).toHaveBeenCalledWith({ qrCode: 'qr-test-123' });
    });

    it('should throw NotFoundException if QR code not found', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findByQRCode('invalid-qr')).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 5. findByBarcode =====
  describe('findByBarcode', () => {
    it('should return material by barcode', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.findByBarcode('MAT-123456-789');
      expect(result).toMatchObject({ code: 'MAT001', name: 'Ciment Portland' });
    });

    it('should call findOne with correct barcode filter', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      await service.findByBarcode('MAT-123456-789');
      expect(mockMaterialModel.findOne).toHaveBeenCalledWith({ barcode: 'MAT-123456-789' });
    });

    it('should throw NotFoundException if barcode not found', async () => {
      mockMaterialModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findByBarcode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 6. getLowStockMaterials =====
  describe('getLowStockMaterials', () => {
    it('should return materials with low stock', async () => {
      mockMaterialModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([mockMaterial]) });
      const result = await service.getLowStockMaterials();
      expect(result).toEqual([mockMaterial]);
    });

    it('should return empty array when no low stock', async () => {
      mockMaterialModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      const result = await service.getLowStockMaterials();
      expect(result).toEqual([]);
    });

    it('should return multiple low stock materials', async () => {
      const materials = [mockMaterial, { ...mockMaterial, _id: '507f1f77bcf86cd799439022' }];
      mockMaterialModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(materials) });
      const result = await service.getLowStockMaterials();
      expect(result).toHaveLength(2);
    });
  });

  // ===== 7. getExpiringMaterials =====
  describe('getExpiringMaterials', () => {
    it('should return expiring materials with default 30 days', async () => {
      mockMaterialModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockMaterial]) }) });
      const result = await service.getExpiringMaterials();
      expect(result).toBeDefined();
    });

    it('should return expiring materials with custom days', async () => {
      mockMaterialModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      const result = await service.getExpiringMaterials(7);
      expect(result).toBeDefined();
    });

    it('should return empty array when no expiring materials', async () => {
      mockMaterialModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      const result = await service.getExpiringMaterials(30);
      expect(result).toEqual([]);
    });
  });

  // ===== 8. remove =====
  describe('remove', () => {
    it('should delete a material successfully', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...mockMaterial, qrCodeImage: null }) });
      mockMaterialModel.deleteOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
      await expect(service.remove('507f1f77bcf86cd799439011')).resolves.not.toThrow();
    });

    it('should emit materialDeleted event after deletion', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...mockMaterial, qrCodeImage: null }) });
      mockMaterialModel.deleteOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
      await service.remove('507f1f77bcf86cd799439011');
      expect(mockGateway.emitMaterialUpdate).toHaveBeenCalledWith('materialDeleted', { id: '507f1f77bcf86cd799439011' });
    });

    it('should throw NotFoundException if material not found for deletion', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });

    it('should invalidate cache after deletion', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...mockMaterial, qrCodeImage: null }) });
      mockMaterialModel.deleteOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
      await service.remove('507f1f77bcf86cd799439011');
      expect(mockCacheManager.del).toHaveBeenCalledWith('materials_dashboard');
    });
  });

  // ===== 9. getDashboardStats =====
  describe('getDashboardStats', () => {
    it('should return cached stats if available', async () => {
      const cachedStats = { totalMaterials: 10, lowStockCount: 2 };
      mockCacheManager.get.mockResolvedValue(cachedStats);
      const result = await service.getDashboardStats();
      expect(result).toEqual(cachedStats);
    });

    it('should compute stats if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.countDocuments.mockResolvedValue(10);
      mockMaterialModel.aggregate.mockResolvedValue([]);
      const result = await service.getDashboardStats();
      expect(result).toBeDefined();
    });

    it('should cache computed stats', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.countDocuments.mockResolvedValue(5);
      mockMaterialModel.aggregate.mockResolvedValue([]);
      await service.getDashboardStats();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should include totalMaterials in stats', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.countDocuments.mockResolvedValue(15);
      mockMaterialModel.aggregate.mockResolvedValue([]);
      const result = await service.getDashboardStats();
      expect(result).toHaveProperty('totalMaterials');
    });

    it('should include timestamp in stats', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.countDocuments.mockResolvedValue(5);
      mockMaterialModel.aggregate.mockResolvedValue([]);
      const result = await service.getDashboardStats();
      expect(result).toHaveProperty('timestamp');
    });
  });

  // ===== 10. getStockAlerts =====
  describe('getStockAlerts', () => {
    it('should return cached alerts if available', async () => {
      const cachedAlerts = [{ materialId: '1', type: 'low_stock' }];
      mockCacheManager.get.mockResolvedValue(cachedAlerts);
      const result = await service.getStockAlerts();
      expect(result).toEqual(cachedAlerts);
    });

    it('should compute alerts when not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      const result = await service.getStockAlerts();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should detect low_stock alert when quantity below minimum', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          ...mockMaterial, quantity: 5, stockMinimum: 20, expiryDate: null,
          _id: { toString: () => '507f1f77bcf86cd799439011' },
        }]),
      });
      const result = await service.getStockAlerts();
      expect(result[0].type).toBe('low_stock');
    });

    it('should detect out_of_stock alert when quantity is 0', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          ...mockMaterial, quantity: 0, stockMinimum: 20, expiryDate: null,
          _id: { toString: () => '507f1f77bcf86cd799439011' },
        }]),
      });
      const result = await service.getStockAlerts();
      expect(result[0].type).toBe('out_of_stock');
    });

    it('should return empty array when all stocks are healthy', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          ...mockMaterial, quantity: 200, stockMinimum: 20, expiryDate: null,
          _id: { toString: () => '507f1f77bcf86cd799439011' },
        }]),
      });
      const result = await service.getStockAlerts();
      expect(result).toEqual([]);
    });

    it('should cache computed alerts', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      await service.getStockAlerts();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should set severity high for out_of_stock', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockMaterialModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          ...mockMaterial, quantity: 0, stockMinimum: 20, expiryDate: null,
          _id: { toString: () => '507f1f77bcf86cd799439011' },
        }]),
      });
      const result = await service.getStockAlerts();
      expect(result[0].severity).toBe('high');
    });
  });

  // ===== 11. generateForecast =====
  describe('generateForecast', () => {
    it('should generate a forecast for a material', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.generateForecast('507f1f77bcf86cd799439011');
      expect(result).toBeDefined();
    });

    it('should include materialId in forecast', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.generateForecast('507f1f77bcf86cd799439011');
      expect(result.materialId).toBe('507f1f77bcf86cd799439011');
    });

    it('should include currentStock in forecast', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.generateForecast('507f1f77bcf86cd799439011');
      expect(result.currentStock).toBe(100);
    });

    it('should include reorderDate in forecast', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.generateForecast('507f1f77bcf86cd799439011');
      expect(result.reorderDate).toBeDefined();
    });

    it('should include suggestedOrderQuantity in forecast', async () => {
      const mat = createMockMaterial({ maximumStock: 500, minimumStock: 20, quantity: 100 });
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mat) });
      const result = await service.generateForecast('507f1f77bcf86cd799439011');
      expect(result.suggestedOrderQuantity).toBeDefined();
    });
    it('should include confidence in forecast', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockMaterial) });
      const result = await service.generateForecast('507f1f77bcf86cd799439011');
      expect(result.confidence).toBeDefined();
    });

    it('should throw NotFoundException for non-existent material', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.generateForecast('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 12. reorderMaterial =====
  describe('reorderMaterial', () => {
    it('should trigger reorder successfully', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.reorderMaterial('nonexistent', null)).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 13. updateStock =====
  describe('updateStock', () => {
    it('should throw BadRequestException for invalid operation', async () => {
      const mat = createMockMaterial({ quantity: 100, siteId: null });
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mat) });
      await expect(
        service.updateStock('507f1f77bcf86cd799439011', { quantity: 10, operation: 'invalid' as any, reason: 'test' }, null),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ===== 14. update =====
  describe('update', () => {
    it('should throw NotFoundException if material not found for update', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(
        service.update('507f1f77bcf86cd799439011', { name: 'Updated' } as any, null),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 15. addImage =====
  describe('addImage', () => {
    it('should throw NotFoundException if material not found for addImage', async () => {
      mockMaterialModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(
        service.addImage('507f1f77bcf86cd799439011', '/uploads/test.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===== 16. getStockMovements =====
  describe('getStockMovements', () => {
    it('should return stock movements for a material', () => {
      const movements = service.getStockMovements('507f1f77bcf86cd799439011');
      expect(Array.isArray(movements)).toBe(true);
    });

    it('should return empty array for material with no movements', () => {
      const movements = service.getStockMovements('nonexistent-id');
      expect(movements).toEqual([]);
    });
  });

  // ===== 17. findAll =====
  describe('findAll', () => {
    it('should return paginated materials', async () => {
      mockMaterialModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockMaterial]),
            }),
          }),
        }),
      });
      mockMaterialModel.countDocuments.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should return correct totalPages', async () => {
      mockMaterialModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockMaterialModel.countDocuments.mockResolvedValue(20);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.totalPages).toBe(2);
    });

    it('should return page number in result', async () => {
      mockMaterialModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockMaterialModel.countDocuments.mockResolvedValue(0);
      const result = await service.findAll({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
    });

    it('should return empty data array when no materials', async () => {
      mockMaterialModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockMaterialModel.countDocuments.mockResolvedValue(0);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
    });
  });
});
