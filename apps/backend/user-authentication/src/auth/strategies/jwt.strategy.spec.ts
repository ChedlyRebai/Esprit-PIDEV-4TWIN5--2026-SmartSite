import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should create strategy with provided secret and validate payloads', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('jwt-secret'),
    } as any;

    const strategy = new JwtStrategy(configService);

    
    expect(strategy).toBeDefined();
    expect(await strategy.validate({ sub: 'u1', email: 'user@example.com', roles: ['user'] })).toEqual({
      userId: 'u1',
      email: 'user@example.com',
      roles: ['user'],
    });
  });

  it('should fall back to default secret when config is missing', () => {
    const strategy = new JwtStrategy({ get: jest.fn().mockReturnValue(undefined) } as any);

    expect(strategy).toBeDefined();
  });
});
