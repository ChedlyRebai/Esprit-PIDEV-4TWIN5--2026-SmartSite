import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatbotService } from './chatbot.service';
import { ChatbotConversation } from './entities/chatbot-conversation.entity';

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: getModelToken(ChatbotConversation.name), useValue: mockChatbotModel },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have create method', () => {
    expect(typeof service.create).toBe('function');
  });

  it('should have findUserConversations method', () => {
    expect(typeof service.findUserConversations).toBe('function');
  });

  it('should have findById method', () => {
    expect(typeof service.findById).toBe('function');
  });

  it('should have addMessage method', () => {
    expect(typeof service.addMessage).toBe('function');
  });

  it('should have delete method', () => {
    expect(typeof service.delete).toBe('function');
  });
});
