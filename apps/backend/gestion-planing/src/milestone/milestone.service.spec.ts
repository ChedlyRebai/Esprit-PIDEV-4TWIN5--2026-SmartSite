import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneService } from './milestone.service';
import { getModelToken } from '@nestjs/mongoose';
import { Milestone } from './entities/milestone.entity';
import { Task } from '../task/entities/task.entity';
import { Types } from 'mongoose';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

describe('MilestoneService', () => {
  let service: MilestoneService;
  let milestoneModel: any;
  let taskModel: any;

  beforeEach(async () => {
    milestoneModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    taskModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestoneService,
        {
          provide: getModelToken(Milestone.name),
          useValue: milestoneModel,
        },
        {
          provide: getModelToken(Task.name),
          useValue: taskModel,
        },
      ],
    }).compile();

    service = module.get<MilestoneService>(MilestoneService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a milestone', async () => {
      const createDto: CreateMilestoneDto = {
        title: 'Q1 Planning',
        description: 'First quarter planning',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      };
      const projectId = 'project-123';

      const createdMilestone = {
        _id: new Types.ObjectId(),
        ...createDto,
        projectId,
      };

      milestoneModel.create.mockResolvedValue(createdMilestone);

      const result = await service.create(createDto, projectId);

      expect(milestoneModel.create).toHaveBeenCalledWith({
        ...createDto,
        projectId,
      });
      expect(result).toEqual(createdMilestone);
    });
  });

  describe('findAll', () => {
    it('should return all milestones with populated tasks', async () => {
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

      milestoneModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(milestones),
      });

      const result = await service.findAll();

      expect(milestoneModel.find).toHaveBeenCalled();
      expect(result).toEqual(milestones);
    });
  });

  describe('findAllForDashboard', () => {
    it('should return milestones with tasks and status populated', async () => {
      const milestones = [
        {
          _id: new Types.ObjectId(),
          title: 'Dashboard Milestone',
          tasks: [
            {
              _id: new Types.ObjectId(),
              title: 'Task 1',
              status: { _id: new Types.ObjectId(), name: 'in_progress' },
            },
          ],
        },
      ];

      milestoneModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(milestones),
      });

      const result = await service.findAllForDashboard();

      expect(milestoneModel.find).toHaveBeenCalled();
      expect(result).toEqual(milestones);
    });
  });

  describe('findOne', () => {
    it('should return a single milestone with populated tasks', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const milestone = {
        _id: milestoneId,
        title: 'Single Milestone',
        tasks: [],
      };

      milestoneModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(milestone),
      });

      const result = await service.findOne(milestoneId);

      expect(milestoneModel.findById).toHaveBeenCalledWith(milestoneId);
      expect(result).toEqual(milestone);
    });

    it('should return null when milestone not found', async () => {
      milestoneModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const updateDto: UpdateMilestoneDto = {
        title: 'Updated Title',
      };

      const updatedMilestone = {
        _id: milestoneId,
        ...updateDto,
        tasks: [],
      };

      milestoneModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedMilestone),
      });

      const result = await service.update(milestoneId, updateDto);

      expect(milestoneModel.findByIdAndUpdate).toHaveBeenCalledWith(
        milestoneId,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedMilestone);
    });

    it('should throw error when milestone not found', async () => {
      milestoneModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('invalid-id', { title: 'Updated' }),
      ).rejects.toThrow('Milestone with id invalid-id not found');
    });
  });

  describe('getMilestonesByProjectId', () => {
    it('should return milestones for a project', async () => {
      const projectId = 'project-123';
      const milestones = [
        {
          _id: new Types.ObjectId(),
          title: 'Milestone 1',
          projectId,
          tasks: [],
        },
      ];

      milestoneModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(milestones),
      });

      const result = await service.getMilestonesByProjectId(projectId);

      expect(milestoneModel.find).toHaveBeenCalledWith({ projectId });
      expect(result).toEqual(milestones);
    });

    it('should return empty array when no milestones found', async () => {
      milestoneModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getMilestonesByProjectId('project-999');

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delete a milestone', async () => {
      const milestoneId = new Types.ObjectId().toString();
      const deletedMilestone = {
        _id: milestoneId,
        title: 'Deleted Milestone',
      };

      milestoneModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedMilestone),
      });

      const result = await service.remove(milestoneId);

      expect(milestoneModel.findByIdAndDelete).toHaveBeenCalledWith(
        milestoneId,
      );
      expect(result).toEqual(deletedMilestone);
    });

    it('should throw error when milestone not found', async () => {
      milestoneModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('invalid-id')).rejects.toThrow(
        'Milestone with id invalid-id not found',
      );
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });
});
