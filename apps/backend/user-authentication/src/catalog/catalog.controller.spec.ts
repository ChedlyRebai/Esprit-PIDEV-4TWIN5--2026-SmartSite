import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Types } from 'mongoose';

describe('CatalogController', () => {
  let controller: CatalogController;
  let mockCatalogService: any;

  const mockItemId = new Types.ObjectId();

  beforeEach(async () => {
    mockCatalogService = {
      create: jest.fn().mockResolvedValue({ _id: mockItemId, code: 'ITEM001' }),
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      findOne: jest.fn().mockResolvedValue({ _id: mockItemId, code: 'ITEM001' }),
      update: jest.fn().mockResolvedValue({ _id: mockItemId, code: 'ITEM001' }),
      remove: jest.fn().mockResolvedValue({ _id: mockItemId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /catalog', () => {
    it('should create a catalog item', async () => {
      const createDto = { code: 'ITEM001', name: 'Item 1', category: 'Materials' };

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(mockCatalogService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /catalog', () => {
    it('should return paginated catalog items', async () => {
      const query = { page: '1', limit: '10' };

      const result = await controller.findAll(query);

      expect(result).toBeDefined();
      expect(mockCatalogService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /catalog/:id', () => {
    it('should return a catalog item', async () => {
      const result = await controller.findOne(mockItemId.toString());

      expect(result).toBeDefined();
      expect(mockCatalogService.findOne).toHaveBeenCalledWith(mockItemId.toString());
    });
  });

  describe('PATCH /catalog/:id', () => {
    it('should update a catalog item', async () => {
      const updateDto = { name: 'Updated Item' };

      const result = await controller.update(mockItemId.toString(), updateDto);

      expect(result).toBeDefined();
      expect(mockCatalogService.update).toHaveBeenCalledWith(mockItemId.toString(), updateDto);
    });
  });

  describe('DELETE /catalog/:id', () => {
    it('should delete a catalog item', async () => {
      const result = await controller.remove(mockItemId.toString());

      expect(result).toBeDefined();
      expect(mockCatalogService.remove).toHaveBeenCalledWith(mockItemId.toString());
    });
  });
});
