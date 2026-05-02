import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CatalogService } from './catalog.service';
import { CatalogItem } from './entities/catalog-item.entity';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(async () => {
    const mockCatalogModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getModelToken(CatalogItem.name), useValue: mockCatalogModel },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have create method', () => {
    expect(typeof service.create).toBe('function');
  });

  it('should have findAll method', () => {
    expect(typeof service.findAll).toBe('function');
  });

  it('should have findOne method', () => {
    expect(typeof service.findOne).toBe('function');
  });

  it('should have update method', () => {
    expect(typeof service.update).toBe('function');
  });

  it('should have remove method', () => {
    expect(typeof service.remove).toBe('function');
  });
});
