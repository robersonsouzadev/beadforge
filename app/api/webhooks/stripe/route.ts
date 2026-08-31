import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { subscription, webhookEvent, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err: any) {
    console.error(`❌ Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 1. Check Idempotency (prevent duplicate processing)
  const [alreadyProcessed] = await db
    .select()
    .from(webhookEvent)
    .where(eq(webhookEvent.id, event.id))
    .limit(1);

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, message: 'Already processed' }, { status: 200 });
  }

  try {
    switch (event.type) {
      // ──────────────────────────────────────────────────────────
      // 1. Initial Checkout Completed
      // ──────────────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        // 1. Compra de Pacote Avulso de Créditos de IA (One-Time Payment)
        if (session.mode === 'payment' && session.metadata?.type === 'credits_purchase' && userId) {
          const creditsToAdd = parseInt(session.metadata.creditsCount || '0', 10);
          if (creditsToAdd > 0) {
            const [targetUser] = await db
              .select()
              .from(user)
              .where(eq(user.id, userId))
              .limit(1);

            if (targetUser) {
              await db
                .update(user)
                .set({
                  aiCredits: (targetUser.aiCredits ?? 0) + creditsToAdd,
                  updatedAt: new Date(),
                })
                .where(eq(user.id, userId));
            }
          }
        }

        // 2. Assinatura Recorrente (Creator Pro / Studio Ateliê)
        if (session.mode === 'subscription' && session.subscription && userId) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const [existingSub] = await db
            .select()
            .from(subscription)
            .where(eq(subscription.userId, userId))
            .limit(1);

          const priceId = sub.items.data[0]?.price?.id || null;
          const currentPeriodStart = (sub as any).current_period_start
            ? new Date((sub as any).current_period_start * 1000)
            : null;
          const currentPeriodEnd = (sub as any).current_period_end
            ? new Date((sub as any).current_period_end * 1000)
            : null;

          if (existingSub) {
            await db
              .update(subscription)
              .set({
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: sub.id,
                stripePriceId: priceId,
                status: sub.status,
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                updatedAt: new Date(),
              })
              .where(eq(subscription.userId, userId));
          } else {
            await db.insert(subscription).values({
              id: crypto.randomUUID(),
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId,
              status: sub.status,
              currentPeriodStart,
              currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          // Conceder cota mensal de créditos de IA inclusos no plano
          const normalizedPrice = (priceId || '').toLowerCase();
          const monthlyPlanCredits = normalizedPrice.includes('studio') ? 30 : 10;

          const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
          if (u) {
            await db
              .update(user)
              .set({
                aiCredits: (u.aiCredits ?? 0) + monthlyPlanCredits,
                updatedAt: new Date(),
              })
              .where(eq(user.id, userId));
          }
        }
        break;
      }

      // ──────────────────────────────────────────────────────────
      // 2. Subscription Updated (Renewals, Upgrades, Downgrades)
      // ──────────────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id || null;
        const currentPeriodStart = (sub as any).current_period_start
          ? new Date((sub as any).current_period_start * 1000)
          : null;
        const currentPeriodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000)
          : null;

        await db
          .update(subscription)
          .set({
            status: sub.status,
            stripePriceId: priceId,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, sub.id));
        break;
      }

      // ──────────────────────────────────────────────────────────
      // 3. Subscription Deleted / Expired
      // ──────────────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        await db
          .update(subscription)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, sub.id));
        break;
      }

      // ──────────────────────────────────────────────────────────
      // 4. Invoice Payment Succeeded
      // ──────────────────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | undefined;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const currentPeriodEnd = (sub as any).current_period_end
            ? new Date((sub as any).current_period_end * 1000)
            : null;

          await db
            .update(subscription)
            .set({
              status: 'active',
              currentPeriodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscription.stripeSubscriptionId, sub.id));
        }
        break;
      }

      // ──────────────────────────────────────────────────────────
      // 5. Invoice Payment Failed
      // ──────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | undefined;

        if (subId) {
          await db
            .update(subscription)
            .set({
              status: 'past_due',
              updatedAt: new Date(),
            })
            .where(eq(subscription.stripeSubscriptionId, subId));
        }
        break;
      }
    }

    // Record processed event for idempotency
    await db.insert(webhookEvent).values({
      id: event.id,
      type: event.type,
      processedAt: new Date(),
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error(`Erro ao processar webhook [${event.type}]:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
