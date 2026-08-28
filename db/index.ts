import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://beadforge:postgres@localhost:5432/beadforge_db';

// Configure connection pool with postgres.js
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { schema, client as rawClient };

// Auto-create tables on first request at runtime
let initialized = false;
export async function ensureDbTables() {
  if (initialized || process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    await client.unsafe(`
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

      CREATE TABLE IF NOT EXISTS "subscription" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
        "stripe_customer_id" text,
        "stripe_subscription_id" text UNIQUE,
        "stripe_price_id" text,
        "status" text DEFAULT 'inactive' NOT NULL,
        "current_period_start" timestamp,
        "current_period_end" timestamp,
        "cancel_at_period_end" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "project" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "mode" text DEFAULT '2d' NOT NULL,
        "data" jsonb NOT NULL,
        "thumbnail" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "webhook_event" (
        "id" text PRIMARY KEY NOT NULL,
        "type" text NOT NULL,
        "processed_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    initialized = true;
    console.log('✅ PostgreSQL tables verified/created.');
  } catch (err: any) {
    console.error('DB check note:', err?.message || err);
    throw err;
  }
}
