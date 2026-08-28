import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { ensureDbTables, db } from '@/db';
import { user, subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';

let adminSeeded = false;
async function seedAdminUser() {
  if (adminSeeded || process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    const adminEmail = 'robersonsouza@outlook.com';
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!existing) {
      const res = await auth.api.signUpEmail({
        body: {
          name: 'Roberson Souza',
          email: adminEmail,
          password: process.env.ADMIN_INITIAL_PASSWORD || 'Selva@!13894645',
        },
      });

      if (res?.user?.id) {
        // Concede assinatura Pro vitalícia automática para o Admin
        await db.insert(subscription).values({
          id: crypto.randomUUID(),
          userId: res.user.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else {
      // Garante que o admin existente tenha Pro ativo
      const [userSub] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, existing.id))
        .limit(1);

      if (!userSub) {
        await db.insert(subscription).values({
          id: crypto.randomUUID(),
          userId: existing.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else if (userSub.status !== 'active') {
        await db
          .update(subscription)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(subscription.id, userSub.id));
      }
    }
    adminSeeded = true;
  } catch (err) {
    // Non-blocking in case DB is warming up
  }
}

const handlers = toNextJsHandler(auth);

export const GET = async (req: Request) => {
  await ensureDbTables();
  await seedAdminUser();
  return handlers.GET(req);
};

export const POST = async (req: Request) => {
  await ensureDbTables();
  await seedAdminUser();
  return handlers.POST(req);
};
