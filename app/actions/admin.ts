'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { isUserAdmin } from '@/lib/admin';
import { db } from '@/db';
import { user, subscription, project, account } from '@/db/schema';
import { count, eq, desc, and } from 'drizzle-orm';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  isPro: boolean;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  projectCount: number;
}

export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  totalProjects: number;
  estimatedMRR: number;
  users: AdminUserItem[];
}

export async function checkAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !isUserAdmin(session.user.email)) {
    throw new Error('Acesso negado. Apenas administradores podem executar esta ação.');
  }

  return session;
}

export async function getAdminData(): Promise<AdminStats> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !isUserAdmin(session.user.email)) {
    redirect('/dashboard');
  }

  // 1. Get all users
  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  // 2. Get all subscriptions
  const allSubscriptions = await db.select().from(subscription);
  const subMap = new Map<string, typeof subscription.$inferSelect>(
    allSubscriptions.map((s: typeof subscription.$inferSelect) => [s.userId, s])
  );

  // 3. Get project counts per user
  const allProjects = await db
    .select({
      userId: project.userId,
    })
    .from(project);

  const projectCountMap = new Map<string, number>();
  for (const p of allProjects) {
    projectCountMap.set(p.userId, (projectCountMap.get(p.userId) || 0) + 1);
  }

  let proCount = 0;
  let freeCount = 0;

  const usersList: AdminUserItem[] = allUsers.map((u) => {
    const userSub = subMap.get(u.id);
    const now = Date.now();
    const periodEnd = userSub?.currentPeriodEnd ? new Date(userSub.currentPeriodEnd).getTime() : 0;
    const isPeriodValid = periodEnd === 0 || periodEnd + 86_400_000 > now;

    const isPro = (userSub?.status === 'active' || userSub?.status === 'trialing') && isPeriodValid;

    if (isPro) {
      proCount++;
    } else {
      freeCount++;
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      createdAt: u.createdAt,
      isPro,
      subscriptionStatus: userSub?.status || 'none',
      currentPeriodEnd: userSub?.currentPeriodEnd || null,
      projectCount: projectCountMap.get(u.id) || 0,
    };
  });

  // Calculate estimated Monthly Recurring Revenue (R$ 29,90 por assinante Pro)
  const estimatedMRR = proCount * 29.9;

  return {
    totalUsers: allUsers.length,
    freeUsers: freeCount,
    proUsers: proCount,
    totalProjects: allProjects.length,
    estimatedMRR,
    users: usersList,
  };
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password?: string;
  plan: 'pro' | 'free';
  status: 'active' | 'inactive';
  duration?: '30days' | '6months' | '1year' | 'lifetime' | 'custom';
  customPeriodEnd?: string;
}

export async function createAdminUserAction(data: CreateAdminUserPayload) {
  await checkAdminSession();

  const normalizedEmail = data.email.toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório.');
  }

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  let targetUserId = existingUser?.id;

  if (!existingUser) {
    const initialPassword = data.password && data.password.trim().length >= 6 ? data.password.trim() : '123456';
    try {
      const signUpRes = await auth.api.signUpEmail({
        body: {
          name: data.name.trim() || 'Usuário BeadForge',
          email: normalizedEmail,
          password: initialPassword,
        },
      });

      if (!signUpRes?.user?.id) {
        throw new Error('Não foi possível criar o usuário no sistema.');
      }
      targetUserId = signUpRes.user.id;
    } catch (err: any) {
      // If better-auth throws duplicate or other error, fallback to manual insert
      const newId = crypto.randomUUID();
      await db.insert(user).values({
        id: newId,
        name: data.name.trim() || 'Usuário BeadForge',
        email: normalizedEmail,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      targetUserId = newId;
    }
  }

  if (!targetUserId) {
    throw new Error('Falha ao obter ID do usuário.');
  }

  // Configure Subscription
  await applySubscriptionPlan(targetUserId, data.plan, data.status, data.duration, data.customPeriodEnd);

  revalidatePath('/admin');
  return { success: true, userId: targetUserId };
}

export interface UpdateAdminUserPayload {
  userId: string;
  name: string;
  email: string;
  plan: 'pro' | 'free';
  status: 'active' | 'inactive';
  duration?: '30days' | '6months' | '1year' | 'lifetime' | 'custom';
  customPeriodEnd?: string;
}

export async function updateAdminUserAction(data: UpdateAdminUserPayload) {
  await checkAdminSession();

  const normalizedEmail = data.email.toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório.');
  }

  // 1. Update user info
  await db
    .update(user)
    .set({
      name: data.name.trim(),
      email: normalizedEmail,
      updatedAt: new Date(),
    })
    .where(eq(user.id, data.userId));

  // 2. Update subscription plan
  await applySubscriptionPlan(data.userId, data.plan, data.status, data.duration, data.customPeriodEnd);

  revalidatePath('/admin');
  return { success: true };
}

export async function toggleAdminUserStatusAction(userId: string, newStatus: 'active' | 'inactive') {
  await checkAdminSession();

  const [existingSub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (newStatus === 'inactive') {
    if (existingSub) {
      await db
        .update(subscription)
        .set({
          status: 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(subscription.userId, userId));
    } else {
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        userId,
        status: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } else {
    // Reactivate with 30 days default or keep existing period
    const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const targetEnd = existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > new Date()
      ? existingSub.currentPeriodEnd
      : defaultEnd;

    if (existingSub) {
      await db
        .update(subscription)
        .set({
          status: 'active',
          currentPeriodEnd: targetEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscription.userId, userId));
    } else {
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        userId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: defaultEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function deleteAdminUserAction(userId: string) {
  const session = await checkAdminSession();

  if (session.user.id === userId) {
    throw new Error('Você não pode excluir sua própria conta de administrador.');
  }

  await db.delete(user).where(eq(user.id, userId));

  revalidatePath('/admin');
  return { success: true };
}

// Helper to calculate and apply subscription
async function applySubscriptionPlan(
  userId: string,
  plan: 'pro' | 'free',
  status: 'active' | 'inactive',
  duration?: '30days' | '6months' | '1year' | 'lifetime' | 'custom',
  customPeriodEnd?: string
) {
  const [existingSub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (plan === 'free' || status === 'inactive') {
    const newStatus = status === 'inactive' ? 'inactive' : 'none';
    if (existingSub) {
      await db
        .update(subscription)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(subscription.userId, userId));
    } else {
      await db.insert(subscription).values({
        id: crypto.randomUUID(),
        userId,
        status: newStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return;
  }

  // Calculate Period End for PRO
  let periodEnd: Date;
  if (duration === 'custom' && customPeriodEnd) {
    periodEnd = new Date(customPeriodEnd);
  } else if (duration === '6months') {
    periodEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  } else if (duration === '1year') {
    periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  } else if (duration === 'lifetime') {
    periodEnd = new Date('2099-12-31T23:59:59Z');
  } else {
    // Default 30 days
    periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  if (existingSub) {
    await db
      .update(subscription)
      .set({
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
