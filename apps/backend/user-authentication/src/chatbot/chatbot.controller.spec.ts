import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let chatbotService: any;
  let configService: any;

  const mockUserId = new Types.ObjectId();

  beforeEach(async () => {
    chatbotService = {
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
      processVoiceMessage: jest.fn().mockResolvedValue({ success: true }),
      analyzeImage: jest.fn().mockResolvedValue({ success: true }),
      processQuickCommand: jest.fn().mockResolvedValue({ success: true }),
      getConversation: jest.fn().mockResolvedValue({ conversationId: 'c1' }),
      getConversations: jest.fn().mockResolvedValue([]),
      deleteConversation: jest.fn().mockResolvedValue({ success: true }),
      restoreConversation: jest.fn().mockResolvedValue({ success: true }),
      permanentlyDeleteConversation: jest.fn().mockResolvedValue({ success: true }),
      getArchivedConversations: jest.fn().mockResolvedValue([]),
      submitFeedback: jest.fn().mockResolvedValue({ success: true }),
      getSuggestedQuestions: jest.fn().mockResolvedValue([]),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'GOOGLE_CLOUD_VISION_API_KEY') return 'google-key';
        if (key === 'IMAGGA_API_KEY') return 'img-key';
        if (key === 'IMAGGA_API_SECRET') return 'img-secret';
        return '';
      }),
    };

    const module = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [
        { provide: ChatbotService, useValue: chatbotService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get(ChatbotController);
  });

  it('should report API status from config', async () => {
    const result = await controller.getApiStatus();

    expect(result.success).toBe(true);
    expect(result.data.googleCloudConfigured).toBe(true);
    expect(result.data.imaggaConfigured).toBe(true);
  });

  it('should expose update API keys instructions', async () => {
    const result = await controller.updateApiKeys({});

    expect(result.success).toBe(false);
    expect(result.data.instructions).toHaveLength(3);
  });

  it('should send a chatbot message using userId and role', async () => {
    await controller.sendMessage(
      { user: { userId: mockUserId, role: { name: 'manager' } } } as any,
      { message: 'hello', language: 'fr' } as any,
    );

    expect(chatbotService.sendMessage).toHaveBeenCalledWith(mockUserId, 'manager', { message: 'hello', language: 'fr' });
  });

  it('should process voice and image requests', async () => {
    await controller.processVoice({ user: { id: 'u1' } } as any, { originalname: 'note.wav' } as any, 'ar');
    await controller.analyzeImage({ user: { _id: 'u2' } } as any, { originalname: 'img.png' } as any, 'en');

    expect(chatbotService.processVoiceMessage).toHaveBeenCalledWith('u1', 'user', expect.any(Object), 'ar');
    expect(chatbotService.analyzeImage).toHaveBeenCalledWith('u2', 'user', expect.any(Object), 'en');
  });

  it('should process quick commands', async () => {
    await controller.processQuickCommand(
      { user: { userId: 'u3', role: { name: 'admin' } } } as any,
      { command: 'stats', language: 'fr' },
    );

    expect(chatbotService.processQuickCommand).toHaveBeenCalledWith('u3', 'admin', 'stats', 'fr');
  });

  it('should get conversations with parsed limit and defaults', async () => {
    await controller.getConversation({ user: { userId: 'u4' } } as any, { conversationId: 'c1', limit: '15' } as any);
    await controller.getConversations({ user: { id: 'u5' } } as any);
    await controller.getArchivedConversations({ user: { _id: 'u6' } } as any, '7');

    expect(chatbotService.getConversation).toHaveBeenCalledWith('u4', 'c1', 15);
    expect(chatbotService.getConversations).toHaveBeenCalledWith('u5', 10);
    expect(chatbotService.getArchivedConversations).toHaveBeenCalledWith('u6', 7);
  });

  it('should delete, restore, and permanently delete conversations', async () => {
    await controller.deleteConversation({ user: { userId: 'u7' } } as any, 'c2');
    await controller.restoreConversation({ user: { userId: 'u7' } } as any, 'c2');
    await controller.permanentlyDeleteConversation({ user: { userId: 'u7' } } as any, 'c2');

    expect(chatbotService.deleteConversation).toHaveBeenCalledWith('u7', 'c2');
    expect(chatbotService.restoreConversation).toHaveBeenCalledWith('u7', 'c2');
    expect(chatbotService.permanentlyDeleteConversation).toHaveBeenCalledWith('u7', 'c2');
  });

  it('should submit feedback and suggest questions', async () => {
    await controller.submitFeedback({ user: { userId: 'u8' } } as any, {
      conversationId: 'c3',
      messageId: 'm1',
      feedback: 'positive',
    } as any);
    await controller.getSuggestedQuestions('fr');

    expect(chatbotService.submitFeedback).toHaveBeenCalledWith('u8', {
      conversationId: 'c3',
      messageId: 'm1',
      feedback: 'positive',
    });
    expect(chatbotService.getSuggestedQuestions).toHaveBeenCalledWith('fr');
  });
});
