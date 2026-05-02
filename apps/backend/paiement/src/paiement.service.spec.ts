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

  const mockSave = jest.fn();

  beforeEach(async () => {
    mockPaymentModel = jest.fn().mockImplementation(() => ({
      save: mockSave,
    }));

    Object.assign(mockPaymentModel, {
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
    });

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

  describe('create', () => {
    it('should throw BadRequestException for invalid siteId', async () => {
      const dto = {
        siteId: 'invalid-id',
        amount: 100,
        paymentMethod: 'card',
      };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid paymentDate', async () => {
      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
        paymentDate: 'invalid-date',
      };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for future paymentDate', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
        paymentDate: futureDate.toISOString(),
      };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should create a payment successfully', async () => {
      const mockPayment = { _id: validObjectId, amount: 100, status: 'pending' };
      mockSave.mockResolvedValue(mockPayment);

      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
        description: 'Test payment',
      };

      const result = await service.create(dto as any);
      expect(result).toEqual(mockPayment);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create payment with custom reference', async () => {
      const mockPayment = { _id: validObjectId, amount: 100, reference: 'MY-REF' };
      mockSave.mockResolvedValue(mockPayment);

      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
        reference: 'MY-REF',
      };

      const result = await service.create(dto as any);
      expect(result).toEqual(mockPayment);
    });

    it('should convert "paid" status to "completed"', async () => {
      const mockPayment = { _id: validObjectId, amount: 100, status: 'completed' };
      mockSave.mockResolvedValue(mockPayment);

      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
        status: 'paid',
      };

      await service.create(dto as any);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create payment with userId', async () => {
      const mockPayment = { _id: validObjectId, amount: 100 };
      mockSave.mockResolvedValue(mockPayment);

      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
      };

      const result = await service.create(dto as any, validObjectId);
      expect(result).toEqual(mockPayment);
    });

    it('should create payment with invalid userId (null createdBy)', async () => {
      const mockPayment = { _id: validObjectId, amount: 100 };
      mockSave.mockResolvedValue(mockPayment);

      const dto = {
        siteId: validObjectId,
        amount: 100,
        paymentMethod: 'card',
      };

      const result = await service.create(dto as any, 'invalid-user-id');
      expect(result).toEqual(mockPayment);
    });
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

  describe('update', () => {
    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.update('invalid-id', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.update(validObjectId, {})).rejects.toThrow(NotFoundException);
    });

    it('should update a payment successfully', async () => {
      const mockPayment = { _id: validObjectId, amount: 200, status: 'completed' };
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.update(validObjectId, { amount: 200 });
      expect(result).toEqual(mockPayment);
    });

    it('should convert "paid" status to "completed" on update', async () => {
      const mockPayment = { _id: validObjectId, status: 'completed' };
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.update(validObjectId, { status: 'paid' });
      expect(result).toEqual(mockPayment);
    });

    it('should throw BadRequestException for invalid paymentDate on update', async () => {
      await expect(
        service.update(validObjectId, { paymentDate: 'invalid-date' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for future paymentDate on update', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await expect(
        service.update(validObjectId, { paymentDate: futureDate.toISOString() })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid siteId on update', async () => {
      await expect(
        service.update(validObjectId, { siteId: 'invalid-site-id' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should update with valid siteId', async () => {
      const mockPayment = { _id: validObjectId, siteId: validObjectId };
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.update(validObjectId, { siteId: validObjectId });
      expect(result).toEqual(mockPayment);
    });

    it('should update with userId', async () => {
      const mockPayment = { _id: validObjectId, amount: 100 };
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.update(validObjectId, { description: 'Updated' }, validObjectId);
      expect(result).toEqual(mockPayment);
    });

    it('should update reference and paymentMethod', async () => {
      const mockPayment = { _id: validObjectId, reference: 'NEW-REF', paymentMethod: 'cash' };
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.update(validObjectId, {
        reference: 'NEW-REF',
        paymentMethod: 'cash',
        description: 'Updated desc',
      });
      expect(result).toEqual(mockPayment);
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
      mockPaymentModel.find = jest.fn().mockResolvedValue(mockPayments);

      const result = await service.getPaymentStatus(validObjectId, 500);
      expect(result).toEqual({
        hasPaid: true,
        totalPaid: 300,
        remaining: 200,
      });
    });

    it('should return hasPaid false when no payments', async () => {
      mockPaymentModel.find = jest.fn().mockResolvedValue([]);

      const result = await service.getPaymentStatus(validObjectId, 500);
      expect(result).toEqual({
        hasPaid: false,
        totalPaid: 0,
        remaining: 500,
      });
    });

    it('should return remaining 0 when totalPaid exceeds budget', async () => {
      const mockPayments = [{ amount: 1000 }];
      mockPaymentModel.find = jest.fn().mockResolvedValue(mockPayments);

      const result = await service.getPaymentStatus(validObjectId, 500);
      expect(result.remaining).toBe(0);
    });

    it('should use default budget of 0', async () => {
      mockPaymentModel.find = jest.fn().mockResolvedValue([]);

      const result = await service.getPaymentStatus(validObjectId);
      expect(result.remaining).toBe(0);
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
