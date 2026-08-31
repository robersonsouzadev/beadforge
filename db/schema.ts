import { pgTable, text, timestamp, boolean, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

// ── Better Auth Tables ──

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  issuer: text('issuer'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ── SaaS Business Tables ──

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull().default('inactive'), // active, trialing, past_due, canceled, unpaid, inactive
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const project = pgTable('project', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mode: text('mode').notNull().default('2d'), // '2d' | 'ultra'
  data: jsonb('data').notNull(),
  thumbnail: text('thumbnail'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const webhookEvent = pgTable('webhook_event', {
  id: text('id').primaryKey(), // Stripe event ID (ex: evt_123456)
  type: text('type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
});

// ── Seller & Studio Business Tables ──

export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('Meu Estoque Principal'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const inventoryItem = pgTable('inventory_item', {
  id: text('id').primaryKey(),
  inventoryId: text('inventory_id')
    .notNull()
    .references(() => inventory.id, { onDelete: 'cascade' }),
  brand: text('brand').notNull().default('pindoo'), // 'hama' | 'artkal' | 'pindoo' | 'perler' | 'other'
  colorCode: text('color_code').notNull(),
  colorName: text('color_name').notNull(),
  colorHex: text('color_hex').notNull(),
  quantity: integer('quantity').notNull().default(0),
  unitCostBrl: numeric('unit_cost_brl', { precision: 10, scale: 4 }).default('0.0150'),
  size: text('size').notNull().default('midi'), // 'midi' | 'mini'
  lowStockThreshold: integer('low_stock_threshold').default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const costConfig = pgTable('cost_config', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  laborRatePerHourBrl: numeric('labor_rate_brl', { precision: 10, scale: 2 }).default('25.00'),
  averageBeadsPerHour: integer('average_beads_per_hour').default(600),
  wastePct: numeric('waste_pct', { precision: 5, scale: 2 }).default('10.00'),
  packagingCostBrl: numeric('packaging_cost_brl', { precision: 10, scale: 2 }).default('5.00'),
  overheadMonthlyBrl: numeric('overhead_monthly_brl', { precision: 10, scale: 2 }).default('50.00'),
  defaultMarginPct: numeric('default_margin_pct', { precision: 5, scale: 2 }).default('35.00'),
  defaultChannelFeePct: numeric('channel_fee_pct', { precision: 5, scale: 2 }).default('14.00'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Subscription = typeof subscription.$inferSelect;
export type Project = typeof project.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type InventoryItem = typeof inventoryItem.$inferSelect;
export type NewInventoryItem = typeof inventoryItem.$inferInsert;
export type CostConfig = typeof costConfig.$inferSelect;
export type NewCostConfig = typeof costConfig.$inferInsert;
