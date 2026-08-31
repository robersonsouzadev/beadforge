'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { isUserAdmin } from '@/lib/admin';
import { db } from '@/db';
import { user, subscription, project, account, systemConfig, aiGenerationLog } from '@/db/schema';
import { count, eq, desc, and, sql } from 'drizzle-orm';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  isPro: boolean;
  planId: 'studio' | 'pro' | 'free';
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  projectCount: number;
  aiCredits: number;
}

export interface AdminAiConfig {
  activeProvider: 'tripo3d' | 'meshy' | 'replicate' | 'local_neural';
  tripoApiKey: string;
  meshyApiKey: string;
  replicateToken: string;
  defaultAiCredits: number;
  costPerCreditBrl: number;
}

export interface AdminAiLogItem {
  id: string;
  userId?: string | null;
  userName?: string;
  userEmail?: string;
  provider: string;
  modelName: string;
  durationMs: number;
  estimatedCostUsd: number;
  status: string;
  errorMessage?: string | null;
  createdAt: Date;
}

export interface AdminAiStats {
  totalGenerations: number;
  successGenerations: number;
  failedGenerations: number;
  totalCostUsd: number;
  totalCostBrl: number;
  totalCreditsCirculating: number;
  recentLogs: AdminAiLogItem[];
}

export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  studioUsers: number;
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
      aiCredits: user.aiCredits,
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

  let studioCount = 0;
  let proCount = 0;
  let freeCount = 0;

  const usersList: AdminUserItem[] = allUsers.map((u) => {
    const userSub = subMap.get(u.id);
    const now = Date.now();
    const periodEnd = userSub?.currentPeriodEnd ? new Date(userSub.currentPeriodEnd).getTime() : 0;
    const isPeriodValid = periodEnd === 0 || periodEnd + 86_400_000 > now;

    const isActive = (userSub?.status === 'active' || userSub?.status === 'trialing') && isPeriodValid;
    const priceId = (userSub?.stripePriceId || '').toLowerCase();
    const isStudio = isActive && (priceId.includes('studio') || priceId === 'studio');
    const isCreatorPro = isActive && !isStudio;

    let planId: 'studio' | 'pro' | 'free' = 'free';
    if (isStudio) {
      planId = 'studio';
      studioCount++;
    } else if (isCreatorPro) {
      planId = 'pro';
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
      isPro: isActive,
      planId,
      subscriptionStatus: userSub?.status || 'none',
      currentPeriodEnd: userSub?.currentPeriodEnd || null,
      projectCount: projectCountMap.get(u.id) || 0,
      aiCredits: u.aiCredits ?? 5,
    };
  });

  // Calculate estimated Monthly Recurring Revenue (Studio R$ 79,00 + Pro R$ 19,90)
  const estimatedMRR = studioCount * 79.0 + proCount * 19.9;

  return {
    totalUsers: allUsers.length,
    freeUsers: freeCount,
    proUsers: proCount,
    studioUsers: studioCount,
    totalProjects: allProjects.length,
    estimatedMRR,
    users: usersList,
  };
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password?: string;
  plan: 'studio' | 'pro' | 'free';
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
  plan: 'studio' | 'pro' | 'free';
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
  plan: 'studio' | 'pro' | 'free',
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
          stripePriceId: plan === 'free' ? null : existingSub.stripePriceId,
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

  // Calculate Period End for PRO / STUDIO
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
        stripePriceId: plan,
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
      stripePriceId: plan,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Retorna as configurações dinâmicas de IA do sistema
 */
export async function getSystemAiConfig(): Promise<AdminAiConfig> {
  await checkAdminSession();

  try {
    const configs = await db.select().from(systemConfig);
    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    return {
      activeProvider: (configMap.get('ai_active_provider') as any) || 'local_neural',
      tripoApiKey: configMap.get('ai_tripo_key') || process.env.TRIPO3D_API_KEY || '',
      meshyApiKey: configMap.get('ai_meshy_key') || process.env.MESHY_API_KEY || '',
      replicateToken: configMap.get('ai_replicate_token') || process.env.REPLICATE_API_TOKEN || '',
      defaultAiCredits: Number(configMap.get('ai_default_credits') || 5),
      costPerCreditBrl: Number(configMap.get('ai_cost_per_credit_brl') || 2.49),
    };
  } catch (err) {
    console.error('Error fetching AI system config:', err);
    return {
      activeProvider: 'local_neural',
      tripoApiKey: process.env.TRIPO3D_API_KEY || '',
      meshyApiKey: process.env.MESHY_API_KEY || '',
      replicateToken: process.env.REPLICATE_API_TOKEN || '',
      defaultAiCredits: 5,
      costPerCreditBrl: 2.49,
    };
  }
}

/**
 * Atualiza as configurações e chaves de API de IA no banco de dados
 */
