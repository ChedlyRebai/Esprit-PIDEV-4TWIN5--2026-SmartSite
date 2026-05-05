import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { Types } from 'mongoose';

describe('MilestoneController', () => {
  let controller: MilestoneController;
  let service: MilestoneService;

  const mockMilestoneService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllForDashboard: jest.fn(),
    getMilestonesByProjectId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestoneController],
      providers: [
        {
          provide: MilestoneService,
          useValue: mockMilestoneService,
        },
      ],
    }).compile();

    controller = module.get<MilestoneController>(MilestoneController);
    service = module.get<MilestoneService>(MilestoneService);
  });

  describe('create', () => {
    it('should create a milestone', async () => {
      const projectId = 'project-123';
      const createMilestoneDto: CreateMilestoneDto = {
        title: 'Q1 Planning',
        description: 'First quarter planning',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      };

      const createdMilestone = {
        _id: new Types.ObjectId(),
        ...createMilestoneDto,
        projectId,
      };

      mockMilestoneService.create.mockResolvedValue(createdMilestone);

      const result = await controller.create(createMilestoneDto, projectId);

      expect(service.create).toHaveBeenCalledWith(createMilestoneDto, projectId);
      expect(result).toEqual(createdMilestone);
    });

    it('should handle create without description', async () => {
      const projectId = 'project-123';
      const createMilestoneDto: CreateMilestoneDto = {
        title: 'Milestone',
        startDate: new Date(),
        endDate: new Date(),
      };

      mockMilestoneService.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...createMilestoneDto,
        projectId,
      });

      const result = await controller.create(createMilestoneDto, projectId);

      expect(service.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all milestones', async () => {
      const milestones = [
        {
          _id: new Types.ObjectId(),
          title: 'Milestone 1',
          tasks: [],
        },
        {
          _id: new Types.ObjectId(),
          title: 'Milestone 2',
          tasks: [],
        },
      ];

      mockMilestoneService.findAll.mockResolvedValue(milestones);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(milestones);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no milestones exist', async () => {
      mockMilestoneService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const milestone = {
        _id: milestoneId,
        title: 'Single Milestone',
        tasks: [],
      };

      mockMilestoneService.findOne.mockResolvedValue(milestone);

      const result = await controller.findOne(milestoneId);

      expect(service.findOne).toHaveBeenCalledWith(milestoneId);
      expect(result).toEqual(milestone);
    });

    it('should return null when milestone not found', async () => {
      mockMilestoneService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getMilesSToneByProjectId', () => {
    it('should return milestones for a project', async () => {
      const projectId = 'project-123';
      const milestones = [
        {
          _id: new Types.ObjectId(),
          title: 'Project Milestone',
          projectId,
          tasks: [],
        },
      ];

      mockMilestoneService.getMilestonesByProjectId.mockResolvedValue(
        milestones,
      );

      const result = await controller.getMilesSToneByProjectId(projectId);

      expect(service.getMilestonesByProjectId).toHaveBeenCalledWith(
        projectId,
      );
      expect(result).toEqual(milestones);
    });

    it('should return empty array for project with no milestones', async () => {
      mockMilestoneService.getMilestonesByProjectId.mockResolvedValue([]);

      const result = await controller.getMilesSToneByProjectId(
        'project-without-milestones',
      );

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const updateMilestoneDto: UpdateMilestoneDto = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updatedMilestone = {
        _id: milestoneId,
        ...updateMilestoneDto,
        tasks: [],
      };

      mockMilestoneService.update.mockResolvedValue(updatedMilestone);

      const result = await controller.update(milestoneId, updateMilestoneDto);

      expect(service.update).toHaveBeenCalledWith(milestoneId, updateMilestoneDto);
      expect(result).toEqual(updatedMilestone);
    });

    it('should handle partial update', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const updateMilestoneDto: UpdateMilestoneDto = {
        title: 'Only Title Updated',
      };

      mockMilestoneService.update.mockResolvedValue({
        _id: milestoneId,
        ...updateMilestoneDto,
      });

      const result = await controller.update(milestoneId, updateMilestoneDto);

      expect(service.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should delete a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const deletedMilestone = {
        _id: milestoneId,
        title: 'Deleted Milestone',
      };

      mockMilestoneService.remove.mockResolvedValue(deletedMilestone);

      const result = await controller.remove(milestoneId);

      expect(service.remove).toHaveBeenCalledWith(milestoneId);
      expect(result).toEqual(deletedMilestone);
    });

    it('should throw error when milestone not found', async () => {
      mockMilestoneService.remove.mockRejectedValue(
        new Error('Milestone with id invalid-id not found'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        'Milestone with id invalid-id not found',
      );
    });
  });

  describe('controller definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
