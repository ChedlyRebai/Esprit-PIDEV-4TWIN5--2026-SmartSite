import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      validateUser: jest.fn().mockResolvedValue({ _id: '123', cin: '12345678' }),
    };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });
  


  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const user = { _id: '123', cin: '12345678' };
      mockAuthService.validateUser.mockResolvedValue(user);

      const result = await strategy.validate('12345678', 'password');

      expect(result).toEqual(user);
    });
  });
});
