import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TeamsService } from './teams.service';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Types } from 'mongoose';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockTeamId = new Types.ObjectId();

  beforeEach(async () => {
    const mockTeamModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const mockUserModel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getModelToken(Team.name), useValue: mockTeamModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
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

  it('should have findById method', () => {
    expect(typeof service.findById).toBe('function');
  });

  it('should have findByName method', () => {
    expect(typeof service.findByName).toBe('function');
  });

  it('should have update method', () => {
    expect(typeof service.update).toBe('function');
  });

  it('should have remove method', () => {
    expect(typeof service.remove).toBe('function');
  });
});
