import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

const mockCreate = jest.fn();

// Mock openai module — must match the exact import path used in chat.service.ts
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
  };
});

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'GROQ_API_KEY') return 'test-api-key';
    if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
    return null;
  }),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'GROQ_API_KEY') return 'test-api-key';
      if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('onModuleInit', () => {
    it('ne plante pas si la clé API est présente', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('ne plante pas si la clé API est absente', () => {
      mockConfigService.get.mockImplementation(() => null);
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('retourne une réponse réussie', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Incident report received' } }],
      });
      const result = await service.sendMessage('Report incident');
      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('Incident report received');
    });

    it('inclut l\'historique de conversation', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'OK' } }],
      });
      const history = [
        { role: 'user' as const, content: 'Previous' },
        { role: 'assistant' as const, content: 'Response' },
      ];
      await service.sendMessage('New message', history);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Previous' }),
            expect.objectContaining({ role: 'assistant', content: 'Response' }),
            expect.objectContaining({ role: 'user', content: 'New message' }),
          ]),
        }),
      );
    });

    it('retourne une erreur si la clé API est manquante', async () => {
      mockConfigService.get.mockImplementation(() => null);
      const result = await service.sendMessage('Hello');
      expect(result.success).toBe(false);
      expect(result.message).toContain('GROQ_API_KEY');
    });

    it('gère les erreurs de l\'API Groq', async () => {
      mockCreate.mockRejectedValue(new Error('Groq API Error'));
      const result = await service.sendMessage('Hello');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Groq API Error');
    });

    it('gère une réponse vide', async () => {
      mockCreate.mockResolvedValue({ choices: [] });
      const result = await service.sendMessage('Hello');
      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('');
    });

    it('utilise le modèle configuré', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'OK' } }],
      });
      await service.sendMessage('Hello');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'llama-3.3-70b-versatile' }),
      );
    });
  });
});
