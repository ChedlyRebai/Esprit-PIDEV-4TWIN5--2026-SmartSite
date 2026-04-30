import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('ChatService', () => {
  let service: ChatService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'GROQ_API_KEY') return 'test-api-key-12345';
      if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log success when API key is present', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should log error when API key is missing', () => {
      mockConfigService.get.mockReturnValueOnce(''); // GROQ_API_KEY empty
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should return success response with reply', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello! How can I help?' } }],
      });

      const result = await service.sendMessage('Hello', []);
      expect(result.success).toBe(true);
      expect(result.data.reply).toBe('Hello! How can I help?');
    });

    it('should return success with conversation history', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Sure, I can help with that.' } }],
      });

      const history = [
        { role: 'user' as const, content: 'What is a site?' },
        { role: 'assistant' as const, content: 'A site is a construction location.' },
      ];

      const result = await service.sendMessage('Tell me more', history);
      expect(result.success).toBe(true);
      expect(result.data.reply).toBe('Sure, I can help with that.');
    });

    it('should return failure when API key is missing', async () => {
      mockConfigService.get.mockReturnValueOnce(''); // GROQ_API_KEY empty

      const result = await service.sendMessage('Hello', []);
      expect(result.success).toBe(false);
      expect(result.message).toContain('GROQ_API_KEY');
    });

    it('should return failure on API error', async () => {
      mockCreate.mockRejectedValue(new Error('API connection failed'));

      const result = await service.sendMessage('Hello', []);
      expect(result.success).toBe(false);
      expect(result.message).toBe('API connection failed');
    });

    it('should handle empty reply from API', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      const result = await service.sendMessage('Hello', []);
      expect(result.success).toBe(true);
      expect(result.data.reply).toBe('');
    });

    it('should handle missing choices in response', async () => {
      mockCreate.mockResolvedValue({ choices: [] });

      const result = await service.sendMessage('Hello', []);
      expect(result.success).toBe(true);
      expect(result.data.reply).toBe('');
    });
  });
});
