import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotConversation } from './entities/chatbot-conversation.entity';
import { UsersService } from '../users/users.service';
import { TeamsService } from '../teams/teams.service';
import { RolesService } from '../roles/roles.service';

describe('ChatbotService', () => {
  let service: ChatbotService;

  beforeEach(async () => {
    const mockChatbotModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    

    const mockUsersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockTeamsService = {
      findById: jest.fn(),
      findByName: jest.fn(),
    };

    const mockRolesService = {
      findById: jest.fn(),
      findByName: jest.fn(),
    };

    const mockConfigService = {
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

  it('should have sendMessage method', () => {
    expect(typeof service.sendMessage).toBe('function');
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
