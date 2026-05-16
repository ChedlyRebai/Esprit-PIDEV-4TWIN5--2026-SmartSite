import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';

describe('ChatService', () => {
  let service: ChatService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GROQ_API_KEY: 'test-api-key-123',
          GROQ_MODEL: 'llama-3.3-70b-versatile',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log error if GROQ_API_KEY is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      const spyError = jest.spyOn(service['logger'], 'error');

      service.onModuleInit();

      expect(spyError).toHaveBeenCalledWith(
        'GROQ_API_KEY is missing! Check your .env file.',
      );
    });

    it('should log success message if API key is configured', () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string) => {
          if (key === 'GROQ_API_KEY') return 'test-api-key-abc123def456';
          if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
          return null;
        });

      const spyLog = jest.spyOn(service['logger'], 'log');

      service.onModuleInit();

      expect(spyLog).toHaveBeenCalled();
      expect(spyLog.mock.calls[0][0]).toContain('Groq initialized');
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return error if API key is not configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.message).toBe('GROQ_API_KEY not configured.');
    });

    it('should send a message without conversation history', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I assist you with SmartSite notifications?',
            },
          },
        ],
      };

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(true);
      expect(result.data.reply).toBe(
        'Hello! How can I assist you with SmartSite notifications?',
      );
    });

    it('should send a message with conversation history', async () => {
      const conversationHistory = [
        { role: 'user' as const, content: 'What is SmartSite?' },
        {
          role: 'assistant' as const,
          content: 'SmartSite is a platform for managing notifications.',
        },
      ];

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'It helps teams collaborate effectively.',
            },
          },
        ],
      };

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      const result = await service.sendMessage(
        'Tell me more',
        conversationHistory,
      );

      expect(result.success).toBe(true);
      expect(service['client'].chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'system', content: expect.any(String) },
            { role: 'user', content: 'What is SmartSite?' },
            {
              role: 'assistant',
              content:
                'SmartSite is a platform for managing notifications.',
            },
            { role: 'user', content: 'Tell me more' },
          ]),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Groq API rate limit exceeded');

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockRejectedValue(error);

      const spyLogError = jest.spyOn(service['logger'], 'error');

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Groq API rate limit exceeded');
      expect(spyLogError).toHaveBeenCalledWith(
        'Groq API error:',
        'Groq API rate limit exceeded',
      );
    });

    it('should use correct model from config', async () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string) => {
          if (key === 'GROQ_API_KEY') return 'test-key';
          if (key === 'GROQ_MODEL') return 'custom-model-v1';
          return null;
        });

      const mockResponse = {
        choices: [
          {
            message: { content: 'Response' },
          },
        ],
      };

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      await service.sendMessage('Test');

      expect(service['client'].chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'custom-model-v1',
        }),
      );
    });

    it('should handle empty message content in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(true);
      expect(result.data.reply).toBe('');
    });

    it('should set correct API parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Response' },
          },
        ],
      };

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockResolvedValue(mockResponse as any);

      await service.sendMessage('Test message');

      expect(service['client'].chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1024,
          temperature: 0.7,
        }),
      );
    });

    it('should handle error without message property', async () => {
      const error = { code: 'NETWORK_ERROR' };

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockRejectedValue(error);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get response from AI.');
    });
  });
});
