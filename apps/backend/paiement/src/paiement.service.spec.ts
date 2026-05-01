import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaiementService } from './paiement.service';
import { Payment } from './entities/payment.entity';

describe('PaiementService', () => {
  let service: PaiementService;
  let mockPaymentModel: any;

  const validObjectId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockPaymentModel = {
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn(),
      aggregate: jest.fn(),
      countDocuments: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaiementService,
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
      ],
    }).compile();

    service = module.get<PaiementService>(PaiementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of payments', async () => {
      const mockPayments = [
        { _id: validObjectId, amount: 100, status: 'completed' },
        { _id: validObjectId, amount: 200, status: 'pending' },
      ];

      mockPaymentModel.exec.mockResolvedValue(mockPayments);

      const result = await service.findAll();
      expect(result).toEqual(mockPayments);
      expect(mockPaymentModel.find).toHaveBeenCalled();
      expect(mockPaymentModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentModel.exec.mockResolvedValue(null);

      await expect(service.findOne(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should return a payment if found', async () => {
      const mockPayment = { _id: validObjectId, amount: 100, status: 'completed' };
      mockPaymentModel.exec.mockResolvedValue(mockPayment);

      const result = await service.findOne(validObjectId);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findBySite', () => {
    it('should throw BadRequestException for invalid siteId', async () => {
      await expect(service.findBySite('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should return payments for a site', async () => {
      const mockPayments = [{ _id: validObjectId, siteId: validObjectId, amount: 100 }];
      mockPaymentModel.exec.mockResolvedValue(mockPayments);

      const result = await service.findBySite(validObjectId);
      expect(result).toEqual(mockPayments);
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.remove('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(validObjectId)).rejects.toThrow(NotFoundException);
    });

    it('should delete a payment successfully', async () => {
      mockPaymentModel.findByIdAndDelete.mockResolvedValue({ _id: validObjectId });

      await service.remove(validObjectId);
      expect(mockPaymentModel.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
    });
  });

  describe('getPaymentStatus', () => {
    it('should throw BadRequestException for invalid siteId', async () => {
      await expect(service.getPaymentStatus('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should return payment status for a site', async () => {
      const mockPayments = [
        { amount: 100, status: 'completed' },
        { amount: 200, status: 'completed' },
      ];
      
      // Mock the find method to return a promise that resolves to the array
      mockPaymentModel.find = jest.fn().mockResolvedValue(mockPayments);

      const result = await service.getPaymentStatus(validObjectId, 500);
      expect(result).toEqual({
        hasPaid: true,
        totalPaid: 300,
        remaining: 200,
      });
    });
  });

  describe('getTotalPaymentsBySite', () => {
    it('should throw BadRequestException for invalid siteId', async () => {
      await expect(service.getTotalPaymentsBySite('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should return total payments for a site', async () => {
      mockPaymentModel.aggregate.mockResolvedValue([{ total: 500 }]);

      const result = await service.getTotalPaymentsBySite(validObjectId);
      expect(result).toBe(500);
    });

    it('should return 0 if no payments found', async () => {
      mockPaymentModel.aggregate.mockResolvedValue([]);

      const result = await service.getTotalPaymentsBySite(validObjectId);
      expect(result).toBe(0);
    });
  });
});
