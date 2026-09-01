import { pgTable, text, timestamp, boolean, jsonb, integer, numeric } from 'drizzle-orm/pg-core';

// ── Better Auth Tables ──

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  aiCredits: integer('ai_credits').notNull().default(5),
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

export const client = pgTable('client', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'), // WhatsApp
  instagram: text('instagram'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const order = pgTable('order', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => client.id, { onDelete: 'set null' }),
  projectId: text('project_id').references(() => project.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  // 'draft' | 'quoted' | 'pending_approval' | 'approved' | 'in_production' | 'completed' | 'delivered' | 'cancelled'
  quotedPriceBrl: numeric('quoted_price_brl', { precision: 10, scale: 2 }),
  materialCostBrl: numeric('material_cost_brl', { precision: 10, scale: 2 }),
  laborCostBrl: numeric('labor_cost_brl', { precision: 10, scale: 2 }),
  finalPriceBrl: numeric('final_price_brl', { precision: 10, scale: 2 }),
  channel: text('channel').default('direct'), // 'direct' | 'shopee' | 'mercadolivre' | 'elo7' | 'whatsapp'
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const approval = pgTable('approval', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => order.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(), // UUID para URL pública
  patternSnapshot: jsonb('pattern_snapshot').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  status: text('status').notNull().default('pending'),
  // 'pending' | 'approved' | 'revision_requested'
  revisionCount: integer('revision_count').default(0),
  maxRevisions: integer('max_revisions').default(3),
  clientComment: text('client_comment'),
  respondedAt: timestamp('responded_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Organic Acquisition & SEO (Phase 3) ──

export const galleryPattern = pgTable('gallery_pattern', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => project.id, { onDelete: 'set null' }),
  slug: text('slug').notNull().unique(), // URL amigável SEO
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull().default('geek'), // 'games' | 'anime' | 'geek' | 'cartoons' | 'decor' | 'animals' | 'other'
  thumbnailUrl: text('thumbnail_url'),
  patternData: jsonb('pattern_data').notNull(), // grid, summary, palette
  beadCount: integer('bead_count').notNull().default(0),
  colorCount: integer('color_count').notNull().default(0),
  paletteName: text('palette_name'),
  dimensions: text('dimensions').default('29x29'),
  likesCount: integer('likes_count').notNull().default(0),
  remixCount: integer('remix_count').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  isValidated3D: boolean('is_validated_3d').notNull().default(false),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const creatorProfile = pgTable('creator_profile', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(), // ex: "ateliegeek"
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  shopUrl: text('shop_url'), // Shopee / Elo7 / ML
  instagramHandle: text('instagram_handle'),
  whatsappNumber: text('whatsapp_number'),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const systemConfig = pgTable('system_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const aiGenerationLog = pgTable('ai_generation_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(), // 'tripo3d' | 'meshy' | 'replicate' | 'local_neural'
  modelName: text('model_name').notNull(),
  durationMs: integer('duration_ms').notNull().default(0),
  estimatedCostUsd: numeric('estimated_cost_usd', { precision: 10, scale: 4 }).notNull().default('0.0000'),
  status: text('status').notNull().default('completed'), // 'completed' | 'failed'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Commerce & Affiliate Partner Tables ──

export const affiliateMerchant = pgTable('affiliate_merchant', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // 'Shopee Brasil', 'Mercado Livre', 'Amazon Brasil'
  slug: text('slug').notNull().unique(), // 'shopee', 'mercadolivre', 'amazon'
  programType: text('program_type').notNull().default('shopee_affiliate'), // 'shopee_affiliate' | 'ml_affiliate' | 'amazon_associates' | 'direct_partner'
  baseUrl: text('base_url'),
  affiliateId: text('affiliate_id'),
  commissionPct: numeric('commission_pct', { precision: 5, scale: 2 }).default('8.00'),
  cookieDurationDays: integer('cookie_duration_days').default(7),
  hasApi: boolean('has_api').default(false),
  apiConfig: jsonb('api_config'),
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const affiliateProduct = pgTable('affiliate_product', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => affiliateMerchant.id, { onDelete: 'cascade' }),
  externalSku: text('external_sku'),
  title: text('title').notNull(),
  url: text('url').notNull(),
  affiliateUrl: text('affiliate_url'),
  brand: text('brand').notNull().default('pindoo'), // 'pindoo' | 'hama' | 'artkal' | 'perler' | 'generic'
  beadSize: text('bead_size').notNull().default('2.6mm'), // '2.6mm' | '5.0mm'
  colorCode: text('color_code'), // 'A1', 'H10', etc. (null se for kit)
  colorHex: text('color_hex'),
  quantityPerPack: integer('quantity_per_pack').notNull().default(1000),
  priceBrl: numeric('price_brl', { precision: 10, scale: 2 }).notNull().default('14.90'),
  pricePerBead: numeric('price_per_bead', { precision: 10, scale: 4 }).notNull().default('0.0149'),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('4.80'),
  reviewCount: integer('review_count').default(120),
  isAvailable: boolean('is_available').notNull().default(true),
  productType: text('product_type').notNull().default('single_color'), // 'single_color' | 'kit' | 'accessory' | 'pegboard'
  imageUrl: text('image_url'),
  estimatedShippingDays: integer('estimated_shipping_days').default(5),
  lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const affiliateClick = pgTable('affiliate_click', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  productId: text('product_id')
    .notNull()
    .references(() => affiliateProduct.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => project.id, { onDelete: 'set null' }),
  colorCode: text('color_code'),
  source: text('source').notNull().default('bom_panel'), // 'bom_panel' | 'shopping_modal' | 'inventory_alert' | 'gallery' | 'landing_page'
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
export type Client = typeof client.$inferSelect;
export type NewClient = typeof client.$inferInsert;
export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;
export type Approval = typeof approval.$inferSelect;
export type NewApproval = typeof approval.$inferInsert;
export type GalleryPattern = typeof galleryPattern.$inferSelect;
export type NewGalleryPattern = typeof galleryPattern.$inferInsert;
export type CreatorProfile = typeof creatorProfile.$inferSelect;
export type NewCreatorProfile = typeof creatorProfile.$inferInsert;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;
export type AiGenerationLog = typeof aiGenerationLog.$inferSelect;
export type NewAiGenerationLog = typeof aiGenerationLog.$inferInsert;
export type AffiliateMerchant = typeof affiliateMerchant.$inferSelect;
export type NewAffiliateMerchant = typeof affiliateMerchant.$inferInsert;
export type AffiliateProduct = typeof affiliateProduct.$inferSelect;
export type NewAffiliateProduct = typeof affiliateProduct.$inferInsert;
export type AffiliateClick = typeof affiliateClick.$inferSelect;
export type NewAffiliateClick = typeof affiliateClick.$inferInsert;


