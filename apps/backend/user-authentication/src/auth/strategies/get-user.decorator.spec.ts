let capturedFactory: ((data: any, ctx: any) => any) | undefined;

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    createParamDecorator: (factory: (data: any, ctx: any) => any) => {
      capturedFactory = factory;
      return jest.fn();
    },
  };
});

import { GetUser } from './get-user.decorator';

describe('GetUser decorator', () => {
  it('should read the full user or a single property', () => {
    const fakeRequest = { user: { email: 'a@b.com', role: 'admin' } };
    const fakeCtx = {
      switchToHttp: () => ({ getRequest: () => fakeRequest }),
    } as any;
    

    expect(capturedFactory).toBeDefined();
    expect(capturedFactory?.(undefined, fakeCtx)).toEqual(fakeRequest.user);
    expect(capturedFactory?.('email', fakeCtx)).toBe('a@b.com');
    expect(GetUser).toBeDefined();
  });
});