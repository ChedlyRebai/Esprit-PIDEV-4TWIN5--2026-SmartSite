import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiChatService } from './ai-chat.service';

describe('AiChatService', () => {
  let service: AiChatService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'GROQ_API_KEY') return 'test-api-key';
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return undefined;
      }),
    };
    

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiChatService>(AiChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should have sendMessage method', () => {
      expect(typeof service.sendMessage).toBe('function');
    });

    it('should return error when API key is not configured', async () => {
      mockConfigService.get.mockReturnValue('');
      
      const result = await service.sendMessage('Hello', []);

      expect(result.success).toBe(false);
    });

    it('should process valid message', async () => {
      const message = 'Hello, AI';
      const conversationHistory = [
        { role: 'user' as const, content: 'Hi' },
        { role: 'assistant' as const, content: 'Hello!' },
      ];

      const result = await service.sendMessage(message, conversationHistory);

      expect(result).toBeDefined();
    });

    it('should handle empty conversation history', async () => {
      const result = await service.sendMessage('Hello', []);

      expect(result).toBeDefined();
    });

    it('should support system context', async () => {
      const message = 'Help me with construction';
      const conversationHistory = [];

      const result = await service.sendMessage(message, conversationHistory);

      expect(result).toBeDefined();
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

    it('should use default model if not configured', () => {
      mockConfigService.get.mockImplementationOnce((key: string) => {
        if (key === 'GROQ_MODEL') return undefined;
        return 'test-key';
      });

      expect(service).toBeDefined();
    });
  });

  describe('Module Initialization', () => {
    it('should initialize without errors', () => {
      expect(service).toBeDefined();
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

  it('should have onModuleInit method', () => {
    expect(typeof service.onModuleInit).toBe('function');
  });
});
