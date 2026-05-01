import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaiementService } from './paiement.service';
import { Payment } from './entities/payment.entity';

describe('PaiementService', () => {
  let service: PaiementService;
  let mockPaymentModel: any;

  beforeEach(async () => {
    mockPaymentModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      exec: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of payments', async () => {
      const mockPayments = [
        { _id: '1', montant: 100, status: 'completed' },
        { _id: '2', montant: 200, status: 'pending' },
      ];

      mockPaymentModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayments),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockPayments);
      expect(mockPaymentModel.find).toHaveBeenCalled();
    });

    it('should handle errors when finding payments', async () => {
      mockPaymentModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single payment', async () => {
      const mockPayment = { _id: '1', montant: 100, status: 'completed' };

      mockPaymentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await service.findOne('1');
      expect(result).toEqual(mockPayment);
      expect(mockPaymentModel.findById).toHaveBeenCalledWith('1');
    });

    it('should return null if payment not found', async () => {
      mockPaymentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createDto = { montant: 100, projectId: 'proj1', status: 'pending' };
      const mockCreatedPayment = { _id: '1', ...createDto };

      mockPaymentModel.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.create(createDto as any);
      expect(result).toEqual(mockCreatedPayment);
      expect(mockPaymentModel.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle validation errors', async () => {
      const invalidDto = { montant: -100 };

      mockPaymentModel.create.mockRejectedValue(new Error('Validation error'));

      await expect(service.create(invalidDto as any)).rejects.toThrow('Validation error');
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updateDto = { status: 'completed' };
      const mockUpdatedPayment = { _id: '1', montant: 100, status: 'completed' };

      mockPaymentModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedPayment),
      });

      const result = await service.update('1', updateDto as any);
      expect(result).toEqual(mockUpdatedPayment);
      expect(mockPaymentModel.findByIdAndUpdate).toHaveBeenCalledWith('1', updateDto, { new: true });
    });
  });

  describe('remove', () => {
    it('should delete a payment', async () => {
      const mockDeletedPayment = { _id: '1', montant: 100, status: 'completed' };

      mockPaymentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeletedPayment),
      });

      const result = await service.remove('1');
      expect(result).toEqual(mockDeletedPayment);
      expect(mockPaymentModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    });

    it('should return null if payment to delete not found', async () => {
      mockPaymentModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.remove('nonexistent');
      expect(result).toBeNull();
    });
  });
});
