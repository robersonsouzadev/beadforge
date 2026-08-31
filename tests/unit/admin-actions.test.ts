import { describe, it, expect } from 'vitest';
import { isUserAdmin } from '../../lib/admin';

describe('Admin System & Authorization', () => {
  it('identifica corretamente o email do administrador', () => {
    expect(isUserAdmin('robersonsouza@outlook.com')).toBe(true);
    expect(isUserAdmin('ROBERSONSOUZA@OUTLOOK.COM')).toBe(true);
    expect(isUserAdmin('  robersonsouza@outlook.com  ')).toBe(true);
  });

  it('rejeita emails não autorizados para acesso de admin', () => {
    expect(isUserAdmin('outro_usuario@gmail.com')).toBe(false);
    expect(isUserAdmin('')).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin(undefined)).toBe(false);
  });
});
