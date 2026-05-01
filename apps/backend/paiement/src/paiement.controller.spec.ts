import { Test, TestingModule } from '@nestjs/testing';
import { PaiementController } from './paiement.controller';
import { PaiementService } from './paiement.service';

describe('PaiementController', () => {
  let controller: PaiementController;
  let service: PaiementService;

  const mockPaiementService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaiementController],
      providers: [
        {
          provide: PaiementService,
          useValue: mockPaiementService,
        },
      ],
    }).compile();

    controller = module.get<PaiementController>(PaiementController);
    service = module.get<PaiementService>(PaiementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of payments', async () => {
      const mockPayments = [
        { _id: '1', montant: 100, status: 'completed' },
        { _id: '2', montant: 200, status: 'pending' },
      ];

      mockPaiementService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll();
      expect(result).toEqual(mockPayments);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single payment', async () => {
      const mockPayment = { _id: '1', montant: 100, status: 'completed' };

      mockPaiementService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createDto = { montant: 100, projectId: 'proj1', status: 'pending' };
      const mockCreatedPayment = { _id: '1', ...createDto };

      mockPaiementService.create.mockResolvedValue(mockCreatedPayment);

      const result = await controller.create(createDto as any);
      expect(result).toEqual(mockCreatedPayment);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updateDto = { status: 'completed' };
      const mockUpdatedPayment = { _id: '1', montant: 100, status: 'completed' };

      mockPaiementService.update.mockResolvedValue(mockUpdatedPayment);

      const result = await controller.update('1', updateDto as any);
      expect(result).toEqual(mockUpdatedPayment);
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a payment', async () => {
      const mockDeletedPayment = { _id: '1', montant: 100, status: 'completed' };

      mockPaiementService.remove.mockResolvedValue(mockDeletedPayment);

      const result = await controller.remove('1');
      expect(result).toEqual(mockDeletedPayment);
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
