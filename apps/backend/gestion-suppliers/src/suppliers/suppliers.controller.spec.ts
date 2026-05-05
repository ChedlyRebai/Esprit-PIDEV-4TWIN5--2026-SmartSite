import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { MLService } from '../ml/ml.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let suppliersService: jest.Mocked<SuppliersService>;
  let mlService: jest.Mocked<MLService>;

  const mockSupplier = {
    _id: 'supplier-123',
    supplierCode: 'FRS-2026-001',
    name: 'Test Supplier',
    category: 'Materials',
    email: 'test@supplier.com',
    phone: '0600000000',
    address: '123 Test Street',
    siret: '12345678901234',
    contractUrl: '/uploads/documents/contract.pdf',
    insuranceDocumentUrl: '/uploads/documents/insurance.pdf',
    status: 'PENDING_QHSE',
    createdBy: 'user-123',
    createdByName: 'John Doe',
    estArchive: false,
    averageRating: 8.5,
    ratingCount: 10,
  };

  const mockFile = {
    fieldname: 'contract',
    originalname: 'contract.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    filename: 'contract-123.pdf',
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockSuppliersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findPendingQhse: jest.fn(),
      approveByQhse: jest.fn(),
      rejectByQhse: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      unarchive: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getSupplierRatings: jest.fn(),
      getRatingCriteriaByRole: jest.fn(),
      addRating: jest.fn(),
    };

    const mockMLService = {
      predictDelay: jest.fn(),
      getSupplierStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        { provide: SuppliersService, useValue: mockSuppliersService },
        { provide: MLService, useValue: mockMLService },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    suppliersService = module.get(SuppliersService);
    mlService = module.get(MLService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST /suppliers ────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateSupplierDto = {
      name: 'Test Supplier',
      category: 'Materials',
      email: 'test@supplier.com',
      phone: '0600000000',
      address: '123 Test Street',
      siret: '12345678901234',
      createdBy: 'user-123',
      createdByName: 'John Doe',
    };

    it('should create a supplier with files', async () => {
      const files = {
        contract: [mockFile],
        insuranceDocument: [mockFile],
      };

      suppliersService.create.mockResolvedValue(mockSupplier as any);

      const result = await controller.create(dto, files);

      expect(suppliersService.create).toHaveBeenCalledWith(
        dto,
        mockFile,
        mockFile,
      );
      expect(result).toEqual(mockSupplier);
    });

    it('should handle missing files', async () => {
      const files = {};

      suppliersService.create.mockResolvedValue(mockSupplier as any);

      await controller.create(dto, files);

      expect(suppliersService.create).toHaveBeenCalledWith(
        dto,
        undefined,
        undefined,
      );
    });
  });

  // ── GET /suppliers ─────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return an array of suppliers', async () => {
      const suppliers = [mockSupplier, { ...mockSupplier, _id: 'supplier-456' }];
      suppliersService.findAll.mockResolvedValue(suppliers as any);

      const result = await controller.findAll();

      expect(suppliersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(suppliers);
    });
  });

  // ── GET /suppliers/pending-qhse ────────────────────────────────────────────

  describe('findPendingQhse', () => {
    it('should return pending QHSE suppliers', async () => {
      const pendingSuppliers = [mockSupplier];
      suppliersService.findPendingQhse.mockResolvedValue(pendingSuppliers as any);

      const result = await controller.findPendingQhse();

      expect(suppliersService.findPendingQhse).toHaveBeenCalled();
      expect(result).toEqual(pendingSuppliers);
    });
  });

  // ── GET /suppliers/:id ─────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a single supplier', async () => {
      suppliersService.findById.mockResolvedValue(mockSupplier as any);

      const result = await controller.findOne('supplier-123');

      expect(suppliersService.findById).toHaveBeenCalledWith('supplier-123');
      expect(result).toEqual(mockSupplier);
    });
  });

  // ── GET /suppliers/:id/delay-prediction ────────────────────────────────────

  describe('getDelayPrediction', () => {
    const mockPrediction = {
      risk_percentage: 35,
      risk_level: 'Modéré',
      risk_color: '#f97316',
      recommendation: 'Surveiller ce fournisseur',
      will_be_late: false,
    };

    it('should return delay prediction with default values', async () => {
      suppliersService.findById.mockResolvedValue(mockSupplier as any);
      mlService.predictDelay.mockResolvedValue(mockPrediction);

      const result = await controller.getDelayPrediction('supplier-123');

      expect(suppliersService.findById).toHaveBeenCalledWith('supplier-123');
      expect(mlService.predictDelay).toHaveBeenCalledWith({
        supplierId: 'supplier-123',
        amount: 10000,
        days: 5,
        month: expect.any(Number),
        supplierRating: 8.5,
      });
      expect(result).toMatchObject({
        supplierId: 'supplier-123',
        supplierName: 'Test Supplier',
        averageRating: 8.5,
        ...mockPrediction,
      });
    });

    it('should return delay prediction with custom query params', async () => {
      suppliersService.findById.mockResolvedValue(mockSupplier as any);
      mlService.predictDelay.mockResolvedValue(mockPrediction);

      const result = await controller.getDelayPrediction(
        'supplier-123',
        '15000',
        '10',
        '6',
      );

      expect(mlService.predictDelay).toHaveBeenCalledWith({
        supplierId: 'supplier-123',
        amount: 15000,
        days: 10,
        month: 6,
        supplierRating: 8.5,
      });
      expect(result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      suppliersService.findById.mockRejectedValue(new Error('Supplier not found'));

      const result = await controller.getDelayPrediction('bad-id');

      expect(result).toMatchObject({
        supplierId: 'bad-id',
        error: 'Unable to generate prediction',
        risk_percentage: 0,
        risk_level: 'Inconnu',
      });
    });
  });

  // ── PUT /suppliers/:id/approve ─────────────────────────────────────────────

  describe('approve', () => {
    it('should approve a supplier', async () => {
      const approvedSupplier = { ...mockSupplier, status: 'APPROVED' };
      suppliersService.approveByQhse.mockResolvedValue(approvedSupplier as any);

      const result = await controller.approve('supplier-123', {
        qhseUserId: 'qhse-user-1',
        notes: 'All documents verified',
      });

      expect(suppliersService.approveByQhse).toHaveBeenCalledWith(
        'supplier-123',
        'qhse-user-1',
        'All documents verified',
      );
      expect(result.status).toBe('APPROVED');
    });
  });

  // ── PUT /suppliers/:id/reject ──────────────────────────────────────────────

  describe('reject', () => {
    it('should reject a supplier', async () => {
      const rejectedSupplier = { ...mockSupplier, status: 'REJECTED' };
      suppliersService.rejectByQhse.mockResolvedValue(rejectedSupplier as any);

      const result = await controller.reject('supplier-123', {
        qhseUserId: 'qhse-user-1',
        notes: 'Missing insurance document',
      });

      expect(suppliersService.rejectByQhse).toHaveBeenCalledWith(
        'supplier-123',
        'qhse-user-1',
        'Missing insurance document',
      );
      expect(result.status).toBe('REJECTED');
    });
  });

  // ── PUT /suppliers/:id ─────────────────────────────────────────────────────

  describe('update', () => {
    const dto: UpdateSupplierDto = {
      name: 'Updated Supplier',
      phone: '0611111111',
    };

    it('should update a supplier', async () => {
      const updatedSupplier = { ...mockSupplier, ...dto };
      suppliersService.update.mockResolvedValue(updatedSupplier as any);

      const result = await controller.update('supplier-123', dto, {});

      expect(suppliersService.update).toHaveBeenCalledWith(
        'supplier-123',
        dto,
        undefined,
        undefined,
      );
      expect(result.name).toBe('Updated Supplier');
    });

    it('should update a supplier with new files', async () => {
      const files = {
        contract: [mockFile],
        insuranceDocument: [mockFile],
      };
      suppliersService.update.mockResolvedValue(mockSupplier as any);

      await controller.update('supplier-123', dto, files);

      expect(suppliersService.update).toHaveBeenCalledWith(
        'supplier-123',
        dto,
        mockFile,
        mockFile,
      );
    });
  });

  // ── PUT /suppliers/:id/archive ─────────────────────────────────────────────

  describe('archive', () => {
    it('should archive a supplier', async () => {
      const archivedSupplier = { ...mockSupplier, estArchive: true };
      suppliersService.archive.mockResolvedValue(archivedSupplier as any);

      const result = await controller.archive('supplier-123');

      expect(suppliersService.archive).toHaveBeenCalledWith('supplier-123');
      expect(result.estArchive).toBe(true);
    });
  });

  // ── PUT /suppliers/:id/unarchive ───────────────────────────────────────────

  describe('unarchive', () => {
    it('should unarchive a supplier', async () => {
      const unarchivedSupplier = { ...mockSupplier, estArchive: false };
      suppliersService.unarchive.mockResolvedValue(unarchivedSupplier as any);

      const result = await controller.unarchive('supplier-123');

      expect(suppliersService.unarchive).toHaveBeenCalledWith('supplier-123');
      expect(result.estArchive).toBe(false);
    });
  });

  // ── DELETE /suppliers/:id ──────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a supplier', async () => {
      suppliersService.remove.mockResolvedValue(undefined);

      await controller.remove('supplier-123');

      expect(suppliersService.remove).toHaveBeenCalledWith('supplier-123');
    });
  });

  // ── DELETE /suppliers ──────────────────────────────────────────────────────

  describe('clear', () => {
    it('should clear all suppliers', async () => {
      suppliersService.clear.mockResolvedValue(undefined);

      await controller.clear();

      expect(suppliersService.clear).toHaveBeenCalled();
    });
  });

  // ── GET /suppliers/:id/ratings ─────────────────────────────────────────────

  describe('getRatings', () => {
    it('should return supplier ratings', async () => {
      const ratings = [
        { userId: 'user-1', ratings: { Delays: 8 }, comment: 'Good' },
      ];
      suppliersService.getSupplierRatings.mockResolvedValue(ratings as any);

      const result = await controller.getRatings('supplier-123');

      expect(suppliersService.getSupplierRatings).toHaveBeenCalledWith('supplier-123');
      expect(result).toEqual(ratings);
    });
  });

  // ── GET /suppliers/:id/rating-criteria ─────────────────────────────────────

  describe('getRatingCriteria', () => {
    it('should return rating criteria for a role', async () => {
      suppliersService.getRatingCriteriaByRole.mockReturnValue([
        'Delays',
        'Communication',
        'Price',
        'Reliability',
      ]);

      const result = await controller.getRatingCriteria('supplier-123', {
        userRole: 'procurement_manager',
      });

      expect(suppliersService.getRatingCriteriaByRole).toHaveBeenCalledWith(
        'procurement_manager',
      );
      expect(result.criteria).toHaveLength(4);
    });
  });

  // ── POST /suppliers/:id/ratings ────────────────────────────────────────────

  describe('addRating', () => {
    it('should add a rating to a supplier', async () => {
      const ratingData = {
        userId: 'user-456',
        userName: 'Jane Smith',
        userRole: 'procurement_manager',
        ratings: { Delays: 8, Communication: 7 },
        comment: 'Great supplier',
      };

      const savedRating = { _id: 'rating-123', ...ratingData };
      suppliersService.addRating.mockResolvedValue(savedRating as any);

      const result = await controller.addRating('supplier-123', ratingData);

      expect(suppliersService.addRating).toHaveBeenCalledWith(
        'supplier-123',
        'user-456',
        'Jane Smith',
        'procurement_manager',
        { Delays: 8, Communication: 7 },
        'Great supplier',
      );
      expect(result).toEqual(savedRating);
    });
  });
});
