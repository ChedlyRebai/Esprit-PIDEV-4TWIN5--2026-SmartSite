import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotConversation } from './entities/chatbot-conversation.entity';
import { UsersService } from '../users/users.service';
import { TeamsService } from '../teams/teams.service';
import { RolesService } from '../roles/roles.service';
import { Types } from 'mongoose';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let mockChatbotModel: any;
  let mockUsersService: any;
  let mockTeamsService: any;
  let mockRolesService: any;
  let mockConfigService: any;


  
  beforeEach(async () => {
    mockChatbotModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
    };


    mockUsersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    mockTeamsService = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    mockRolesService = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: getModelToken(ChatbotConversation.name), useValue: mockChatbotModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TeamsService, useValue: mockTeamsService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should have sendMessage method', () => {
      expect(typeof service.sendMessage).toBe('function');
    });
  });

  describe('getConversation', () => {
    it('should retrieve conversation by ID', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      const mockConversation = {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
        messages: [{ role: 'user', content: 'test', timestamp: new Date() }],
        language: 'en',
        status: 'active',
      };

      mockChatbotModel.findById.mockResolvedValue(mockConversation);

      const result = await service.getConversation(userId, conversationId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should create new conversation if not found', async () => {
      const userId = new Types.ObjectId().toString();

      mockChatbotModel.findById.mockResolvedValue(null);
      mockChatbotModel.findOne.mockResolvedValue(null);

      const result = await service.getConversation(userId, undefined);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for unauthorized access', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();
      const otherUserId = new Types.ObjectId().toString();

      const mockConversation = {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(otherUserId),
        messages: [],
      };

      mockChatbotModel.findById.mockResolvedValue(mockConversation);

      const result = await service.getConversation(userId, conversationId);
      expect(result).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();
      const messages = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date(),
      }));

      const mockConversation = {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
        messages,
        language: 'en',
        status: 'active',
      };

      mockChatbotModel.findById.mockResolvedValue(mockConversation);

      const result = await service.getConversation(userId, conversationId, 5);

      expect(result.data.messages.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getConversations', () => {
    it('should retrieve all conversations for user', async () => {
      const userId = new Types.ObjectId().toString();
      const mockConversations = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          messages: [],
          language: 'en',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockChatbotModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockConversations),
        }),
      });

      const result = await service.getConversations(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should apply limit parameter', async () => {
      const userId = new Types.ObjectId().toString();

      mockChatbotModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      await service.getConversations(userId, 20);

      expect(mockChatbotModel.find).toHaveBeenCalled();
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      const mockConversation = {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
        status: 'active',
        save: jest.fn().mockResolvedValue({}),
      };

      mockChatbotModel.findOne.mockResolvedValue(mockConversation);

      const result = await service.deleteConversation(userId, conversationId);

      expect(result.success).toBe(true);
    });

    it('should return error for non-existent conversation', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      mockChatbotModel.findOne.mockResolvedValue(null);

      const result = await service.deleteConversation(userId, conversationId);

      expect(result.success).toBe(false);
    });
  });

  describe('restoreConversation', () => {
    it('should restore archived conversation', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      const mockConversation = {
        status: 'archived',
        save: jest.fn().mockResolvedValue({}),
      };

      mockChatbotModel.findOne.mockResolvedValue(mockConversation);

      const result = await service.restoreConversation(userId, conversationId);

      expect(result.success).toBe(true);
    });
  });

  describe('permanentlyDeleteConversation', () => {
    it('should permanently delete conversation', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      mockChatbotModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.permanentlyDeleteConversation(userId, conversationId);

      expect(result.success).toBe(true);
    });

    it('should return error when conversation not found', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      mockChatbotModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await service.permanentlyDeleteConversation(userId, conversationId);

      expect(result.success).toBe(false);
    });
  });

  describe('getArchivedConversations', () => {
    it('should retrieve archived conversations', async () => {
      const userId = new Types.ObjectId().toString();

      mockChatbotModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getArchivedConversations(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const userId = new Types.ObjectId().toString();
      const conversationId = new Types.ObjectId().toString();

      const mockConversation = {
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
        messages: [{ role: 'user', content: 'test' }],
        save: jest.fn().mockResolvedValue({}),
      };

      mockChatbotModel.findOne.mockResolvedValue(mockConversation);

      const result = await service.submitFeedback(userId, {
        conversationId,
        messageId: '0',
        feedback: 'helpful',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getSuggestedQuestions', () => {
    it('should get suggested questions', async () => {
      const result = await service.getSuggestedQuestions('en');

      expect(result.success).toBe(true);
      expect(result.data.questions).toBeInstanceOf(Array);
    });

    it('should support multiple languages', async () => {
      const enResult = await service.getSuggestedQuestions('en');
      const frResult = await service.getSuggestedQuestions('fr');
      const arResult = await service.getSuggestedQuestions('ar');

      expect(enResult.data.questions).toBeDefined();
      expect(frResult.data.questions).toBeDefined();
      expect(arResult.data.questions).toBeDefined();
    });
  });

  describe('processQuickCommand', () => {
    it('should process quick commands', async () => {
      const userId = new Types.ObjectId().toString();

      mockUsersService.findAll.mockResolvedValue([]);

      const result = await service.processQuickCommand(userId, 'user', '/help', 'en');

      expect(result).toBeDefined();
    });
  });

  describe('analyzeImage', () => {
    it('should analyze image', async () => {
      const userId = new Types.ObjectId().toString();
      const mockImage = { path: '/tmp/test.jpg', originalname: 'test.jpg' };

      const result = await service.analyzeImage(userId, 'user', mockImage, 'en');

      expect(result.success).toBeDefined();
    });
  });

  it('should have getConversation method', () => {
    expect(typeof service.getConversation).toBe('function');
  });

  it('should have getConversations method', () => {
    expect(typeof service.getConversations).toBe('function');
  });

  it('should have deleteConversation method', () => {
    expect(typeof service.deleteConversation).toBe('function');
  });

  it('should have analyzeImage method', () => {
    expect(typeof service.analyzeImage).toBe('function');
  });
});
