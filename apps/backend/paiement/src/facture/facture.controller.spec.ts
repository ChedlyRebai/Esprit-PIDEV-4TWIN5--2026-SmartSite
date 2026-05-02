import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { FactureController } from './facture.controller';
import { FactureService } from './facture.service';
import { PaiementService } from '../paiement.service';

describe('FactureController', () => {
  let controller: FactureController;
  let factureService: FactureService;
  let paiementService: PaiementService;

  const mockFactureService = {
    createFromPayment: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    generatePdfContent: jest.fn(),
    exportFacturesCsv: jest.fn(),
  };

  const mockPaiementService = {
    getPaymentStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactureController],
      providers: [
        {
          provide: FactureService,
          useValue: mockFactureService,
        },
        {
          provide: PaiementService,
          useValue: mockPaiementService,
        },
      ],
    }).compile();

    controller = module.get<FactureController>(FactureController);
    factureService = module.get<FactureService>(FactureService);
    paiementService = module.get<PaiementService>(PaiementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createFromPayment', () => {
    it('should create a facture from payment', async () => {
      const mockFacture = {
        _id: 'facture123',
        numeroFacture: 'FAC-2024-001',
        paymentId: 'payment123',
        siteNom: 'Site A',
      };

      mockFactureService.createFromPayment.mockResolvedValue(mockFacture);

      const result = await controller.createFromPayment('payment123', {
        siteNom: 'Site A',
      });

      expect(factureService.createFromPayment).toHaveBeenCalledWith(
        'payment123',
        'Site A',
      );
      expect(result).toEqual(mockFacture);
    });
  });

  describe('findAll', () => {
    it('should return all factures with filter', async () => {
      const mockFactures = [
        { _id: '1', numeroFacture: 'FAC-001' },
        { _id: '2', numeroFacture: 'FAC-002' },
      ];

      mockFactureService.findAll.mockResolvedValue(mockFactures);

      const filter = { siteNom: 'Site A' };
      const result = await controller.findAll(filter);

      expect(factureService.findAll).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockFactures);
    });

    it('should return all factures without filter', async () => {
      const mockFactures = [
        { _id: '1', numeroFacture: 'FAC-001' },
        { _id: '2', numeroFacture: 'FAC-002' },
        { _id: '3', numeroFacture: 'FAC-003' },
      ];

      mockFactureService.findAll.mockResolvedValue(mockFactures);

      const result = await controller.findAll({});

      expect(factureService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockFactures);
    });
  });

  describe('findOne', () => {
    it('should return a single facture by id', async () => {
      const mockFacture = {
        _id: 'facture123',
        numeroFacture: 'FAC-2024-001',
      };

      mockFactureService.findOne.mockResolvedValue(mockFacture);

      const result = await controller.findOne('facture123');

      expect(factureService.findOne).toHaveBeenCalledWith('facture123');
      expect(result).toEqual(mockFacture);
    });
  });

  describe('getPdf', () => {
    it('should generate PDF with site info when budget is provided', async () => {
      const mockFacture = {
        _id: 'facture123',
        numeroFacture: 'FAC-2024-001',
        siteId: 'site123',
      };

      const mockPaymentStatus = {
        totalPaid: 5000,
        remaining: 5000,
      };

      const mockHtml = '<html>Facture PDF</html>';

      mockFactureService.findOne.mockResolvedValue(mockFacture);
      mockPaiementService.getPaymentStatus.mockResolvedValue(mockPaymentStatus);
      mockFactureService.generatePdfContent.mockResolvedValue(mockHtml);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getPdf('facture123', '10000', mockResponse);

      expect(factureService.findOne).toHaveBeenCalledWith('facture123');
      expect(paiementService.getPaymentStatus).toHaveBeenCalledWith(
        'site123',
        10000,
      );
      expect(factureService.generatePdfContent).toHaveBeenCalledWith(
        mockFacture,
        {
          budget: 10000,
          totalPaid: 5000,
          remaining: 5000,
        },
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="facture-FAC-2024-001.html"',
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockHtml);
    });

    it('should generate PDF without site info when budget is not provided', async () => {
      const mockFacture = {
        _id: 'facture456',
        numeroFacture: 'FAC-2024-002',
        siteId: 'site456',
      };

      const mockHtml = '<html>Facture PDF without budget</html>';

      mockFactureService.findOne.mockResolvedValue(mockFacture);
      mockFactureService.generatePdfContent.mockResolvedValue(mockHtml);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getPdf('facture456', '', mockResponse);

      expect(factureService.findOne).toHaveBeenCalledWith('facture456');
      expect(paiementService.getPaymentStatus).not.toHaveBeenCalled();
      expect(factureService.generatePdfContent).toHaveBeenCalledWith(
        mockFacture,
        undefined,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(mockHtml);
    });

    it('should generate PDF without site info when budget is invalid', async () => {
      const mockFacture = {
        _id: 'facture789',
        numeroFacture: 'FAC-2024-003',
        siteId: 'site789',
      };

      const mockHtml = '<html>Facture PDF</html>';

      mockFactureService.findOne.mockResolvedValue(mockFacture);
      mockFactureService.generatePdfContent.mockResolvedValue(mockHtml);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getPdf('facture789', 'invalid', mockResponse);

      expect(paiementService.getPaymentStatus).not.toHaveBeenCalled();
      expect(factureService.generatePdfContent).toHaveBeenCalledWith(
        mockFacture,
        undefined,
      );
    });
  });

  describe('exportCsv', () => {
    it('should export factures as CSV', async () => {
      const mockCsv = 'Numero,Date,Montant\nFAC-001,2024-01-01,1000';

      mockFactureService.exportFacturesCsv.mockResolvedValue(mockCsv);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const filter = { siteNom: 'Site A' };
      await controller.exportCsv(filter, mockResponse);

      expect(factureService.exportFacturesCsv).toHaveBeenCalledWith(filter);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/csv',
        'Content-Disposition': expect.stringContaining('attachment; filename="factures-'),
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockCsv);
    });

    it('should export all factures when no filter provided', async () => {
      const mockCsv = 'Numero,Date,Montant\nFAC-001,2024-01-01,1000\nFAC-002,2024-01-02,2000';

      mockFactureService.exportFacturesCsv.mockResolvedValue(mockCsv);

      const mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportCsv({}, mockResponse);

      expect(factureService.exportFacturesCsv).toHaveBeenCalledWith({});
      expect(mockResponse.send).toHaveBeenCalledWith(mockCsv);
    });
  });
});
