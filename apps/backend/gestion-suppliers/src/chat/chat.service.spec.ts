import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('ChatService', () => {
  let service: ChatService;
  let configService: jest.Mocked<ConfigService>;
  let mockOpenAIClient: jest.Mocked<OpenAI>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    configService = module.get(ConfigService);

    // Mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    (service as any).client = mockOpenAIClient;

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── onModuleInit ───────────────────────────────────────────────────────────

  describe('onModuleInit', () => {
    it('should log error if GROQ_API_KEY is missing', () => {
      configService.get.mockReturnValue('');

      service.onModuleInit();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'GROQ_API_KEY is missing! Check your .env file.',
      );
    });

    it('should log success if GROQ_API_KEY is present', () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123456789')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      service.onModuleInit();

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Groq initialized model: llama-3.3-70b-versatile'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('key: gsk_test_k...'),
      );
    });

    it('should use default model if GROQ_MODEL is not set', () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key')
        .mockReturnValueOnce('');

      service.onModuleInit();

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('llama-3.3-70b-versatile'),
      );
    });
  });

  // ── sendMessage ────────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    const mockMessage = 'Hello, how can I manage suppliers?';
    const mockConversationHistory = [
      { role: 'user' as const, content: 'Previous question' },
      { role: 'assistant' as const, content: 'Previous answer' },
    ];

    it('should return error if GROQ_API_KEY is not configured', async () => {
      configService.get.mockReturnValue('');

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        success: false,
        message: 'GROQ_API_KEY not configured.',
      });
      expect(mockOpenAIClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should send message and return AI response', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'You can manage suppliers by accessing the suppliers module.',
            },
          },
        ],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendMessage(mockMessage);

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('helpful assistant'),
          },
          { role: 'user', content: mockMessage },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      expect(result).toEqual({
        success: true,
        data: {
          reply: 'You can manage suppliers by accessing the suppliers module.',
        },
      });
    });

    it('should include conversation history in API call', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      const mockResponse = {
        choices: [{ message: { content: 'Response with context' } }],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      await service.sendMessage(mockMessage, mockConversationHistory);

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: expect.any(String) },
            { role: 'user', content: 'Previous question' },
            { role: 'assistant', content: 'Previous answer' },
            { role: 'user', content: mockMessage },
          ],
        }),
      );
    });

    it('should handle empty conversation history', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      const mockResponse = {
        choices: [{ message: { content: 'First response' } }],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      await service.sendMessage(mockMessage, []);

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: expect.any(String) },
            { role: 'user', content: mockMessage },
          ],
        }),
      );
    });

    it('should return empty string if no response content', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      const mockResponse = {
        choices: [{ message: {} }],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        success: true,
        data: { reply: '' },
      });
    });

    it('should handle API errors gracefully', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      const mockError = new Error('API rate limit exceeded');

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockRejectedValue(
        mockError,
      );

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        success: false,
        message: 'API rate limit exceeded',
      });
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Groq API error:',
        'API rate limit exceeded',
      );
    });

    it('should handle unknown error format', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.3-70b-versatile');

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockRejectedValue(
        'Unknown error',
      );

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        success: false,
        message: 'Failed to get response from AI.',
      });
    });

    it('should use correct model from config', async () => {
      configService.get
        .mockReturnValueOnce('gsk_test_key_123')
        .mockReturnValueOnce('llama-3.1-8b-instant');

      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      await service.sendMessage(mockMessage);

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.1-8b-instant',
        }),
      );
    });
  });
});
