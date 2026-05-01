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
      const response = { success: true, data: { reply: 'Incident logged' } };
      mockChatService.sendMessage.mockResolvedValue(response);
      const result = await controller.sendMessage({ message: 'Report incident' });
      expect(result).toEqual(response);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Report incident', []);
    });

    it('passe l\'historique de conversation', async () => {
      mockChatService.sendMessage.mockResolvedValue({ success: true, data: { reply: 'OK' } });
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
      const error = { success: false, message: 'API Error' };
      mockChatService.sendMessage.mockResolvedValue(error);
      const result = await controller.sendMessage({ message: 'Hello' });
      expect(result).toEqual(error);
    });
  });
});
