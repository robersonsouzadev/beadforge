import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { ensureDbTables, db } from '@/db';
import { user, account, subscription } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

let adminSeeded = false;
async function seedAdminUser() {
  if (adminSeeded || process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    const adminEmail = 'robersonsouza@outlook.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Selva@!13894645';
    const hashedPassword = await hashPassword(adminPassword);

    // 1. Check or Create User
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    let userId: string;

    if (!existingUser) {
      userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        name: 'Roberson Souza',
        email: adminEmail,
        emailVerified: true,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      userId = existingUser.id;
      if (existingUser.role !== 'admin') {
        await db
          .update(user)
          .set({ role: 'admin', updatedAt: new Date() })
          .where(eq(user.id, userId));
      }
    }

    // 2. Guarantee Account Record with exact password hash
    const [existingAccount] = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
      .limit(1);

    if (!existingAccount) {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Force update password hash so it is 100% guaranteed to match
      await db
        .update(account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(account.id, existingAccount.id));
    }

    // 3. Guarantee Lifetime Pro Subscription
    const [existingSub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!existingSub) {
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        userId: userId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (existingSub.status !== 'active') {
      await db
        .update(subscription)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(subscription.id, existingSub.id));
    }

    adminSeeded = true;
    console.log('✅ Admin user, password and PRO subscription synced successfully.');
  } catch (err: any) {
    console.warn('Admin seed check:', err?.message || err);
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
