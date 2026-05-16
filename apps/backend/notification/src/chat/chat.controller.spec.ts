import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  beforeEach(async () => {
    const mockChatService = {
      sendMessage: jest.fn(),
    };

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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /chat/message', () => {
    it('should send a message without conversation history', async () => {
      const dto = {
        message: 'Hello, how are you?',
      };

      const mockResponse = {
        response: 'I am doing well, thank you!',
      };

      jest.spyOn(service, 'sendMessage').mockResolvedValue(mockResponse as any);

      const result = await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith('Hello, how are you?', []);
      expect(result).toEqual(mockResponse);
    });

    it('should send a message with conversation history', async () => {
      const dto = {
        message: 'What did I ask before?',
        conversationHistory: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
        ],
      };

      const mockResponse = {
        response: 'You asked "Hello"',
      };

      jest.spyOn(service, 'sendMessage').mockResolvedValue(mockResponse as any);

      const result = await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith(
        'What did I ask before?',
        [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle service errors', async () => {
      const dto = {
        message: 'Test message',
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'sendMessage').mockRejectedValue(error);

      await expect(controller.sendMessage(dto)).rejects.toThrow('Service error');
    });

    it('should handle empty message', async () => {
      const dto = {
        message: '',
      };

      jest.spyOn(service, 'sendMessage').mockResolvedValue({} as any);

      await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith('', []);
    });

    it('should handle long conversation history', async () => {
      const conversationHistory = Array.from({ length: 10 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as const,
        content: `Message ${i}`,
      }));

      const dto = {
        message: 'Continue the conversation',
        conversationHistory,
      };

      jest.spyOn(service, 'sendMessage').mockResolvedValue({} as any);

      await controller.sendMessage(dto);

      expect(service.sendMessage).toHaveBeenCalledWith(
        'Continue the conversation',
        conversationHistory,
      );
      expect(service.sendMessage).toHaveBeenCalledTimes(1);
    });
  });
});
