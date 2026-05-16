import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('Auth Guards', () => {
  it('LocalAuthGuard should be defined', () => {
    expect(LocalAuthGuard).toBeDefined();
  });

  it('JwtAuthGuard should be defined', () => {
    expect(JwtAuthGuard).toBeDefined();
  });
});
