import { NextResponse } from 'next/server';
import { ensureDbTables, rawClient } from '@/db';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de diagnóstico — /api/debug/auth-check
 * Usa o raw client do postgres.js diretamente para evitar problemas com Drizzle.
 * REMOVER APÓS RESOLVER O BUG.
 */
export async function GET() {
  const diag: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.substring(0, 30)}...***`
      : 'NOT SET',
    betterAuthUrl: process.env.BETTER_AUTH_URL || 'NOT SET',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET ? 'SET' : 'NOT SET',
  };

  // 1. ensureDbTables
  try {
    await ensureDbTables();
    diag.step1_ensureDbTables = 'OK';
  } catch (err: any) {
    diag.step1_ensureDbTables = `ERROR: ${err.message}`;
  }

  // 2. Basic connectivity test
  try {
    const res = await rawClient`SELECT 1 as test`;
    diag.step2_connectivity = `OK: ${JSON.stringify(res)}`;
  } catch (err: any) {
    diag.step2_connectivity = `ERROR: ${err.message}`;
    // If we can't even run SELECT 1, return early
    return NextResponse.json(diag, { status: 200 });
  }

  // 3. List all tables
  try {
    const tables = await rawClient`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    diag.step3_tables = tables.map((t: any) => t.tablename);
  } catch (err: any) {
    diag.step3_tables = `ERROR: ${err.message}`;
  }

  // 4. Account table columns
  try {
    const cols = await rawClient`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'account' 
      ORDER BY ordinal_position
    `;
    diag.step4_accountColumns = cols.map((c: any) => c.column_name);
    diag.step4_issuerExists = cols.some((c: any) => c.column_name === 'issuer');
  } catch (err: any) {
    diag.step4_accountColumns = `ERROR: ${err.message}`;
  }

  // 5. User count and admin user
  try {
    const users = await rawClient`SELECT COUNT(*)::int as count FROM "user"`;
    diag.step5_userCount = users[0]?.count;
  } catch (err: any) {
    diag.step5_userCount = `ERROR: ${err.message}`;
  }

  try {
    const admin = await rawClient`
      SELECT id, email, role, created_at FROM "user" 
      WHERE email = 'robersonsouza@outlook.com' LIMIT 1
    `;
    diag.step5_adminUser = admin.length > 0 ? admin[0] : 'NOT FOUND';
  } catch (err: any) {
    diag.step5_adminUser = `ERROR: ${err.message}`;
  }

  // 6. Account records (ALL)
  try {
    const accounts = await rawClient`
      SELECT id, account_id, provider_id, issuer, user_id,
        CASE WHEN password IS NOT NULL THEN LENGTH(password)::text ELSE 'NULL' END as password_length,
        created_at
      FROM account LIMIT 20
    `;
    diag.step6_allAccounts = accounts;
  } catch (err: any) {
    diag.step6_allAccounts = `ERROR: ${err.message}`;
  }

  // 7. Admin's account records
  try {
    const adminAccounts = await rawClient`
      SELECT a.id, a.account_id, a.provider_id, a.issuer, a.user_id,
        CASE WHEN a.password IS NOT NULL THEN LENGTH(a.password)::text ELSE 'NULL' END as password_length
      FROM account a JOIN "user" u ON a.user_id = u.id
      WHERE u.email = 'robersonsouza@outlook.com'
    `;
    diag.step7_adminAccounts = adminAccounts;
  } catch (err: any) {
    diag.step7_adminAccounts = `ERROR: ${err.message}`;
  }

  // 8. Subscription count
  try {
    const subs = await rawClient`SELECT COUNT(*)::int as count FROM subscription`;
    diag.step8_subscriptionCount = subs[0]?.count;
  } catch (err: any) {
    diag.step8_subscriptionCount = `ERROR: ${err.message}`;
  }

  return NextResponse.json(diag, { status: 200 });
}
