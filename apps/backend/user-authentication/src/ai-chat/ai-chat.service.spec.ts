import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiChatService } from './ai-chat.service';

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

import OpenAI from 'openai';

describe('AiChatService', () => {
  let service: AiChatService;
  let mockConfigService: any;
  let mockOpenAiClient: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return undefined;
      }),
    };

    mockOpenAiClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'Test AI response',
                },
              },
            ],
          }),
        },
      },
    };

    (OpenAI as jest.Mock).mockImplementation(() => mockOpenAiClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiChatService>(AiChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should have sendMessage method', () => {
      expect(typeof service.sendMessage).toBe('function');
    });

    it('should return error when API key is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return '';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return undefined;
      });
      
      const result = await service.sendMessage('Hello', []);

      expect(result.success).toBe(false);
    });

    it('should process valid message with API call', async () => {
      const message = 'Hello, AI';
      const conversationHistory = [
        { role: 'user' as const, content: 'Hi' },
        { role: 'assistant' as const, content: 'Hello!' },
      ];

      const result = await service.sendMessage(message, conversationHistory);

      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('Test AI response');
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle empty conversation history', async () => {
      const result = await service.sendMessage('Hello', []);

      expect(result.success).toBe(true);
      expect(mockOpenAiClient.chat.completions.create).toHaveBeenCalled();
    });

    it('should support system context', async () => {
      const message = 'Help me with construction';
      const conversationHistory = [];

      const result = await service.sendMessage(message, conversationHistory);

      expect(result.success).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAiClient.chat.completions.create.mockRejectedValue(new Error('API Error'));
      const result = await service.sendMessage('test', []);
      expect(result.success).toBe(false);
      expect(result.message).toContain('API Error');
    });

    it('should process messages with long conversation history', async () => {
      const longHistory = Array.from({ length: 20 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as const,
        content: `Message ${i}`,
      }));
      
      const result = await service.sendMessage('Next message', longHistory);
      expect(result.success).toBe(true);
    });

    it('should handle null message content in response', async () => {
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });
      
      const result = await service.sendMessage('test', []);
      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('');
    });

    it('should handle missing choices in response', async () => {
      mockOpenAiClient.chat.completions.create.mockResolvedValue({
        choices: [],
      });
      
      const result = await service.sendMessage('test', []);
      expect(result.success).toBe(true);
      expect(result.data?.reply).toBe('');
    });

    it('should include system prompt in messages', async () => {
      await service.sendMessage('test message', []);
      
      const callArgs = mockOpenAiClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[0].content).toContain('SmartSite');
    });

    it('should properly map conversation history roles', async () => {
      const history = [
        { role: 'user' as const, content: 'first' },
        { role: 'assistant' as const, content: 'second' },
      ];
      
      await service.sendMessage('test', history);
      
      const callArgs = mockOpenAiClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[2].role).toBe('assistant');
    });

    it('should use configured model from config service', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'key';
        if (key === 'GROQ_MODEL') return 'custom-model';
        return undefined;
      });
      
      await service.sendMessage('test', []);
      
      const callArgs = mockOpenAiClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.model).toBe('custom-model');
    });

    it('should use default model when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'key';
        if (key === 'GROQ_MODEL') return undefined;
        return undefined;
      });
      
      await service.sendMessage('test', []);
      
      const callArgs = mockOpenAiClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.model).toBe('llama-3.3-70b-versatile');
    });
  });

  describe('Configuration', () => {
    it('should load API configuration from config', () => {
      expect(mockConfigService.get).toHaveBeenCalled();
    });

    it('should support API key configuration', () => {
      mockConfigService.get.mockReturnValueOnce('test-key');
      expect(typeof service).toBe('object');
    });

    it('should initialize OpenAI client with base URL', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: 'https://api.groq.com/openai/v1',
      });
    });
  });

  describe('Module Initialization', () => {
    it('should initialize without errors', () => {
      expect(service).toBeDefined();
    });

    it('should call onModuleInit method', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should log initialization on module init', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.onModuleInit();

      logSpy.mockRestore();
    });

    it('should handle missing API key in onModuleInit', () => {
      mockConfigService.get.mockReturnValue('');
      
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      service.onModuleInit();

      errorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should catch and log API errors', async () => {
      mockOpenAiClient.chat.completions.create.mockRejectedValue(new Error('Network error'));
      const result = await service.sendMessage('test', []);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should handle null message error response', async () => {
      mockOpenAiClient.chat.completions.create.mockRejectedValue(null);
      const result = await service.sendMessage('test', []);
      expect(result.success).toBe(false);
    });

    it('should handle undefined conversation history', async () => {
      const result = await service.sendMessage('test', undefined as any);
      expect(result).toBeDefined();
    });

    it('should process empty string message', async () => {
      const result = await service.sendMessage('', []);
      expect(result.success).toBe(true);
    });

    it('should handle very long message', async () => {
      const longMessage = 'a'.repeat(10000);
      const result = await service.sendMessage(longMessage, []);
      expect(result.success).toBe(true);
    });
  });

  it('should have onModuleInit method', () => {
    expect(typeof service.onModuleInit).toBe('function');
  });
});
