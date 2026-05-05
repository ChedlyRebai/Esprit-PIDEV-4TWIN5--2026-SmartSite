import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const mockChatService = {
  sendMessage: jest.fn(),
};

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  describe('sendMessage', () => {
    it('envoie un message et retourne la réponse', async () => {
      const response = { success: true, data: { reply: 'Hello from AI' } };
      mockChatService.sendMessage.mockResolvedValue(response);

      const result = await controller.sendMessage({ message: 'Hello' });
      expect(result).toEqual(response);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Hello', []);
    });

    it('passe l\'historique de conversation', async () => {
      const response = { success: true, data: { reply: 'Response' } };
      mockChatService.sendMessage.mockResolvedValue(response);

      const history = [{ role: 'user' as const, content: 'Previous' }];
      await controller.sendMessage({ message: 'New', conversationHistory: history });
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('New', history);
    });

    it('utilise un tableau vide si pas d\'historique', async () => {
      mockChatService.sendMessage.mockResolvedValue({ success: true, data: { reply: '' } });
      await controller.sendMessage({ message: 'Test' });
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Test', []);
    });

    it('retourne une erreur si le service échoue', async () => {
      const errorResponse = { success: false, message: 'API Error' };
      mockChatService.sendMessage.mockResolvedValue(errorResponse);

      const result = await controller.sendMessage({ message: 'Hello' });
      expect(result).toEqual(errorResponse);
    });
  });
});
