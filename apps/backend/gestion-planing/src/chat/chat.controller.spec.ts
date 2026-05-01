import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockChatService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should call chatService.sendMessage with message and empty history', async () => {
      const dto = { message: 'Hello bot' };
      mockChatService.sendMessage.mockResolvedValue({
        success: true,
        data: { reply: 'Hello! How can I help?' },
      });

      const result = await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith('Hello bot', []);
      expect(result.success).toBe(true);
      expect(result.data.reply).toBe('Hello! How can I help?');
    });

    it('should call chatService.sendMessage with message and conversation history', async () => {
      const conversationHistory = [
        { role: 'user' as const, content: 'What is a task?' },
        { role: 'assistant' as const, content: 'A task is a unit of work.' },
      ];
      const dto = {
        message: 'Tell me more',
        conversationHistory,
      };

      mockChatService.sendMessage.mockResolvedValue({
        success: true,
        data: { reply: 'Sure! A task is...' },
      });

      const result = await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith(
        'Tell me more',
        conversationHistory,
      );
      expect(result.success).toBe(true);
    });

    it('should handle service error', async () => {
      const dto = { message: 'Hello' };
      mockChatService.sendMessage.mockResolvedValue({
        success: false,
        message: 'Service error',
      });

      const result = await controller.sendMessage(dto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Service error');
    });

    it('should handle undefined conversation history', async () => {
      const dto = { message: 'Hello bot', conversationHistory: undefined };
      mockChatService.sendMessage.mockResolvedValue({
        success: true,
        data: { reply: 'Response' },
      });

      const result = await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith('Hello bot', []);
      expect(result.success).toBe(true);
    });

    it('should pass through multiple turns of conversation', async () => {
      const conversationHistory = [
        { role: 'user' as const, content: 'First question' },
        { role: 'assistant' as const, content: 'First answer' },
        { role: 'user' as const, content: 'Second question' },
        { role: 'assistant' as const, content: 'Second answer' },
      ];
      const dto = {
        message: 'Third question',
        conversationHistory,
      };

      mockChatService.sendMessage.mockResolvedValue({
        success: true,
        data: { reply: 'Third answer' },
      });

      await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith(
        'Third question',
        conversationHistory,
      );
    });
  });
});
