import { NextResponse } from 'next/server';
import { ensureDbTables } from '@/db';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de diagnóstico temporário — /api/debug/auth-check
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

  const connStr =
    process.env.DATABASE_URL ||
    'postgres://beadforge:postgres@localhost:5432/beadforge_db';

  let client: ReturnType<typeof postgres> | null = null;

  try {
    client = postgres(connStr, { max: 1, connect_timeout: 5 });

    // 1. ensureDbTables
    try {
      await ensureDbTables();
      diag.ensureDbTables = 'OK';
    } catch (err: any) {
      diag.ensureDbTables = `ERROR: ${err.message}`;
    }

    // 2. Check issuer column
    const cols = await client`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'account' 
      ORDER BY ordinal_position
    `;
    diag.accountColumns = cols.map((c: any) => c.column_name);
    diag.issuerColumnExists = cols.some((c: any) => c.column_name === 'issuer');

    // 3. Admin user
    const adminUsers = await client`
      SELECT id, email, role, created_at FROM "user" 
      WHERE email = 'robersonsouza@outlook.com' LIMIT 1
    `;
    diag.adminUser = adminUsers.length > 0 ? adminUsers[0] : 'NOT FOUND';

    // 4. Account records
    const accounts = await client`
      SELECT id, account_id, provider_id, issuer, user_id,
        CASE WHEN password IS NOT NULL THEN LENGTH(password)::text ELSE 'NULL' END as password_length,
        created_at
      FROM account LIMIT 20
    `;
    diag.accountRecords = accounts;

    // 5. Admin accounts specifically
    if (adminUsers.length > 0) {
      const adminId = adminUsers[0].id;
      const adminAccounts = await client`
        SELECT id, account_id, provider_id, issuer, user_id,
          CASE WHEN password IS NOT NULL THEN LENGTH(password)::text ELSE 'NULL' END as password_length
        FROM account WHERE user_id = ${adminId}
      `;
      diag.adminAccounts = adminAccounts;
    }

    // 6. Counts
    const userCount = await client`SELECT COUNT(*) as count FROM "user"`;
    const acctCount = await client`SELECT COUNT(*) as count FROM account`;
    const subCount = await client`SELECT COUNT(*) as count FROM subscription`;
    diag.counts = {
      users: userCount[0]?.count,
      accounts: acctCount[0]?.count,
      subscriptions: subCount[0]?.count,
    };

    await client.end();
  } catch (err: any) {
    diag.dbError = err.message;
    if (client) await client.end().catch(() => {});
  }

  return NextResponse.json(diag, { status: 200 });
}
