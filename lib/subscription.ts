import { db } from '@/db';
import { subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS, Plan } from '@/config/subscriptions';

export interface UserSubscriptionDetails {
  plan: Plan;
  planId: 'free' | 'pro' | 'studio';
  isPro: boolean;
  isStudio: boolean;
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

  if (!sub) {
    return {
      plan: SUBSCRIPTION_PLANS.free,
      planId: 'free',
      isPro: false,
      isStudio: false,
      status: 'none',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
    };
  }

  // A subscription is active if status is 'active' or 'trialing' and period has not expired + 24h grace
  const now = new Date().getTime();
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : 0;
  const isPeriodValid = periodEnd > 0 ? periodEnd + 86_400_000 > now : false;

  const isPro = (sub.status === 'active' || sub.status === 'trialing') && (periodEnd === 0 || isPeriodValid);
  const rawPriceId = (sub.stripePriceId || '').trim();
  const priceId = rawPriceId.toLowerCase();
  const studioMonthly = (process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_MONTHLY || '').toLowerCase();
  const studioYearly = (process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_YEARLY || '').toLowerCase();

  const isStudio = isPro && (
    priceId.includes('studio') ||
    priceId === 'studio' ||
    priceId === 'price_1uazosrsgtnu3z0k2vux8dxb' ||
    priceId === 'price_1uazpcrsgtnu3z0kc2dwwwqo' ||
    priceId === 'price_1uaa2mrsgtnu3z0kkmgegbli' ||
    priceId === 'price_1uaa4crsgtnu3z0kqzypce4m' ||
    (Boolean(studioMonthly) && priceId === studioMonthly) ||
    (Boolean(studioYearly) && priceId === studioYearly)
  );
  const planId: 'free' | 'pro' | 'studio' = isPro ? (isStudio ? 'studio' : 'pro') : 'free';

  return {
    plan: SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro,
    planId,
    isPro,
    isStudio,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    stripeCustomerId: sub.stripeCustomerId,
  };
}
