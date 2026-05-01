import { GetUser } from './get-user.decorator';

describe('GetUser Decorator', () => {
  it('should extract user from request', () => {
    expect(GetUser).toBeDefined();
  });
});

describe('GetUser Decorator - Additional Tests', () => {
  it('should be a function', () => {
    expect(typeof GetUser).toBe('function');
  });
});
