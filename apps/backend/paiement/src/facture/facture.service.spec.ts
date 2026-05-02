import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FactureService } from './facture.service';
import { Facture } from '../entities/facture.entity';
import { Payment } from '../entities/payment.entity';

describe('FactureService', () => {
  let service: FactureService;
  let mockFactureModel: any;
  let mockPaymentModel: any;

  const validObjectId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockFactureModel = {
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      countDocuments: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      save: jest.fn(),
    };

    mockPaymentModel = {
      findById: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactureService,
        {
          provide: getModelToken(Facture.name),
          useValue: mockFactureModel,
        },
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
      ],
    }).compile();

    service = module.get<FactureService>(FactureService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated factures', async () => {
      const mockFactures = [
        { _id: validObjectId, numeroFacture: 'FAC-001', amount: 1000 },
        { _id: validObjectId, numeroFacture: 'FAC-002', amount: 2000 },
      ];

      mockFactureModel.exec.mockResolvedValue(mockFactures);
      mockFactureModel.countDocuments.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });
      
      expect(result.factures).toEqual(mockFactures);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by siteNom', async () => {
      mockFactureModel.exec.mockResolvedValue([]);
      mockFactureModel.countDocuments.mockResolvedValue(0);

      await service.findAll({ siteNom: 'Test Site', page: 1, limit: 10 });
      
      expect(mockFactureModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if facture not found', async () => {
      mockFactureModel.exec.mockResolvedValue(null);

      await expect(service.findOne(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should return a facture if found', async () => {
      const mockFacture = { _id: validObjectId, numeroFacture: 'FAC-001', amount: 1000 };
      mockFactureModel.exec.mockResolvedValue(mockFacture);

      const result = await service.findOne(validObjectId);
      expect(result).toEqual(mockFacture);
    });
  });

  describe('createFromPayment', () => {
    it('should throw BadRequestException for invalid payment ID', async () => {
      await expect(service.createFromPayment('invalid-id', 'Site Name')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentModel.exec.mockResolvedValue(null);

      await expect(service.createFromPayment(validObjectId, 'Site Name')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if facture already exists', async () => {
      const mockPayment = { _id: validObjectId, siteId: validObjectId, amount: 1000 };
      mockPaymentModel.exec.mockResolvedValue(mockPayment);
      mockFactureModel.findOne.mockResolvedValue({ _id: validObjectId });

      await expect(service.createFromPayment(validObjectId, 'Site Name')).rejects.toThrow(BadRequestException);
    });

    it('should create a facture from payment successfully', async () => {
      const mockPayment = {
        _id: validObjectId,
        siteId: new Types.ObjectId(validObjectId),
        amount: 1000,
        paymentMethod: 'card',
        paymentDate: new Date(),
        description: 'Test',
      };
      const mockFacture = { _id: validObjectId, numeroFacture: 'INV-2024-ABC' };

      mockPaymentModel.exec.mockResolvedValue(mockPayment);
      mockFactureModel.findOne.mockResolvedValue(null);
      mockFactureModel.save = jest.fn().mockResolvedValue(mockFacture);

      // Override the factureModel constructor to return an object with save
      const mockSaveInstance = jest.fn().mockResolvedValue(mockFacture);
      (service as any).factureModel = Object.assign(
        jest.fn().mockImplementation(() => ({ save: mockSaveInstance })),
        {
          find: mockFactureModel.find,
          findById: mockFactureModel.findById,
          findOne: jest.fn().mockResolvedValue(null),
          countDocuments: mockFactureModel.countDocuments,
          sort: mockFactureModel.sort,
          skip: mockFactureModel.skip,
          limit: mockFactureModel.limit,
          exec: mockFactureModel.exec,
        }
      );

      const result = await service.createFromPayment(validObjectId, 'Site Name');
      expect(result).toEqual(mockFacture);
    });
  });

  describe('generatePdfContent', () => {
    it('should generate PDF HTML content', async () => {
      const mockFacture = {
        numeroFacture: 'FAC-001',
        siteNom: 'Test Site',
        amount: 1000,
        paymentMethod: 'card',
        paymentDate: new Date(),
        description: 'Test payment',
      };

      const result = await service.generatePdfContent(mockFacture as any);
      
      expect(result).toContain('FAC-001');
      expect(result).toContain('Test Site');
      expect(result).toContain('Payment Receipt');
    });

    it('should include remaining budget info when provided', async () => {
      const mockFacture = {
        numeroFacture: 'FAC-001',
        siteNom: 'Test Site',
        amount: 1000,
        paymentMethod: 'card',
        paymentDate: new Date(),
      };

      const siteInfo = { budget: 5000, totalPaid: 3000, remaining: 2000 };

      const result = await service.generatePdfContent(mockFacture as any, siteInfo);
      
      expect(result).toContain('Total Budget');
      expect(result).toContain('Amount Paid');
      expect(result).toContain('Remaining');
    });

    it('should show fully paid when remaining is 0', async () => {
      const mockFacture = {
        numeroFacture: 'FAC-001',
        siteNom: 'Test Site',
        amount: 5000,
        paymentMethod: 'cash',
        paymentDate: new Date(),
      };

      const siteInfo = { budget: 5000, totalPaid: 5000, remaining: 0 };

      const result = await service.generatePdfContent(mockFacture as any, siteInfo);
      expect(result).toContain('Fully Paid');
    });

    it('should handle all payment methods', async () => {
      const methods = ['cash', 'card', 'transfer', 'check', 'unknown'];
      
      for (const method of methods) {
        const mockFacture = {
          numeroFacture: 'FAC-001',
          siteNom: 'Test Site',
          amount: 1000,
          paymentMethod: method,
          paymentDate: new Date(),
        };

        const result = await service.generatePdfContent(mockFacture as any);
        expect(result).toBeDefined();
        expect(result).toContain('Payment Receipt');
      }
    });

    it('should generate PDF without description', async () => {
      const mockFacture = {
        numeroFacture: 'FAC-002',
        siteNom: 'Site B',
        amount: 2000,
        paymentMethod: 'transfer',
        paymentDate: new Date(),
        description: undefined,
      };

      const result = await service.generatePdfContent(mockFacture as any);
      expect(result).toContain('FAC-002');
      expect(result).not.toContain('Description');
    });
  });

  describe('exportFacturesCsv', () => {
    it('should export factures as CSV', async () => {
      const mockFactures = [
        {
          numeroFacture: 'FAC-001',
          siteNom: 'Site A',
          amount: 1000,
          paymentMethod: 'card',
          paymentDate: new Date('2024-01-01'),
          description: 'Test',
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue({
        factures: mockFactures as any,
        total: 1,
        page: 1,
        limit: 10000,
        totalPages: 1,
      });

      const result = await service.exportFacturesCsv({});
      expect(result).toContain('numeroFacture');
      expect(result).toContain('FAC-001');
    });

    it('should export empty CSV when no factures', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue({
        factures: [],
        total: 0,
        page: 1,
        limit: 10000,
        totalPages: 0,
      });

      const result = await service.exportFacturesCsv({});
      expect(result).toContain('numeroFacture');
    });
  });

  describe('findAll with filters', () => {
    it('should filter by date range', async () => {
      mockFactureModel.exec.mockResolvedValue([]);
      mockFactureModel.countDocuments.mockResolvedValue(0);

      await service.findAll({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 10,
      });

      expect(mockFactureModel.find).toHaveBeenCalled();
    });

    it('should use default pagination', async () => {
      mockFactureModel.exec.mockResolvedValue([]);
      mockFactureModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should cap limit at 100', async () => {
      mockFactureModel.exec.mockResolvedValue([]);
      mockFactureModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll({ limit: 999 });

      expect(result.limit).toBe(100);
    });
  });
});
