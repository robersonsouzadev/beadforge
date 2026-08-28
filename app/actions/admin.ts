'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isUserAdmin } from '@/lib/admin';
import { db } from '@/db';
import { user, subscription, project } from '@/db/schema';
import { count, eq, desc, inArray } from 'drizzle-orm';

export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  totalProjects: number;
  estimatedMRR: number;
  users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    isPro: boolean;
    subscriptionStatus: string;
    currentPeriodEnd: Date | null;
    projectCount: number;
  }>;
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
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  // 2. Get all subscriptions
  const allSubscriptions = await db.select().from(subscription);
  const subMap = new Map(allSubscriptions.map((s) => [s.userId, s]));

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

  const usersList = allUsers.map((u) => {
    const userSub = subMap.get(u.id);
    const isPro =
      userSub?.status === 'active' || userSub?.status === 'trialing';

    if (isPro) {
      proCount++;
    } else {
      freeCount++;
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
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
