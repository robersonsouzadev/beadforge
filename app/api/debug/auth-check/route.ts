import { NextResponse } from 'next/server';
import { ensureDbTables } from '@/db';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { user, account, subscription } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de diagnóstico — /api/debug/auth-check
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

  try {
    // 1. ensureDbTables
    await ensureDbTables();
    diag.ensureDbTables = 'OK';
  } catch (err: any) {
    diag.ensureDbTables = `ERROR: ${err.message}`;
  }

  try {
    // 2. Check if issuer column exists
    const cols = await db.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'account' ORDER BY ordinal_position`
    );
    // drizzle postgres-js returns array-like
    const colNames = Array.from(cols as any).map((c: any) => c.column_name);
    diag.accountColumns = colNames;
    diag.issuerColumnExists = colNames.includes('issuer');
  } catch (err: any) {
    diag.issuerColumnCheck = `ERROR: ${err.message}`;
  }

  try {
    // 3. Admin user via Drizzle
    const adminUsers = await db
      .select({ id: user.id, email: user.email, role: user.role })
      .from(user)
      .where(eq(user.email, 'robersonsouza@outlook.com'))
      .limit(1);
    diag.adminUser = adminUsers.length > 0 ? adminUsers[0] : 'NOT FOUND';
  } catch (err: any) {
    diag.adminUser = `ERROR: ${err.message}`;
  }

  try {
    // 4. ALL account records (raw SQL to see issuer state)
    const accounts = await db.execute(
      sql`SELECT id, account_id, provider_id, issuer, user_id,
          CASE WHEN password IS NOT NULL THEN LENGTH(password)::text ELSE 'NULL' END as password_length,
          created_at
          FROM account LIMIT 20`
    );
    diag.accountRecords = Array.from(accounts as any);
  } catch (err: any) {
    diag.accountRecords = `ERROR: ${err.message}`;
  }

  try {
    // 5. Admin accounts specifically
    const adminAccounts = await db.execute(
      sql`SELECT a.id, a.account_id, a.provider_id, a.issuer, a.user_id,
          CASE WHEN a.password IS NOT NULL THEN LENGTH(a.password)::text ELSE 'NULL' END as password_length
          FROM account a JOIN "user" u ON a.user_id = u.id
          WHERE u.email = 'robersonsouza@outlook.com'`
    );
    diag.adminAccounts = Array.from(adminAccounts as any);
  } catch (err: any) {
    diag.adminAccounts = `ERROR: ${err.message}`;
  }

  try {
    // 6. Counts
    const users = await db.execute(sql`SELECT COUNT(*)::int as c FROM "user"`);
    const accts = await db.execute(sql`SELECT COUNT(*)::int as c FROM account`);
    const subs = await db.execute(sql`SELECT COUNT(*)::int as c FROM subscription`);
    diag.counts = {
      users: (Array.from(users as any)[0] as any)?.c,
      accounts: (Array.from(accts as any)[0] as any)?.c,
      subscriptions: (Array.from(subs as any)[0] as any)?.c,
    };
  } catch (err: any) {
    diag.counts = `ERROR: ${err.message}`;
  }

  return NextResponse.json(diag, { status: 200 });
}
