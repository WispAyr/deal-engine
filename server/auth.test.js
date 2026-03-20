import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('authRequired false when AUTH_PASSWORD unset', async () => {
    delete process.env.AUTH_PASSWORD;
    const { authRequired } = await import('./auth.js');
    expect(authRequired()).toBe(false);
  });

  it('authRequired true when AUTH_PASSWORD set', async () => {
    process.env.AUTH_PASSWORD = 'secret';
    vi.resetModules();
    const { authRequired, verifyPassword, createToken, verifyToken } = await import('./auth.js');
    expect(authRequired()).toBe(true);
    expect(verifyPassword('secret')).toBe(true);
    expect(verifyPassword('wrong')).toBe(false);
    const token = createToken();
    expect(verifyToken(token)).toEqual({ legacy: true });
    expect(verifyToken('invalid')).toBe(null);
  });
});
