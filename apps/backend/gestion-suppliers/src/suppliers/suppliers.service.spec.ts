import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SuppliersService } from './suppliers.service';
import { Supplier, SupplierStatus } from './entities/supplier.entity';
import { SupplierRating } from './entities/supplier-rating.entity';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockSupplier = (overrides = {}) => ({
  _id: new Types.ObjectId(),
  supplierCode: 'FRS-2026-001',
  name: 'Test Supplier',
  category: 'Materials',
  email: 'test@supplier.com',
  phone: '0600000000',
  address: '123 Test Street',
  siret: '12345678901234',
  contractUrl: '/uploads/documents/contract.pdf',
  insuranceDocumentUrl: '/uploads/documents/insurance.pdf',
  status: SupplierStatus.PENDING_QHSE,
  createdBy: 'user-123',
  createdByName: 'John Doe',
  estArchive: false,
  qhseValidatedBy: undefined,
  qhseValidatedAt: undefined,
  qhseNotes: '',
  toObject: function () { return { ...this }; },
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

const mockRating = (overrides = {}) => ({
  _id: new Types.ObjectId(),
  supplierId: new Types.ObjectId(),
  userId: 'user-456',
  userName: 'Jane Smith',
  userRole: 'procurement_manager',
  ratings: { Delays: 8, Communication: 7, Price: 6, Reliability: 9 },
  comment: 'Good supplier',
  createdAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

// ─── Mock Model Factory ──────────────────────────────────────────────────────

function createMockModel(docData: any) {
  const instance = {
    ...docData,
    save: jest.fn().mockResolvedValue(docData),
  };

  const MockModel: any = jest.fn().mockImplementation(() => instance);
  MockModel.find = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([docData]) }) });
  MockModel.findOne = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }), exec: jest.fn().mockResolvedValue(null) });
  MockModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(docData) });
  MockModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(docData) });
  MockModel.deleteMany = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

  return MockModel;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SuppliersService', () => {
  let service: SuppliersService;
  let supplierModel: any;
  let ratingModel: any;

  const supplier = mockSupplier();
  const rating = mockRating({ supplierId: supplier._id });

  beforeEach(async () => {
    supplierModel = createMockModel(supplier);
    ratingModel = createMockModel(rating);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: getModelToken(Supplier.name), useValue: supplierModel },
        { provide: getModelToken(SupplierRating.name), useValue: ratingModel },
        { provide: HttpService, useValue: { get: jest.fn(), post: jest.fn() } },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: any = {
      name: 'Test Supplier',
      category: 'Materials',
      email: 'test@supplier.com',
      phone: '0600000000',
      address: '123 Test Street',
      siret: '12345678901234',
      createdBy: 'user-123',
      createdByName: 'John Doe',
    };

    const contractFile = { filename: 'contract.pdf' } as Express.Multer.File;
    const insuranceFile = { filename: 'insurance.pdf' } as Express.Multer.File;

    it('should throw BadRequestException if contract file is missing', async () => {
      await expect(service.create(dto, null, insuranceFile)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insurance file is missing', async () => {
      await expect(service.create(dto, contractFile, null)).rejects.toThrow(BadRequestException);
    });

    it('should create a supplier successfully with both files', async () => {
      // Mock findOne for generateSupplierCode (no existing supplier)
      supplierModel.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });

      const savedSupplier = { ...supplier, toObject: () => ({ ...supplier }) };
      const instance = { ...savedSupplier, save: jest.fn().mockResolvedValue(savedSupplier) };
      supplierModel.mockImplementation(() => instance);

      const result = await service.create(dto, contractFile, insuranceFile);
      expect(result).toBeDefined();
      expect(instance.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate email (error code 11000)', async () => {
      supplierModel.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });

      const instance = {
        save: jest.fn().mockRejectedValue({ code: 11000 }),
      };
      supplierModel.mockImplementation(() => instance);

      await expect(service.create(dto, contractFile, insuranceFile)).rejects.toThrow(ConflictException);
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return an array of suppliers with ratings', async () => {
      ratingModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('averageRating');
      expect(result[0]).toHaveProperty('ratingCount');
    });
  });

  // ── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a supplier with rating stats', async () => {
      ratingModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const result = await service.findById(supplier._id.toString());
      expect(result).toBeDefined();
      expect(result).toHaveProperty('averageRating');
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findPendingQhse ────────────────────────────────────────────────────────

  describe('findPendingQhse', () => {
    it('should return suppliers with PENDING_QHSE status', async () => {
      supplierModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([supplier]) }),
      });

      const result = await service.findPendingQhse();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── approveByQhse ──────────────────────────────────────────────────────────

  describe('approveByQhse', () => {
    it('should approve a supplier and set status to APPROVED', async () => {
      const pendingSupplier = {
        ...supplier,
        status: SupplierStatus.PENDING_QHSE,
        save: jest.fn().mockResolvedValue({ ...supplier, status: SupplierStatus.APPROVED }),
      };
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(pendingSupplier) });

      const result = await service.approveByQhse(supplier._id.toString(), 'qhse-user-1', 'Looks good');
      expect(pendingSupplier.status).toBe(SupplierStatus.APPROVED);
      expect(pendingSupplier.qhseValidatedBy).toBe('qhse-user-1');
      expect(pendingSupplier.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.approveByQhse('bad-id', 'qhse-user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── rejectByQhse ───────────────────────────────────────────────────────────

  describe('rejectByQhse', () => {
    it('should reject a supplier and set status to REJECTED', async () => {
      const pendingSupplier = {
        ...supplier,
        status: SupplierStatus.PENDING_QHSE,
        save: jest.fn().mockResolvedValue({ ...supplier, status: SupplierStatus.REJECTED }),
      };
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(pendingSupplier) });

      await service.rejectByQhse(supplier._id.toString(), 'qhse-user-1', 'Missing documents');
      expect(pendingSupplier.status).toBe(SupplierStatus.REJECTED);
      expect(pendingSupplier.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.rejectByQhse('bad-id', 'qhse-user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a supplier by id', async () => {
      await service.remove(supplier._id.toString());
      expect(supplierModel.findByIdAndDelete).toHaveBeenCalledWith(supplier._id.toString());
    });
  });

  // ── archive / unarchive ────────────────────────────────────────────────────

  describe('archive', () => {
    it('should set estArchive to true', async () => {
      const s = { ...supplier, estArchive: false, save: jest.fn().mockResolvedValue({ ...supplier, estArchive: true }) };
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(s) });

      await service.archive(supplier._id.toString());
      expect(s.estArchive).toBe(true);
      expect(s.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.archive('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unarchive', () => {
    it('should set estArchive to false', async () => {
      const s = { ...supplier, estArchive: true, save: jest.fn().mockResolvedValue({ ...supplier, estArchive: false }) };
      supplierModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(s) });

      await service.unarchive(supplier._id.toString());
      expect(s.estArchive).toBe(false);
      expect(s.save).toHaveBeenCalled();
    });
  });

  // ── getRatingCriteriaByRole ────────────────────────────────────────────────

  describe('getRatingCriteriaByRole', () => {
    it('should return correct criteria for procurement_manager', () => {
      const criteria = service.getRatingCriteriaByRole('procurement_manager');
      expect(criteria).toEqual(['Delays', 'Communication', 'Price', 'Reliability']);
    });

    it('should return correct criteria for site_manager', () => {
      const criteria = service.getRatingCriteriaByRole('site_manager');
      expect(criteria).toEqual(['Material Quality']);
    });

    it('should return empty array for unknown role', () => {
      const criteria = service.getRatingCriteriaByRole('unknown_role');
      expect(criteria).toEqual([]);
    });
  });

  // ── addRating ──────────────────────────────────────────────────────────────

  describe('addRating', () => {
    it('should throw BadRequestException if user already rated today', async () => {
      ratingModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(rating) });

      await expect(
        service.addRating(supplier._id.toString(), 'user-456', 'Jane', 'procurement_manager', { Delays: 8 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid criterion', async () => {
      ratingModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.addRating(supplier._id.toString(), 'user-456', 'Jane', 'procurement_manager', { InvalidCriterion: 8 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rating value is out of range', async () => {
      ratingModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.addRating(supplier._id.toString(), 'user-456', 'Jane', 'procurement_manager', { Delays: 15 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save a valid rating', async () => {
      ratingModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const savedRating = { ...rating };
      const ratingInstance = { save: jest.fn().mockResolvedValue(savedRating) };
      ratingModel.mockImplementation(() => ratingInstance);

      const result = await service.addRating(
        supplier._id.toString(),
        'user-456',
        'Jane',
        'procurement_manager',
        { Delays: 8, Communication: 7, Price: 6, Reliability: 9 },
        'Great supplier',
      );
      expect(ratingInstance.save).toHaveBeenCalled();
    });
  });

  // ── getSupplierRatingStats ─────────────────────────────────────────────────

  describe('getSupplierRatingStats', () => {
    it('should return zero stats when no ratings exist', async () => {
      ratingModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const stats = await service.getSupplierRatingStats(supplier._id.toString());
      expect(stats.averageRating).toBe(0);
      expect(stats.ratingCount).toBe(0);
      expect(stats.criteriaAverages).toEqual({});
    });

    it('should calculate correct averages from ratings', async () => {
      const ratings = [
        { ratings: { Delays: 8, Communication: 6 } },
        { ratings: { Delays: 4, Communication: 10 } },
      ];
      ratingModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(ratings) });

      const stats = await service.getSupplierRatingStats(supplier._id.toString());
      expect(stats.ratingCount).toBe(2);
      expect(stats.criteriaAverages['Delays']).toBe(6);
      expect(stats.criteriaAverages['Communication']).toBe(8);
    });
  });
});
