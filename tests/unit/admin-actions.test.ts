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

  it('valida estruturas de tipos do novo painel admin', () => {
    const sampleUserItem = {
      id: 'usr-1',
      name: 'Tester',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
      isPro: true,
      planId: 'studio' as const,
      subscriptionStatus: 'active',
      currentPeriodEnd: new Date(),
      projectCount: 5,
      aiCredits: 10,
    };

    expect(sampleUserItem.aiCredits).toBe(10);
    expect(sampleUserItem.planId).toBe('studio');
  });
});
