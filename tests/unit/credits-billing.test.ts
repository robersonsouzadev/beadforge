import { describe, it, expect } from 'vitest';
import { CREDIT_PACKAGES } from '../../app/actions/billing';
import { SUBSCRIPTION_PLANS } from '../../config/subscriptions';

describe('Credits & Billing Packages', () => {
  it('valida os pacotes de créditos avulsos', () => {
    expect(CREDIT_PACKAGES.starter.credits).toBe(10);
    expect(CREDIT_PACKAGES.starter.priceBrl).toBe(19.9);
    expect(CREDIT_PACKAGES.starter.priceInCents).toBe(1990);

    expect(CREDIT_PACKAGES.popular.credits).toBe(25);
    expect(CREDIT_PACKAGES.popular.priceBrl).toBe(39.9);
    expect(CREDIT_PACKAGES.popular.priceInCents).toBe(3990);

    expect(CREDIT_PACKAGES.mega.credits).toBe(60);
    expect(CREDIT_PACKAGES.mega.priceBrl).toBe(79.9);
    expect(CREDIT_PACKAGES.mega.priceInCents).toBe(7990);
  });

  it('valida que os planos de assinatura contêm a cota de créditos de IA 3D', () => {
    const freePlan = SUBSCRIPTION_PLANS.free;
    const proPlan = SUBSCRIPTION_PLANS.pro;
    const studioPlan = SUBSCRIPTION_PLANS.studio;

    const freeHasCredits = freePlan.features.some((f) => f.name.includes('3 Créditos de IA 3D'));
    const proHasCredits = proPlan.features.some((f) => f.name.includes('10 Créditos de IA 3D'));
    const studioHasCredits = studioPlan.features.some((f) => f.name.includes('30 Créditos de IA 3D'));

    expect(freeHasCredits).toBe(true);
    expect(proHasCredits).toBe(true);
    expect(studioHasCredits).toBe(true);
  });
});
