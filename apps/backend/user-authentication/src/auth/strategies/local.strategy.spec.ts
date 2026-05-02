import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { UsersService } from '../../users/users.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockUsersService: any;

  beforeEach(async () => {
    mockUsersService = {
      findByCin: jest.fn().mockResolvedValue({ _id: '123', cin: '12345678' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: UsersService, useValue: mockUsersService },
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
      mockUsersService.findByCin.mockResolvedValue(user);

      const result = await strategy.validate('12345678', 'password');

      expect(result).toEqual(user);
    });
  });
});
