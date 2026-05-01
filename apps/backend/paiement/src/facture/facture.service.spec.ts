import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FactureService } from './facture.service';
import { Facture } from '../entities/facture.entity';

describe('FactureService', () => {
  let service: FactureService;
  let mockFactureModel: any;

  beforeEach(async () => {
    mockFactureModel = {
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
        FactureService,
        {
          provide: getModelToken(Facture.name),
          useValue: mockFactureModel,
        },
      ],
    }).compile();

    service = module.get<FactureService>(FactureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of factures', async () => {
      const mockFactures = [
        { _id: '1', numero: 'FAC-001', montant: 1000 },
        { _id: '2', numero: 'FAC-002', montant: 2000 },
      ];

      mockFactureModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFactures),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockFactures);
      expect(mockFactureModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single facture', async () => {
      const mockFacture = { _id: '1', numero: 'FAC-001', montant: 1000 };

      mockFactureModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFacture),
      });

      const result = await service.findOne('1');
      expect(result).toEqual(mockFacture);
      expect(mockFactureModel.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new facture', async () => {
      const createDto = { numero: 'FAC-001', montant: 1000, projectId: 'proj1' };
      const mockCreatedFacture = { _id: '1', ...createDto };

      mockFactureModel.create.mockResolvedValue(mockCreatedFacture);

      const result = await service.create(createDto as any);
      expect(result).toEqual(mockCreatedFacture);
      expect(mockFactureModel.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a facture', async () => {
      const updateDto = { montant: 1500 };
      const mockUpdatedFacture = { _id: '1', numero: 'FAC-001', montant: 1500 };

      mockFactureModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedFacture),
      });

      const result = await service.update('1', updateDto as any);
      expect(result).toEqual(mockUpdatedFacture);
    });
  });

  describe('remove', () => {
    it('should delete a facture', async () => {
      const mockDeletedFacture = { _id: '1', numero: 'FAC-001', montant: 1000 };

      mockFactureModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeletedFacture),
      });

      const result = await service.remove('1');
      expect(result).toEqual(mockDeletedFacture);
      expect(mockFactureModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    });
  });
});
