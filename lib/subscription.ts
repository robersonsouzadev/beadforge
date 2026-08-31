import { db } from '@/db';
import { subscription, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS, Plan } from '@/config/subscriptions';

export interface UserSubscriptionDetails {
  plan: Plan;
  planId: 'free' | 'pro' | 'studio';
  isPro: boolean;
  isStudio: boolean;
  isTrial?: boolean;
  trialDaysRemaining?: number;
  trialEndsAt?: Date | null;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionDetails> {
  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  const now = new Date().getTime();

  // 1. Verifica se o usuário tem assinatura paga ativa no Stripe
  let isPaidPro = false;
  let isStudio = false;
  let status = 'none';
  let currentPeriodEnd: Date | null = null;
  let cancelAtPeriodEnd = false;
  let stripeCustomerId: string | null = null;

  if (sub) {
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : 0;
    const isPeriodValid = periodEnd > 0 ? periodEnd + 86_400_000 > now : false;

    isPaidPro = (sub.status === 'active' || sub.status === 'trialing') && (periodEnd === 0 || isPeriodValid);
    const rawPriceId = (sub.stripePriceId || '').trim();
    const priceId = rawPriceId.toLowerCase();
    const studioMonthly = (process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_MONTHLY || '').toLowerCase();
    const studioYearly = (process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_YEARLY || '').toLowerCase();

    isStudio = isPaidPro && (
      priceId.includes('studio') ||
      priceId === 'studio' ||
      priceId === 'price_1uazosrsgtnu3z0k2vux8dxb' ||
      priceId === 'price_1uazpcrsgtnu3z0kc2dwwwqo' ||
      priceId === 'price_1uaa2mrsgtnu3z0kkmgegbli' ||
      priceId === 'price_1uaa4crsgtnu3z0kqzypce4m' ||
      (Boolean(studioMonthly) && priceId === studioMonthly) ||
      (Boolean(studioYearly) && priceId === studioYearly)
    );

    status = sub.status;
    currentPeriodEnd = sub.currentPeriodEnd;
    cancelAtPeriodEnd = sub.cancelAtPeriodEnd ?? false;
    stripeCustomerId = sub.stripeCustomerId;
  }

  // 2. Se já é assinante pago (Pro ou Studio), retorna status do Stripe
  if (isPaidPro) {
    const planId: 'free' | 'pro' | 'studio' = isStudio ? 'studio' : 'pro';
    return {
      plan: SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro,
      planId,
      isPro: true,
      isStudio,
      isTrial: false,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      stripeCustomerId,
    };
  }

  // 3. Reverse Trial de 3 Dias para novos cadastros (Degustação VIP gratuita de boas-vindas)
  try {
    const [u] = await db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (u?.createdAt) {
      const trialDurationMs = 3 * 24 * 60 * 60 * 1000; // 3 dias (72h)
      const createdAtMs = new Date(u.createdAt).getTime();
      const trialEndMs = createdAtMs + trialDurationMs;

      if (now < trialEndMs) {
        const msRemaining = trialEndMs - now;
        const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

        return {
          plan: SUBSCRIPTION_PLANS.pro,
          planId: 'pro',
          isPro: true,
          isStudio: false,
          isTrial: true,
          trialDaysRemaining: daysRemaining,
          trialEndsAt: new Date(trialEndMs),
          status: 'trialing',
          currentPeriodEnd: new Date(trialEndMs),
          cancelAtPeriodEnd: false,
          stripeCustomerId: stripeCustomerId,
        };
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar data de cadastro para trial:', err);
  }

  // 4. Se não for assinante e o trial tiver expirado, retorna Plano Free normal
  return {
    plan: SUBSCRIPTION_PLANS.free,
    planId: 'free',
    isPro: false,
    isStudio: false,
    isTrial: false,
    trialDaysRemaining: 0,
    status: status === 'active' ? 'expired' : status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    stripeCustomerId,
  };
}
