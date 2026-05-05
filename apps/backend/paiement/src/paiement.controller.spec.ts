import { Test, TestingModule } from '@nestjs/testing';
import { PaiementController } from './paiement.controller';
import { PaiementService } from './paiement.service';

describe('PaiementController', () => {
  let controller: PaiementController;
  let service: PaiementService;

  const mockPaiementService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySite: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPaymentStatus: jest.fn(),
    getTotalPaymentsBySite: jest.fn(),
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
        { _id: '1', amount: 100, status: 'completed' },
        { _id: '2', amount: 200, status: 'pending' },
      ];

      mockPaiementService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll();
      expect(result).toEqual(mockPayments);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single payment', async () => {
      const mockPayment = { _id: '1', amount: 100, status: 'completed' };

      mockPaiementService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findBySite', () => {
    it('should return payments for a site', async () => {
      const mockPayments = [{ _id: '1', siteId: 'site1', amount: 100 }];

      mockPaiementService.findBySite.mockResolvedValue(mockPayments);

      const result = await controller.findBySite('site1');
      expect(result).toEqual(mockPayments);
      expect(service.findBySite).toHaveBeenCalledWith('site1');
    });
  });

  describe('getTotalPaymentsBySite', () => {
    it('should return total payments for a site', async () => {
      mockPaiementService.getTotalPaymentsBySite.mockResolvedValue(500);

      const result = await controller.getTotalPaymentsBySite('site1');
      expect(result).toBe(500);
      expect(service.getTotalPaymentsBySite).toHaveBeenCalledWith('site1');
    });
  });

  describe('checkSitePaid', () => {
    it('should return payment status for a site', async () => {
      const mockStatus = { hasPaid: true, totalPaid: 300, remaining: 200 };

      mockPaiementService.getPaymentStatus.mockResolvedValue(mockStatus);

      const result = await controller.checkSitePaid('site1', '500');
      expect(result).toEqual(mockStatus);
      expect(service.getPaymentStatus).toHaveBeenCalledWith('site1', 500);
    });
  });

  describe('remove', () => {
    it('should delete a payment', async () => {
      mockPaiementService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');
      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
