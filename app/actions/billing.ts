'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user, subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createCheckoutSession(priceId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(`/login?redirect=/pricing`);
  }

  const currentUser = session.user;

  // 1. Get or create Stripe Customer
  const [existingSub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, currentUser.id))
    .limit(1);

  let customerId = existingSub?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: currentUser.email,
      name: currentUser.name,
      metadata: {
        userId: currentUser.id,
      },
    });
    customerId = customer.id;

    if (existingSub) {
      await db
        .update(subscription)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(subscription.userId, currentUser.id));
    } else {
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        stripeCustomerId: customerId,
        status: 'inactive',
      });
    }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    'http://localhost:3000';

  // 2. Create Stripe Checkout Session (Supports Credit Card & PIX in BRL)
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card', 'pix'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: currentUser.id,
    },
    subscription_data: {
      metadata: {
        userId: currentUser.id,
      },
    },
    success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?payment=cancelled`,
    locale: 'pt-BR',
    allow_promotion_codes: true,
  });

  if (!checkoutSession.url) {
    throw new Error('Falha ao gerar link de pagamento.');
  }

  redirect(checkoutSession.url);
}

export async function createCustomerPortalSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const [userSub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, session.user.id))
    .limit(1);

  if (!userSub?.stripeCustomerId) {
    redirect('/pricing');
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: userSub.stripeCustomerId,
    return_url: `${origin}/dashboard/settings/billing`,
  });

  redirect(portalSession.url);
}
