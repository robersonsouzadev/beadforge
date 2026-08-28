/**
 * E2E Test: Verifica que o fluxo signUpEmail + signInEmail funciona
 * com a coluna `issuer` presente no schema do account.
 *
 * Roda com: npx tsx tests/e2e/auth-flow.test.ts
 *
 * Requer PostgreSQL acessível em DATABASE_URL.
 * Se não houver, imprime um aviso e sai com sucesso.
 */

import { describe, it, expect } from 'vitest';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://beadforge:beadforge_secure_pass_2026@localhost:5432/beadforge_db';

describe('Auth Flow E2E', () => {
  it('handles auth workflow when database is present', async () => {
    let client: ReturnType<typeof postgres>;
    try {
      client = postgres(DATABASE_URL, { max: 2, connect_timeout: 2 });
      await client`SELECT 1`;
    } catch {
      console.log('⚠️  PostgreSQL não acessível, pulando teste E2E de auth.');
      return;
    }

  const db = drizzle(client!, { schema });

  // Ensure tables exist
  await client!`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL UNIQUE,
      "email_verified" boolean DEFAULT false NOT NULL,
      "image" text,
      "role" text DEFAULT 'user' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY NOT NULL,
      "expires_at" timestamp NOT NULL,
      "token" text NOT NULL UNIQUE,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      "ip_address" text,
      "user_agent" text,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY NOT NULL,
      "account_id" text NOT NULL,
      "provider_id" text NOT NULL,
      "issuer" text,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "access_token" text,
      "refresh_token" text,
      "id_token" text,
      "access_token_expires_at" timestamp,
      "refresh_token_expires_at" timestamp,
      "scope" text,
      "password" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
    ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text;
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY NOT NULL,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expires_at" timestamp NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `;

  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    baseURL: 'http://localhost:3000',
    emailAndPassword: { enabled: true },
    session: { cookieCache: { enabled: false } },
  });

  const testEmail = `e2e_test_${Date.now()}@beadforge.test`;
  const testPassword = 'TestPass_12345!';
  const testName = 'E2E Test User';

  console.log('\n=== E2E Auth Flow Test ===\n');

  // ── STEP 1: Sign Up ──
  console.log('1️⃣  Registrando usuário...');
  const signUpRes = await auth.api.signUpEmail({
    body: { name: testName, email: testEmail, password: testPassword },
  });

  if (!signUpRes?.user?.id) {
    console.error('❌ FALHA no signUp: nenhum user.id retornado');
    process.exit(1);
  }
  console.log(`   ✅ Usuário criado: ${signUpRes.user.id} / ${signUpRes.user.email}`);

  // ── STEP 2: Verify issuer in account table ──
  console.log('2️⃣  Verificando coluna issuer na tabela account...');
  const [acct] = await db
    .select()
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, signUpRes.user.id),
        eq(schema.account.providerId, 'credential')
      )
    )
    .limit(1);

  if (!acct) {
    console.error('❌ FALHA: nenhum registro em account para o usuário');
    process.exit(1);
  }

  if (acct.issuer !== 'local:credential') {
    console.error(`❌ FALHA: account.issuer = "${acct.issuer}" (esperado: "local:credential")`);
    process.exit(1);
  }
  console.log(`   ✅ account.issuer = "${acct.issuer}" ✓`);
  console.log(`   ✅ account.providerId = "${acct.providerId}" ✓`);
  console.log(`   ✅ account.accountId = "${acct.accountId}" ✓`);
  console.log(`   ✅ account.password hash presente (${acct.password?.length} chars) ✓`);

  // ── STEP 3: Sign In ──
  console.log('3️⃣  Tentando fazer login com email/senha...');
  try {
    const signInRes = await auth.api.signInEmail({
      body: { email: testEmail, password: testPassword },
    });

    if (!signInRes?.user?.id) {
      console.error('❌ FALHA no signIn: nenhum user.id retornado');
      process.exit(1);
    }
    console.log(`   ✅ Login bem-sucedido! user.id = ${signInRes.user.id}`);
    console.log(`   ✅ Token presente = ${!!signInRes.token}`);
  } catch (err: any) {
    console.error(`❌ FALHA no signIn: ${err.message || err}`);
    process.exit(1);
  }

  // ── STEP 4: Wrong password should fail ──
  console.log('4️⃣  Verificando que senha errada é rejeitada...');
  try {
    await auth.api.signInEmail({
      body: { email: testEmail, password: 'WrongPassword999' },
    });
    console.error('❌ FALHA: login com senha errada deveria ter sido rejeitado');
    process.exit(1);
  } catch (err: any) {
    console.log('   ✅ Senha errada corretamente rejeitada ✓');
  }

  // ── CLEANUP ──
  console.log('5️⃣  Limpando dados de teste...');
  await db.delete(schema.account).where(eq(schema.account.userId, signUpRes.user.id));
  await db.delete(schema.session).where(eq(schema.session.userId, signUpRes.user.id));
  await db.delete(schema.user).where(eq(schema.user.id, signUpRes.user.id));
  console.log('   ✅ Dados de teste removidos');

  console.log('\n🎉 TODOS OS TESTES E2E DE AUTH PASSARAM!\n');
  await client!.end();
  });
});
