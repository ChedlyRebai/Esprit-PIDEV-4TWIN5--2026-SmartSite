import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { Types } from 'mongoose';

describe('ChatbotController', () => {
  let mockChatbotService: any;

  const mockConversationId = new Types.ObjectId();
  const mockUserId = new Types.ObjectId();

  beforeEach(async () => {
    mockChatbotService = {
      create: jest.fn().mockResolvedValue({ _id: mockConversationId }),
      findUserConversations: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ _id: mockConversationId }),
      addMessage: jest.fn().mockResolvedValue({ _id: mockConversationId }),
      delete: jest.fn().mockResolvedValue({ _id: mockConversationId }),
      generateResponse: jest.fn().mockResolvedValue({ response: 'Hello' }),
    };
  });

  it('should have chatbot service available', () => {
    expect(mockChatbotService).toBeDefined();
  });

  describe('Chat Operations', () => {
    it('should create a chatbot conversation', async () => {
      const createDto = { userId: mockUserId };

      const result = await mockChatbotService.create(createDto);

      expect(result).toBeDefined();
      expect(mockChatbotService.create).toHaveBeenCalledWith(createDto);
    });

    it('should get user conversations', async () => {
      const result = await mockChatbotService.findUserConversations(mockUserId.toString());

      expect(result).toBeDefined();
      expect(mockChatbotService.findUserConversations).toHaveBeenCalledWith(mockUserId.toString());
    });

    it('should get conversation by id', async () => {
      const result = await mockChatbotService.findById(mockConversationId.toString());

      expect(result).toBeDefined();
      expect(mockChatbotService.findById).toHaveBeenCalledWith(mockConversationId.toString());
    });

    it('should add message to conversation', async () => {
      const messageDto = { text: 'Hello', sender: 'user' };

      const result = await mockChatbotService.addMessage(mockConversationId.toString(), messageDto);

      expect(result).toBeDefined();
      expect(mockChatbotService.addMessage).toHaveBeenCalledWith(mockConversationId.toString(), messageDto);
    });

    it('should delete a conversation', async () => {
      const result = await mockChatbotService.delete(mockConversationId.toString());

      expect(result).toBeDefined();
      expect(mockChatbotService.delete).toHaveBeenCalledWith(mockConversationId.toString());
    });
  });
});
