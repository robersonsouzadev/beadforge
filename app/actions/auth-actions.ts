'use server';

import { db } from '@/db';
import { user, account, subscription } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { isUserAdmin } from '@/lib/admin';
import { hashPassword } from 'better-auth/crypto';

/**
 * Permite ao Administrador sincronizar/redefinir sua senha diretamente
 */
export async function syncAdminCredentialsAction(email: string, password: string, name?: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (!isUserAdmin(normalizedEmail)) {
    throw new Error('Ação permitida apenas para emails administrativos.');
  }

  if (password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }

  const hashedPassword = await hashPassword(password);

  // 1. Localizar ou criar usuário
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  let userId: string;

  if (!existingUser) {
    userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name: name || 'Roberson Souza',
      email: normalizedEmail,
      emailVerified: true,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    userId = existingUser.id;
    await db
      .update(user)
      .set({
        name: name || existingUser.name,
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }

  // 2. Atualizar ou Criar Conta de Credenciais (Senha)
  const [existingAccount] = await db
    .select()
    .from(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, 'credential')
      )
    )
    .limit(1);

  if (!existingAccount) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      issuer: 'local:credential',
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(account)
      .set({
        password: hashedPassword,
        issuer: 'local:credential',
        accountId: userId,
        updatedAt: new Date(),
      })
      .where(eq(account.id, existingAccount.id));
  }

  // 3. Garantir assinatura Studio vitalícia
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
      stripePriceId: 'studio',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else if (existingSub.status !== 'active') {
    await db
      .update(subscription)
      .set({ status: 'active', stripePriceId: 'studio', updatedAt: new Date() })
      .where(eq(subscription.id, existingSub.id));
  }

  return { success: true };
}
