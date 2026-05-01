import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  const mockChatService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should call chatService.sendMessage and return result', async () => {
      const mockResponse = { success: true, data: { reply: 'Hello!' } };
      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const dto = { message: 'Hello', conversationHistory: [] };
      const result = await controller.sendMessage(dto);

      expect(chatService.sendMessage).toHaveBeenCalledWith('Hello', []);
      expect(result).toEqual(mockResponse);
    });

    it('should use empty array when conversationHistory is not provided', async () => {
      const mockResponse = { success: true, data: { reply: 'Hi!' } };
      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const dto = { message: 'Hi' };
      const result = await controller.sendMessage(dto);

      expect(chatService.sendMessage).toHaveBeenCalledWith('Hi', []);
      expect(result).toEqual(mockResponse);
    });

    it('should pass conversation history to service', async () => {
      const mockResponse = { success: true, data: { reply: 'Sure!' } };
      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const history = [{ role: 'user' as const, content: 'Previous message' }];
      const dto = { message: 'Follow up', conversationHistory: history };
      await controller.sendMessage(dto);

      expect(chatService.sendMessage).toHaveBeenCalledWith('Follow up', history);
    });

    it('should return failure response from service', async () => {
      const mockResponse = { success: false, message: 'API error' };
      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const result = await controller.sendMessage({ message: 'test' });
      expect(result.success).toBe(false);
    });
  });
});