export async function updateSystemAiConfigAction(data: Partial<AdminAiConfig>) {
  await checkAdminSession();

  const updates: Array<{ key: string; value: string; description: string }> = [];

  if (data.activeProvider !== undefined) {
    updates.push({
      key: 'ai_active_provider',
      value: data.activeProvider,
      description: 'Provedor de IA 3D padrão ativo',
    });
  }
  if (data.tripoApiKey !== undefined) {
    updates.push({
      key: 'ai_tripo_key',
      value: data.tripoApiKey,
      description: 'Chave de API do Tripo3D',
    });
  }
  if (data.meshyApiKey !== undefined) {
    updates.push({
      key: 'ai_meshy_key',
      value: data.meshyApiKey,
      description: 'Chave de API do Meshy',
    });
  }
  if (data.replicateToken !== undefined) {
    updates.push({
      key: 'ai_replicate_token',
      value: data.replicateToken,
      description: 'Token de API do Replicate (Hunyuan3D)',
    });
  }
  if (data.defaultAiCredits !== undefined) {
    updates.push({
      key: 'ai_default_credits',
      value: String(data.defaultAiCredits),
      description: 'Créditos gratuitos iniciais para novos usuários',
    });
  }
  if (data.costPerCreditBrl !== undefined) {
    updates.push({
      key: 'ai_cost_per_credit_brl',
      value: String(data.costPerCreditBrl),
      description: 'Preço base por crédito em BRL',
    });
  }

  for (const item of updates) {
    const [existing] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, item.key))
      .limit(1);

    if (existing) {
      await db
        .update(systemConfig)
        .set({ value: item.value, description: item.description, updatedAt: new Date() })
        .where(eq(systemConfig.key, item.key));
    } else {
      await db.insert(systemConfig).values({
        key: item.key,
        value: item.value,
        description: item.description,
        updatedAt: new Date(),
      });
    }
  }

  revalidatePath('/admin');
  return { success: true };
}

/**
 * Adiciona ou remove créditos de IA de um usuário
 */
export async function manageUserCreditsAction(userId: string, deltaCredits: number, reason?: string) {
  await checkAdminSession();

  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!targetUser) {
    throw new Error('Usuário não encontrado.');
  }

  const currentCredits = targetUser.aiCredits ?? 0;
  const newCredits = Math.max(0, currentCredits + deltaCredits);

  await db
    .update(user)
    .set({ aiCredits: newCredits, updatedAt: new Date() })
    .where(eq(user.id, userId));

  revalidatePath('/admin');
  return { success: true, newCredits };
}

/**
 * Busca estatísticas completas de IA e logs de auditoria
 */
export async function getAdminAiStats(): Promise<AdminAiStats> {
  await checkAdminSession();

  try {
    const logs = await db
      .select({
        id: aiGenerationLog.id,
        userId: aiGenerationLog.userId,
        provider: aiGenerationLog.provider,
        modelName: aiGenerationLog.modelName,
        durationMs: aiGenerationLog.durationMs,
        estimatedCostUsd: aiGenerationLog.estimatedCostUsd,
        status: aiGenerationLog.status,
        errorMessage: aiGenerationLog.errorMessage,
        createdAt: aiGenerationLog.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(aiGenerationLog)
      .leftJoin(user, eq(aiGenerationLog.userId, user.id))
      .orderBy(desc(aiGenerationLog.createdAt))
      .limit(50);

    const totalGenerations = logs.length;
    const successGenerations = logs.filter((l) => l.status === 'completed').length;
    const failedGenerations = totalGenerations - successGenerations;

    const totalCostUsd = logs.reduce((sum, l) => sum + Number(l.estimatedCostUsd || 0), 0);
    const totalCostBrl = totalCostUsd * 5.65; // Câmbio médio de referência

    // Total de créditos de IA em circulação nas contas dos usuários
    const allUsers = await db.select({ aiCredits: user.aiCredits }).from(user);
    const totalCreditsCirculating = allUsers.reduce((sum, u) => sum + (u.aiCredits ?? 0), 0);

    return {
      totalGenerations,
      successGenerations,
      failedGenerations,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      totalCostBrl: Number(totalCostBrl.toFixed(2)),
      totalCreditsCirculating,
      recentLogs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.userName || 'Visitante/Anônimo',
        userEmail: l.userEmail || '-',
        provider: l.provider,
        modelName: l.modelName,
        durationMs: l.durationMs,
        estimatedCostUsd: Number(l.estimatedCostUsd || 0),
        status: l.status,
        errorMessage: l.errorMessage,
        createdAt: l.createdAt,
      })),
    };
  } catch (err) {
    console.error('Error fetching AI logs:', err);
    return {
      totalGenerations: 0,
      successGenerations: 0,
      failedGenerations: 0,
      totalCostUsd: 0,
      totalCostBrl: 0,
      totalCreditsCirculating: 0,
      recentLogs: [],
    };
  }
}

/**
 * Retorna dados consolidados para o Dashboard Completo
 */
export async function getAdminFullDashboardData() {
  const stats = await getAdminData();
  const aiConfig = await getSystemAiConfig();
  const aiStats = await getAdminAiStats();

  const allProjects = await db.select({ mode: project.mode }).from(project);
  const projects2DCount = allProjects.filter((p) => p.mode !== 'ultra').length;
  const projects3DCount = allProjects.filter((p) => p.mode === 'ultra').length;

  return {
    stats,
    aiStats,
    aiConfig,
    projects2DCount,
    projects3DCount,
  };
}
