import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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

    // Mock Logger methods
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('should log error when GROQ_API_KEY is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return '';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      service.onModuleInit();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GROQ_API_KEY is missing! Check your .env file.',
      );
    });

    it('should log success when GROQ_API_KEY is configured', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key-12345';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log');
      service.onModuleInit();

      expect(loggerLogSpy).toHaveBeenCalled();
      const callArgs = loggerLogSpy.mock.calls[0][0];
      expect(callArgs).toContain('Groq initialized');
      expect(callArgs).toContain('llama-3.3-70b-versatile');
    });

    it('should use default model when GROQ_MODEL is not set', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key-12345';
        if (key === 'GROQ_MODEL') return '';
        return null;
      });

      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log');
      service.onModuleInit();

      expect(loggerLogSpy).toHaveBeenCalled();
      const callArgs = loggerLogSpy.mock.calls[0][0];
      expect(callArgs).toContain('llama-3.3-70b-versatile');
    });
  });

  describe('sendMessage', () => {
    it('should return error when GROQ_API_KEY is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return '';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      const result = await service.sendMessage('Hello');

      expect(result).toEqual({
        success: false,
        message: 'GROQ_API_KEY not configured.',
      });
    });

    it('should send message with empty conversation history', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      // Mock the OpenAI client's chat.completions.create method
      jest.spyOn(service['client'].chat.completions, 'create').mockResolvedValue({
        choices: [
          {
            message: { content: 'Hello! How can I help you?' },
          } as any,
        ],
      } as any);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('Hello! How can I help you?');
    });

    it('should send message with conversation history', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      const conversationHistory = [
        { role: 'user' as const, content: 'What is my project status?' },
        { role: 'assistant' as const, content: 'Your project is on track.' },
      ];

      jest.spyOn(service['client'].chat.completions, 'create').mockResolvedValue({
        choices: [
          {
            message: { content: 'Great question! Let me help with that.' },
          } as any,
        ],
      } as any);

      const result = await service.sendMessage('Tell me more', conversationHistory);

      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('Great question! Let me help with that.');
    });

    it('should handle API error gracefully', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      const error = new Error('API rate limit exceeded');
      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockRejectedValue(error);

      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.message).toBe('API rate limit exceeded');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Groq API error:',
        'API rate limit exceeded',
      );
    });

    it('should handle API error without message', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockRejectedValue({ error: 'Unknown error' });

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to get response from AI.');
    });

    it('should handle empty response gracefully', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      jest.spyOn(service['client'].chat.completions, 'create').mockResolvedValue({
        choices: [
          {
            message: { content: '' },
          } as any,
        ],
      } as any);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('');
    });

    it('should handle null response', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return null;
      });

      jest.spyOn(service['client'].chat.completions, 'create').mockResolvedValue({
        choices: [{ message: null }] as any,
      } as any);

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('');
    });

    it('should use default model when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return '';
        return null;
      });

      const createSpy = jest
        .spyOn(service['client'].chat.completions, 'create')
        .mockResolvedValue({
          choices: [
            {
              message: { content: 'Response' },
            } as any,
          ],
        } as any);

      await service.sendMessage('Hello');

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
        }),
      );
    });
  });

  describe('service definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have correct system prompt', () => {
      expect(service['systemPrompt']).toContain('SmartSite planning service');
    });
  });
});
