import * as guards from './index';


describe('auth guards index', () => {
  it('should re-export guards', () => {
    expect(guards.LocalAuthGuard).toBeDefined();
    expect(guards.JwtAuthGuard).toBeDefined();
  });
});