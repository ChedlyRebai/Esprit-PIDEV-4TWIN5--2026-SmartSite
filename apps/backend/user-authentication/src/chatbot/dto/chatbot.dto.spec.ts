import { validateSync } from 'class-validator';
import {
  ChatbotResponseDto,
  FeedbackDto,
  GetConversationDto,
  SendMessageDto,
  SuggestedQuestionsDto,
} from './chatbot.dto';

describe('chatbot dto', () => {
  it('should validate send message dto', () => {
    const dto = Object.assign(new SendMessageDto(), {
      message: 'hello',
      language: 'en',
      conversationId: 'c1',
      intent: 'ask',
      context: { x: 1 },
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  
  it('should validate conversation dto and feedback dto', () => {
    const conversationDto = Object.assign(new GetConversationDto(), { conversationId: 'c1', limit: '10' });
    const feedbackDto = Object.assign(new FeedbackDto(), {
      conversationId: 'c1',
      messageId: 'm1',
      feedback: 'positive',
      comment: 'good',
    });

    expect(validateSync(conversationDto)).toHaveLength(0);
    expect(validateSync(feedbackDto)).toHaveLength(0);
  });

  it('should validate suggested questions and response dto', () => {
    const questionsDto = Object.assign(new SuggestedQuestionsDto(), { questions: ['one', 'two'] });
    const responseDto = new ChatbotResponseDto();

    responseDto.success = true;
    responseDto.message = 'ok';
    responseDto.timestamp = new Date().toISOString();

    expect(validateSync(questionsDto)).toHaveLength(0);
    expect(responseDto.success).toBe(true);
  });
});