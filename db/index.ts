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

// Auto-create and migrate tables on first request at runtime
export async function ensureDbTables() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" boolean DEFAULT false NOT NULL,
        "image" text,
        "role" text DEFAULT 'user' NOT NULL,
        "ai_credits" integer DEFAULT 5 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ai_credits" integer DEFAULT 5 NOT NULL;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;

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

      CREATE TABLE IF NOT EXISTS "inventory" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "name" text DEFAULT 'Meu Estoque Principal' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "inventory_item" (
        "id" text PRIMARY KEY NOT NULL,
        "inventory_id" text NOT NULL REFERENCES "inventory"("id") ON DELETE CASCADE,
        "brand" text DEFAULT 'pindoo' NOT NULL,
        "color_code" text NOT NULL,
        "color_name" text NOT NULL,
        "color_hex" text NOT NULL,
        "quantity" integer DEFAULT 0 NOT NULL,
        "unit_cost_brl" numeric(10,4) DEFAULT '0.0150',
        "size" text DEFAULT 'midi' NOT NULL,
        "low_stock_threshold" integer DEFAULT 100,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "cost_config" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
        "labor_rate_brl" numeric(10,2) DEFAULT '25.00',
        "average_beads_per_hour" integer DEFAULT 600,
        "waste_pct" numeric(5,2) DEFAULT '10.00',
        "packaging_cost_brl" numeric(10,2) DEFAULT '5.00',
        "overhead_monthly_brl" numeric(10,2) DEFAULT '50.00',
        "default_margin_pct" numeric(5,2) DEFAULT '35.00',
        "channel_fee_pct" numeric(5,2) DEFAULT '14.00',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "client" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "email" text,
        "phone" text,
        "instagram" text,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "order" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "client_id" text REFERENCES "client"("id") ON DELETE SET NULL,
        "project_id" text REFERENCES "project"("id") ON DELETE SET NULL,
        "title" text NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "quoted_price_brl" numeric(10,2),
        "material_cost_brl" numeric(10,2),
        "labor_cost_brl" numeric(10,2),
        "final_price_brl" numeric(10,2),
        "channel" text DEFAULT 'direct',
        "due_date" timestamp,
        "completed_at" timestamp,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "approval" (
        "id" text PRIMARY KEY NOT NULL,
        "order_id" text NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
        "token" text NOT NULL UNIQUE,
        "pattern_snapshot" jsonb NOT NULL,
        "thumbnail_url" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "revision_count" integer DEFAULT 0,
        "max_revisions" integer DEFAULT 3,
        "client_comment" text,
        "responded_at" timestamp,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "gallery_pattern" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "project_id" text REFERENCES "project"("id") ON DELETE SET NULL,
        "slug" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "description" text,
        "category" text DEFAULT 'geek' NOT NULL,
        "thumbnail_url" text,
        "pattern_data" jsonb NOT NULL,
        "bead_count" integer DEFAULT 0 NOT NULL,
        "color_count" integer DEFAULT 0 NOT NULL,
        "palette_name" text,
        "dimensions" text DEFAULT '29x29',
        "likes_count" integer DEFAULT 0 NOT NULL,
        "remix_count" integer DEFAULT 0 NOT NULL,
        "is_published" boolean DEFAULT true NOT NULL,
        "is_validated_3d" boolean DEFAULT false NOT NULL,
        "published_at" timestamp DEFAULT now() NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "creator_profile" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
        "handle" text NOT NULL UNIQUE,
        "display_name" text NOT NULL,
        "bio" text,
        "avatar_url" text,
        "shop_url" text,
        "instagram_handle" text,
        "whatsapp_number" text,
        "is_public" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "system_config" (
        "key" text PRIMARY KEY NOT NULL,
        "value" text NOT NULL,
        "description" text,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "ai_generation_log" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
        "provider" text NOT NULL,
        "model_name" text NOT NULL,
        "duration_ms" integer DEFAULT 0 NOT NULL,
        "estimated_cost_usd" numeric(10,4) DEFAULT '0.0000',
        "status" text DEFAULT 'completed' NOT NULL,
        "error_message" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "affiliate_merchant" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "program_type" text DEFAULT 'ml_affiliate' NOT NULL,
        "base_url" text,
        "affiliate_id" text,
        "default_campaign_tag" text DEFAULT 'beadforgekits',
        "commission_pct" numeric(5,2) DEFAULT '12.00',
        "cookie_duration_days" integer DEFAULT 1,
        "has_api" boolean DEFAULT false,
        "api_config" jsonb,
        "is_active" boolean DEFAULT true NOT NULL,
        "priority" integer DEFAULT 10 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      ALTER TABLE "affiliate_merchant" ADD COLUMN IF NOT EXISTS "default_campaign_tag" text DEFAULT 'beadforgekits';

      CREATE TABLE IF NOT EXISTS "affiliate_category" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "parent_id" text,
        "description" text,
        "icon" text DEFAULT 'Package',
        "display_order" integer DEFAULT 0 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "affiliate_product" (
        "id" text PRIMARY KEY NOT NULL,
        "merchant_id" text NOT NULL REFERENCES "affiliate_merchant"("id") ON DELETE CASCADE,
        "category_id" text REFERENCES "affiliate_category"("id") ON DELETE SET NULL,
        "external_sku" text,
        "title" text NOT NULL,
        "short_description" text,
        "url" text NOT NULL,
        "affiliate_url" text,
        "campaign_tag" text DEFAULT 'beadforgekits',
        "brand" text DEFAULT 'generic' NOT NULL,
        "bead_size" text DEFAULT '2.6mm' NOT NULL,
        "color_code" text,
        "color_hex" text,
        "quantity_per_pack" integer DEFAULT 10000 NOT NULL,
        "color_count" integer DEFAULT 1 NOT NULL,
        "price_brl" numeric(10,2) DEFAULT '29.96' NOT NULL,
        "previous_price_brl" numeric(10,2),
        "price_per_bead" numeric(10,4) DEFAULT '0.0030' NOT NULL,
        "price_varies" boolean DEFAULT false NOT NULL,
        "price_last_checked_at" timestamp DEFAULT now() NOT NULL,
        "currency" text DEFAULT 'BRL' NOT NULL,
        "rating" numeric(3,2) DEFAULT '4.85',
        "review_count" integer DEFAULT 140,
        "seller_name" text,
        "is_available" boolean DEFAULT true NOT NULL,
        "product_type" text DEFAULT 'multi_color_kit' NOT NULL,
        "badge_tag" text,
        "estimated_commission_pct" numeric(5,2) DEFAULT '12.00',
        "priority_score" integer DEFAULT 10 NOT NULL,
        "specs_json" jsonb,
        "image_url" text,
        "estimated_shipping_days" integer DEFAULT 3,
        "last_updated_at" timestamp DEFAULT now() NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "category_id" text;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "short_description" text;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "campaign_tag" text DEFAULT 'beadforgekits';
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "color_count" integer DEFAULT 1 NOT NULL;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "previous_price_brl" numeric(10,2);
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "price_varies" boolean DEFAULT false NOT NULL;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "price_last_checked_at" timestamp DEFAULT now() NOT NULL;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'BRL' NOT NULL;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "seller_name" text;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "badge_tag" text;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "estimated_commission_pct" numeric(5,2) DEFAULT '12.00';
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "priority_score" integer DEFAULT 10 NOT NULL;
      ALTER TABLE "affiliate_product" ADD COLUMN IF NOT EXISTS "specs_json" jsonb;

      CREATE TABLE IF NOT EXISTS "affiliate_product_color" (
        "id" text PRIMARY KEY NOT NULL,
        "product_id" text NOT NULL REFERENCES "affiliate_product"("id") ON DELETE CASCADE,
        "internal_color_code" text NOT NULL,
        "brand_color_code" text,
        "color_name" text NOT NULL,
        "color_hex" text NOT NULL,
        "estimated_quantity" integer DEFAULT 400,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "affiliate_click" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
        "product_id" text NOT NULL REFERENCES "affiliate_product"("id") ON DELETE CASCADE,
        "merchant_id" text REFERENCES "affiliate_merchant"("id") ON DELETE SET NULL,
        "project_id" text REFERENCES "project"("id") ON DELETE SET NULL,
        "color_code" text,
        "source" text DEFAULT 'shopping_modal' NOT NULL,
        "campaign_tag" text DEFAULT 'beadforgekits',
        "user_agent" text,
        "ip_address" text,
        "referrer" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      ALTER TABLE "affiliate_click" ADD COLUMN IF NOT EXISTS "merchant_id" text;
      ALTER TABLE "affiliate_click" ADD COLUMN IF NOT EXISTS "campaign_tag" text DEFAULT 'beadforgekits';
      ALTER TABLE "affiliate_click" ADD COLUMN IF NOT EXISTS "referrer" text;

      CREATE TABLE IF NOT EXISTS "affiliate_event" (
        "id" text PRIMARY KEY NOT NULL,
        "event_type" text NOT NULL,
        "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
        "product_id" text REFERENCES "affiliate_product"("id") ON DELETE CASCADE,
        "project_id" text REFERENCES "project"("id") ON DELETE SET NULL,
        "source" text DEFAULT 'shopping_modal' NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "idx_affiliate_prod_match" ON "affiliate_product"("brand", "color_code", "bead_size");
      CREATE INDEX IF NOT EXISTS "idx_affiliate_prod_type" ON "affiliate_product"("product_type", "bead_size", "is_active");
      CREATE INDEX IF NOT EXISTS "idx_affiliate_click_prod" ON "affiliate_click"("product_id", "created_at");
    `);
    console.log('✅ PostgreSQL tables and columns verified/created.');
  } catch (err: any) {
    console.error('DB check note:', err?.message || err);
    throw err;
  }
}
