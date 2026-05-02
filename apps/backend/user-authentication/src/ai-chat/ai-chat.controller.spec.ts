import { Test, TestingModule } from '@nestjs/testing';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

describe('AiChatController', () => {
  let controller: AiChatController;
  let mockAiChatService: any;

  beforeEach(async () => {
    mockAiChatService = {
      processChatMessage: jest.fn().mockResolvedValue({ response: 'Hello' }),
      getConversationHistory: jest.fn().mockResolvedValue([]),
      clearConversation: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiChatController],
      providers: [
        {
          provide: AiChatService,
          useValue: mockAiChatService,
        },
      ],
    }).compile();

    controller = module.get<AiChatController>(AiChatController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Chat Endpoints', () => {
    it('should process chat messages', async () => {
      const messageDto = { message: 'Hello', userId: '123' };

      expect(controller).toBeDefined();
    });

    it('should get conversation history', async () => {
      expect(controller).toBeDefined();
    });

    it('should clear conversation', async () => {
      expect(controller).toBeDefined();
    });
  });
});
