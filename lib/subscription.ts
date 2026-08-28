import { db } from '@/db';
import { subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS, Plan } from '@/config/subscriptions';

export interface UserSubscriptionDetails {
  plan: Plan;
  isPro: boolean;
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
      isPro: false,
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

  return {
    plan: isPro ? SUBSCRIPTION_PLANS.pro : SUBSCRIPTION_PLANS.free,
    isPro,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    stripeCustomerId: sub.stripeCustomerId,
  };
}
