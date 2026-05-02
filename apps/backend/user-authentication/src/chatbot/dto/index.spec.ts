import * as dtoExports from './index';


describe('chatbot dto index', () => {
  it('should re-export chatbot dto classes', () => {
    expect(dtoExports.SendMessageDto).toBeDefined();
    expect(dtoExports.FeedbackDto).toBeDefined();
  });
});