import { describe, it, expect } from 'vitest';

describe('3-Day VIP Reverse Trial Calculation', () => {
  const trialDurationMs = 3 * 24 * 60 * 60 * 1000; // 72 hours

  it('concede status de Pro / VIP para contas criadas a menos de 3 dias', () => {
    const now = Date.now();
    const createdAt1DayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000);
    const trialEndMs = createdAt1DayAgo.getTime() + trialDurationMs;

    const isTrialActive = now < trialEndMs;
    const msRemaining = trialEndMs - now;
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    expect(isTrialActive).toBe(true);
    expect(daysRemaining).toBe(2);
  });

  it('concede 3 dias cheios para conta recem-criada', () => {
    const now = Date.now();
    const createdAtJustNow = new Date(now - 1000); // 1 segundo atrás
    const trialEndMs = createdAtJustNow.getTime() + trialDurationMs;

    const isTrialActive = now < trialEndMs;
    const msRemaining = trialEndMs - now;
    const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    expect(isTrialActive).toBe(true);
    expect(daysRemaining).toBe(3);
  });

  it('expira o trial para contas criadas a mais de 3 dias', () => {
    const now = Date.now();
    const createdAt4DaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000);
    const trialEndMs = createdAt4DaysAgo.getTime() + trialDurationMs;

    const isTrialActive = now < trialEndMs;

    expect(isTrialActive).toBe(false);
  });
});
