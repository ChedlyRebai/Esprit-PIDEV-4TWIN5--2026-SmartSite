import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Types } from 'mongoose';

describe('TeamsController', () => {
  let controller: TeamsController;
  let mockTeamsService: any;

  const mockTeamId = new Types.ObjectId();

  beforeEach(async () => {
    mockTeamsService = {
      create: jest.fn().mockResolvedValue({ _id: mockTeamId, name: 'Team A' }),
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ _id: mockTeamId, name: 'Team A' }),
      findByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ _id: mockTeamId, name: 'Updated' }),
      remove: jest.fn().mockResolvedValue({ _id: mockTeamId }),
      addMembers: jest.fn().mockResolvedValue({ _id: mockTeamId }),
      removeMembers: jest.fn().mockResolvedValue({ _id: mockTeamId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /teams', () => {
    it('should create a team', async () => {
      const createDto = { name: 'Team A', description: 'Description' };

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(mockTeamsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /teams', () => {
    it('should return all teams', async () => {
      const result = await controller.findAll();

      expect(result).toBeDefined();
      expect(mockTeamsService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /teams/:id', () => {
    it('should return a team by id', async () => {
      const result = await controller.findById(mockTeamId.toString());

      expect(result).toBeDefined();
      expect(mockTeamsService.findById).toHaveBeenCalledWith(mockTeamId.toString());
    });
  });

  describe('PATCH /teams/:id', () => {
    it('should update a team', async () => {
      const updateDto = { name: 'Updated Team' };

      const result = await controller.update(mockTeamId.toString(), updateDto);

      expect(result).toBeDefined();
      expect(mockTeamsService.update).toHaveBeenCalledWith(mockTeamId.toString(), updateDto);
    });
  });

  describe('DELETE /teams/:id', () => {
    it('should delete a team', async () => {
      const result = await controller.remove(mockTeamId.toString());

      expect(result).toBeDefined();
      expect(mockTeamsService.remove).toHaveBeenCalledWith(mockTeamId.toString());
    });
  });
});
