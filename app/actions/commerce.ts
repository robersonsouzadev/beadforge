'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db, ensureDbTables } from '@/db';
import {
  affiliateMerchant,
  affiliateCategory,
  affiliateProduct,
  affiliateProductColor,
  affiliateClick,
  affiliateEvent,
  user,
} from '@/db/schema';
import { eq, desc, and, sql, ilike, inArray } from 'drizzle-orm';
import { isUserAdmin } from '@/lib/admin';
import {
  generateFullRecommendations,
  type ProjectBOMInput,
  type CandidateProduct,
  type FullProjectRecommendations,
} from '@/core/commerce/recommendation-engine';

// ── Types & DTOs ──

export interface MerchantDTO {
  id: string;
  name: string;
  slug: string;
  programType: string;
  baseUrl: string | null;
  affiliateId: string | null;
  defaultCampaignTag: string;
  commissionPct: number;
  cookieDurationDays: number;
  hasApi: boolean;
  isActive: boolean;
  priority: number;
  productCount?: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
}

export interface ProductDTO {
  id: string;
  merchantId: string;
  merchantName?: string;
  merchantSlug?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  externalSku: string | null;
  title: string;
  shortDescription: string | null;
  url: string;
  affiliateUrl: string | null;
  campaignTag: string;
  brand: string;
  beadSize: string;
  colorCode: string | null;
  colorHex: string | null;
  quantityPerPack: number;
  colorCount: number;
  priceBrl: number;
  previousPriceBrl: number | null;
  pricePerBead: number;
  priceVaries: boolean;
  priceLastCheckedAt: string;
  currency: string;
  rating: number;
  reviewCount: number;
  sellerName: string | null;
  isAvailable: boolean;
  productType: string;
  badgeTag: string | null;
  estimatedCommissionPct: number;
  priorityScore: number;
  imageUrl: string | null;
  estimatedShippingDays: number;
  specsJson?: Record<string, any> | null;
  isActive: boolean;
}

export interface CommerceMetricsDTO {
  totalClicks: number;
  totalMerchants: number;
  totalCategories: number;
  totalProducts: number;
  clicksLast7Days: number;
  estimatedRevenueBrl: number;
  topProducts: Array<{
    id: string;
    title: string;
    clicks: number;
    merchantName: string;
    priceBrl: number;
    badgeTag: string | null;
  }>;
  topColors: Array<{ colorCode: string; clicks: number }>;
  clicksByPlacement: Array<{ source: string; clicks: number }>;
}

// ── Helper: Admin Verification ──

async function requireAdmin() {
  await ensureDbTables();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado para realizar esta ação.');
  }

  const email = session.user.email?.toLowerCase().trim();
  const isAdmin = isUserAdmin(email) || (session.user as any).role === 'admin';

  if (!isAdmin) {
    throw new Error(`Acesso negado (${email}). Apenas administradores podem gerenciar o catálogo.`);
  }

  return session.user;
}

// ── Category Actions ──

export async function listCategoriesAction(): Promise<CategoryDTO[]> {
  await ensureDbTables();
  try {
    const rows = await db
      .select({
        category: affiliateCategory,
        productCount: sql<number>`count(${affiliateProduct.id})::int`,
      })
      .from(affiliateCategory)
      .leftJoin(affiliateProduct, eq(affiliateCategory.id, affiliateProduct.categoryId))
      .groupBy(affiliateCategory.id)
      .orderBy(affiliateCategory.displayOrder, affiliateCategory.name);

    return rows.map((r) => ({
      id: r.category.id,
      name: r.category.name,
      slug: r.category.slug,
      parentId: r.category.parentId,
      description: r.category.description,
      icon: r.category.icon || 'Package',
      displayOrder: r.category.displayOrder,
      isActive: r.category.isActive,
      productCount: r.productCount || 0,
    }));
  } catch (err) {
    console.error('Erro em listCategoriesAction:', err);
    return [];
  }
}

export async function saveCategoryAction(data: {
  id?: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
}) {
  await requireAdmin();

  const name = data.name.trim();
  const rawSlug = data.slug?.trim() || name;
  const slug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'categoria';
  const id = data.id || crypto.randomUUID();

  const values = {
    name,
    slug,
    parentId: data.parentId || null,
    description: data.description?.trim() || null,
    icon: data.icon?.trim() || 'Package',
    displayOrder: data.displayOrder ?? 0,
    isActive: data.isActive ?? true,
    updatedAt: new Date(),
  };

  if (data.id) {
    await db.update(affiliateCategory).set(values).where(eq(affiliateCategory.id, data.id));
  } else {
    await db.insert(affiliateCategory).values({
      id,
      ...values,
      createdAt: new Date(),
    });
  }

  revalidatePath('/admin');
  return { success: true, id };
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await db.delete(affiliateCategory).where(eq(affiliateCategory.id, id));
  revalidatePath('/admin');
  return { success: true };
}

// ── Merchant Actions ──

export async function listMerchantsAction(): Promise<MerchantDTO[]> {
  await ensureDbTables();
  try {
    const rows = await db
      .select({
        merchant: affiliateMerchant,
        productCount: sql<number>`count(${affiliateProduct.id})::int`,
      })
      .from(affiliateMerchant)
      .leftJoin(affiliateProduct, eq(affiliateMerchant.id, affiliateProduct.merchantId))
      .groupBy(affiliateMerchant.id)
      .orderBy(desc(affiliateMerchant.priority), affiliateMerchant.name);

    return rows.map((r) => ({
      id: r.merchant.id,
      name: r.merchant.name,
      slug: r.merchant.slug,
      programType: r.merchant.programType,
      baseUrl: r.merchant.baseUrl,
      affiliateId: r.merchant.affiliateId,
      defaultCampaignTag: r.merchant.defaultCampaignTag || 'beadforgekits',
      commissionPct: Number(r.merchant.commissionPct || 12.0),
      cookieDurationDays: r.merchant.cookieDurationDays || 1,
      hasApi: r.merchant.hasApi || false,
      isActive: r.merchant.isActive,
      priority: r.merchant.priority,
      productCount: r.productCount || 0,
    }));
  } catch (err) {
    console.error('Erro em listMerchantsAction:', err);
    return [];
  }
}

export async function saveMerchantAction(data: {
  id?: string;
  name: string;
  slug?: string;
  programType: string;
  baseUrl?: string;
  affiliateId?: string;
  defaultCampaignTag?: string;
  commissionPct?: number;
  cookieDurationDays?: number;
  isActive?: boolean;
  priority?: number;
}) {
  await requireAdmin();

  const name = data.name.trim();
  const rawSlug = data.slug?.trim() || name;
  const slug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'merchant';
  const id = data.id || crypto.randomUUID();

  const values = {
    name,
    slug,
    programType: data.programType,
    baseUrl: data.baseUrl?.trim() || null,
    affiliateId: data.affiliateId?.trim() || null,
    defaultCampaignTag: data.defaultCampaignTag?.trim() || 'beadforgekits',
    commissionPct: String(data.commissionPct ?? 12.0),
    cookieDurationDays: data.cookieDurationDays ?? 1,
    isActive: data.isActive ?? true,
    priority: data.priority ?? 10,
    updatedAt: new Date(),
  };

  if (data.id) {
    await db.update(affiliateMerchant).set(values).where(eq(affiliateMerchant.id, data.id));
  } else {
    const [existing] = await db
      .select()
      .from(affiliateMerchant)
      .where(eq(affiliateMerchant.slug, slug))
      .limit(1);

    if (existing) {
      await db.update(affiliateMerchant).set(values).where(eq(affiliateMerchant.id, existing.id));
      revalidatePath('/admin');
      return { success: true, id: existing.id };
    }

    await db.insert(affiliateMerchant).values({
      id,
      ...values,
      createdAt: new Date(),
    });
  }

  revalidatePath('/admin');
  return { success: true, id };
}

export async function deleteMerchantAction(id: string) {
  await requireAdmin();
  await db.delete(affiliateMerchant).where(eq(affiliateMerchant.id, id));
  revalidatePath('/admin');
  return { success: true };
}

// ── Product Actions ──

export async function listProductsAction(params?: {
  merchantId?: string;
  categoryId?: string;
  brand?: string;
  beadSize?: string;
  productType?: string;
  badgeTag?: string;
  search?: string;
  limit?: number;
}): Promise<ProductDTO[]> {
  await ensureDbTables();
  const limit = params?.limit || 300;

  const conditions = [];
  if (params?.merchantId) conditions.push(eq(affiliateProduct.merchantId, params.merchantId));
  if (params?.categoryId) conditions.push(eq(affiliateProduct.categoryId, params.categoryId));
  if (params?.brand) conditions.push(eq(affiliateProduct.brand, params.brand));
  if (params?.beadSize) conditions.push(eq(affiliateProduct.beadSize, params.beadSize));
  if (params?.productType) conditions.push(eq(affiliateProduct.productType, params.productType));
  if (params?.badgeTag) conditions.push(eq(affiliateProduct.badgeTag, params.badgeTag));
  if (params?.search) {
    conditions.push(
      sql`(${ilike(affiliateProduct.title, `%${params.search}%`)} OR ${ilike(affiliateProduct.colorCode, `%${params.search}%`)} OR ${ilike(affiliateProduct.externalSku, `%${params.search}%`)})`
    );
  }

  try {
    const rows = await db
      .select({
        product: affiliateProduct,
        merchantName: affiliateMerchant.name,
        merchantSlug: affiliateMerchant.slug,
        categoryName: affiliateCategory.name,
        categorySlug: affiliateCategory.slug,
      })
      .from(affiliateProduct)
      .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
      .leftJoin(affiliateCategory, eq(affiliateProduct.categoryId, affiliateCategory.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(affiliateProduct.priorityScore), desc(affiliateProduct.isActive), affiliateProduct.title)
      .limit(limit);

    return rows.map((r) => ({
      id: r.product.id,
      merchantId: r.product.merchantId,
      merchantName: r.merchantName,
      merchantSlug: r.merchantSlug,
      categoryId: r.product.categoryId,
      categoryName: r.categoryName,
      categorySlug: r.categorySlug,
      externalSku: r.product.externalSku,
      title: r.product.title,
      shortDescription: r.product.shortDescription,
      url: r.product.url,
      affiliateUrl: r.product.affiliateUrl || r.product.url,
      campaignTag: r.product.campaignTag || 'beadforgekits',
      brand: r.product.brand,
      beadSize: r.product.beadSize,
      colorCode: r.product.colorCode,
      colorHex: r.product.colorHex,
      quantityPerPack: r.product.quantityPerPack,
      colorCount: r.product.colorCount,
      priceBrl: Number(r.product.priceBrl),
      previousPriceBrl: r.product.previousPriceBrl ? Number(r.product.previousPriceBrl) : null,
      pricePerBead: Number(r.product.pricePerBead),
      priceVaries: r.product.priceVaries,
      priceLastCheckedAt: r.product.priceLastCheckedAt?.toISOString() || new Date().toISOString(),
      currency: r.product.currency || 'BRL',
      rating: Number(r.product.rating || 4.85),
      reviewCount: r.product.reviewCount || 0,
      sellerName: r.product.sellerName,
      isAvailable: r.product.isAvailable,
      productType: r.product.productType,
      badgeTag: r.product.badgeTag,
      estimatedCommissionPct: Number(r.product.estimatedCommissionPct || 12.0),
      priorityScore: r.product.priorityScore || 10,
      imageUrl: r.product.imageUrl,
      estimatedShippingDays: r.product.estimatedShippingDays || 3,
      specsJson: r.product.specsJson as any,
      isActive: r.product.isActive,
    }));
  } catch (err) {
    console.error('Erro em listProductsAction:', err);
    return [];
  }
}

export async function saveProductAction(data: {
  id?: string;
  merchantId: string;
  categoryId?: string;
  externalSku?: string;
  title: string;
  shortDescription?: string;
  url: string;
  affiliateUrl?: string;
  campaignTag?: string;
  brand: string;
  beadSize: string;
  colorCode?: string;
  colorHex?: string;
  quantityPerPack: number;
  colorCount?: number;
  priceBrl: number;
  previousPriceBrl?: number;
  priceVaries?: boolean;
  rating?: number;
  reviewCount?: number;
  sellerName?: string;
  isAvailable?: boolean;
  productType?: string;
  badgeTag?: string;
  estimatedCommissionPct?: number;
  priorityScore?: number;
  specsJson?: Record<string, any>;
  imageUrl?: string;
  estimatedShippingDays?: number;
  isActive?: boolean;
}) {
  await requireAdmin();

  const id = data.id || crypto.randomUUID();
  const qty = Math.max(1, isNaN(Number(data.quantityPerPack)) ? 1000 : Number(data.quantityPerPack));
  const price = Math.max(0.01, isNaN(Number(data.priceBrl)) ? 29.96 : Number(data.priceBrl));
  const pricePerBead = Number((price / qty).toFixed(4));
  const colorCount = Math.max(1, isNaN(Number(data.colorCount)) ? 1 : Number(data.colorCount));

  const values = {
    merchantId: data.merchantId,
    categoryId: data.categoryId || null,
    externalSku: data.externalSku?.trim() || null,
    title: data.title.trim(),
    shortDescription: data.shortDescription?.trim() || null,
    url: data.url.trim(),
    affiliateUrl: data.affiliateUrl?.trim() || data.url.trim(),
    campaignTag: data.campaignTag?.trim() || 'beadforgekits',
    brand: data.brand.trim().toLowerCase() || 'generic',
    beadSize: data.beadSize.trim() || '2.6mm',
    colorCode: data.colorCode ? data.colorCode.trim().toUpperCase() : null,
    colorHex: data.colorHex?.trim() || null,
    quantityPerPack: qty,
    colorCount,
    priceBrl: String(price.toFixed(2)),
    previousPriceBrl: data.previousPriceBrl ? String(Number(data.previousPriceBrl).toFixed(2)) : null,
    pricePerBead: String(pricePerBead.toFixed(4)),
    priceVaries: data.priceVaries ?? false,
    priceLastCheckedAt: new Date(),
    currency: 'BRL',
    rating: String((data.rating ?? 4.85).toFixed(2)),
    reviewCount: data.reviewCount ?? 140,
    sellerName: data.sellerName?.trim() || null,
    isAvailable: data.isAvailable ?? true,
    productType: data.productType || 'multi_color_kit',
    badgeTag: data.badgeTag?.trim() || null,
    estimatedCommissionPct: String(data.estimatedCommissionPct ?? 12.0),
    priorityScore: data.priorityScore ?? 10,
    specsJson: data.specsJson || null,
    imageUrl: data.imageUrl?.trim() || null,
    estimatedShippingDays: data.estimatedShippingDays ?? 3,
    isActive: data.isActive ?? true,
    updatedAt: new Date(),
  };

  if (data.id) {
    await db.update(affiliateProduct).set(values).where(eq(affiliateProduct.id, data.id));
  } else {
    await db.insert(affiliateProduct).values({
      id,
      ...values,
      createdAt: new Date(),
    });
  }

  revalidatePath('/admin');
  return { success: true, id };
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  await db.delete(affiliateProduct).where(eq(affiliateProduct.id, id));
  revalidatePath('/admin');
  return { success: true };
}

export async function duplicateProductAction(id: string) {
  await requireAdmin();
  const [existing] = await db
    .select()
    .from(affiliateProduct)
    .where(eq(affiliateProduct.id, id))
    .limit(1);

  if (!existing) {
    throw new Error('Produto original não encontrado.');
  }

  const newId = crypto.randomUUID();
  await db.insert(affiliateProduct).values({
    ...existing,
    id: newId,
    title: `${existing.title} (Cópia)`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/admin');
  return { success: true, id: newId };
}

// ── Recommendation Engine: BOM ↔ Full Product Ecosystem ──

export async function getRecommendedProductsForBOMAction(params: {
  summary: Array<{ code: string; name: string; hex: string; count: number }>;
  beadSize?: string;
  gridWidth?: number;
  gridHeight?: number;
}): Promise<FullProjectRecommendations> {
  await ensureDbTables();

  const totalBeads = params.summary.reduce((acc, s) => acc + s.count, 0);
  const beadSize = params.beadSize || '2.6mm';
  const gridWidth = params.gridWidth || 57;
  const gridHeight = params.gridHeight || 57;

  const bomInput: ProjectBOMInput = {
    totalBeads,
    distinctColorCount: params.summary.length,
    beadSize,
    gridWidth,
    gridHeight,
    colors: params.summary,
  };

  // 1. Busca todos os produtos e parceiros ativos
  const productsRows = await db
    .select({
      product: affiliateProduct,
      merchantName: affiliateMerchant.name,
      merchantSlug: affiliateMerchant.slug,
      merchantProgramType: affiliateMerchant.programType,
      categoryName: affiliateCategory.name,
      categorySlug: affiliateCategory.slug,
    })
    .from(affiliateProduct)
    .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
    .leftJoin(affiliateCategory, eq(affiliateProduct.categoryId, affiliateCategory.id))
    .where(
      and(
        eq(affiliateProduct.isActive, true),
        eq(affiliateMerchant.isActive, true)
      )
    )
    .orderBy(desc(affiliateProduct.priorityScore), affiliateProduct.pricePerBead);

  const candidates: CandidateProduct[] = productsRows.map((r) => ({
    id: r.product.id,
    merchantId: r.product.merchantId,
    merchantName: r.merchantName,
    merchantSlug: r.merchantSlug,
    merchantProgramType: r.merchantProgramType,
    categoryId: r.product.categoryId,
    categoryName: r.categoryName,
    categorySlug: r.categorySlug,
    externalSku: r.product.externalSku,
    title: r.product.title,
    shortDescription: r.product.shortDescription,
    url: r.product.url,
    affiliateUrl: r.product.affiliateUrl || r.product.url,
    campaignTag: r.product.campaignTag || 'beadforgekits',
    brand: r.product.brand,
    beadSize: r.product.beadSize,
    colorCode: r.product.colorCode,
    colorHex: r.product.colorHex,
    quantityPerPack: r.product.quantityPerPack,
    colorCount: r.product.colorCount,
    priceBrl: Number(r.product.priceBrl),
    previousPriceBrl: r.product.previousPriceBrl ? Number(r.product.previousPriceBrl) : null,
    pricePerBead: Number(r.product.pricePerBead),
    priceVaries: r.product.priceVaries,
    rating: Number(r.product.rating || 4.85),
    reviewCount: r.product.reviewCount || 0,
    sellerName: r.product.sellerName,
    isAvailable: r.product.isAvailable,
    productType: r.product.productType,
    badgeTag: r.product.badgeTag,
    estimatedCommissionPct: Number(r.product.estimatedCommissionPct || 12.0),
    priorityScore: r.product.priorityScore || 10,
    imageUrl: r.product.imageUrl,
    estimatedShippingDays: r.product.estimatedShippingDays || 3,
    specsJson: r.product.specsJson as any,
  }));

  return generateFullRecommendations(bomInput, candidates);
}

// ── Tracking & Analytics Actions ──

export async function trackProductClickAction(params: {
  productId: string;
  projectId?: string;
  colorCode?: string;
  source?: string;
  campaignTag?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const headerList = await headers();
    const userAgent = headerList.get('user-agent') || undefined;
    const ipAddress = headerList.get('x-forwarded-for') || undefined;
    const referrer = headerList.get('referer') || undefined;

    // Busca dados do produto para registrar merchantId
    const [prod] = await db
      .select({ merchantId: affiliateProduct.merchantId, campaignTag: affiliateProduct.campaignTag })
      .from(affiliateProduct)
      .where(eq(affiliateProduct.id, params.productId))
      .limit(1);

    await db.insert(affiliateClick).values({
      id: crypto.randomUUID(),
      userId: session?.user?.id || null,
      productId: params.productId,
      merchantId: prod?.merchantId || null,
      projectId: params.projectId || null,
      colorCode: params.colorCode || null,
      source: params.source || 'shopping_modal',
      campaignTag: params.campaignTag || prod?.campaignTag || 'beadforgekits',
      userAgent,
      ipAddress,
      referrer,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (err) {
    console.warn('Erro ao registrar clique de afiliado:', err);
    return { success: false };
  }
}

export async function trackAffiliateEventAction(params: {
  eventType: string; // 'impression' | 'click' | 'modal_open'
  productId?: string;
  projectId?: string;
  source?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    await db.insert(affiliateEvent).values({
      id: crypto.randomUUID(),
      eventType: params.eventType,
      userId: session?.user?.id || null,
      productId: params.productId || null,
      projectId: params.projectId || null,
      source: params.source || 'shopping_modal',
      metadata: params.metadata || null,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (err) {
    console.warn('Erro ao registrar evento de afiliado:', err);
    return { success: false };
  }
}

// ── Metrics & Admin Dashboard ──

export async function getCommerceMetricsAction(): Promise<CommerceMetricsDTO> {
  await requireAdmin();

  const [totalClicksRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(affiliateClick);

  const [merchantsCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(affiliateMerchant);

  const [categoriesCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(affiliateCategory);

  const [productsCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(affiliateProduct);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [clicks7dRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(affiliateClick)
    .where(sql`${affiliateClick.createdAt} >= ${sevenDaysAgo}`);

  // Top 5 Produtos mais clicados
  const topProductsRows = await db
    .select({
      id: affiliateProduct.id,
      title: affiliateProduct.title,
      priceBrl: affiliateProduct.priceBrl,
      badgeTag: affiliateProduct.badgeTag,
      merchantName: affiliateMerchant.name,
      clicks: sql<number>`count(${affiliateClick.id})::int`,
    })
    .from(affiliateClick)
    .innerJoin(affiliateProduct, eq(affiliateClick.productId, affiliateProduct.id))
    .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
    .groupBy(affiliateProduct.id, affiliateMerchant.name)
    .orderBy(desc(sql`count(${affiliateClick.id})`))
    .limit(5);

  // Top 5 Cores mais procuradas
  const topColorsRows = await db
    .select({
      colorCode: affiliateClick.colorCode,
      clicks: sql<number>`count(*)::int`,
    })
    .from(affiliateClick)
    .where(sql`${affiliateClick.colorCode} IS NOT NULL`)
    .groupBy(affiliateClick.colorCode)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // Cliques por Placement
  const placementRows = await db
    .select({
      source: affiliateClick.source,
      clicks: sql<number>`count(*)::int`,
    })
    .from(affiliateClick)
    .groupBy(affiliateClick.source)
    .orderBy(desc(sql`count(*)`));

  // Estimativa de receita: Cliques * 4% conversão estimada * R$ 3,59 comissão média (R$ 29,96 * 12%)
  const totalClicks = totalClicksRes?.count || 0;
  const estimatedRevenueBrl = Number((totalClicks * 0.04 * 3.59).toFixed(2));

  return {
    totalClicks,
    totalMerchants: merchantsCountRes?.count || 0,
    totalCategories: categoriesCountRes?.count || 0,
    totalProducts: productsCountRes?.count || 0,
    clicksLast7Days: clicks7dRes?.count || 0,
    estimatedRevenueBrl,
    topProducts: topProductsRows.map((p) => ({
      id: p.id,
      title: p.title,
      clicks: p.clicks,
      merchantName: p.merchantName,
      priceBrl: Number(p.priceBrl),
      badgeTag: p.badgeTag,
    })),
    topColors: topColorsRows.map((c) => ({
      colorCode: c.colorCode || '',
      clicks: c.clicks,
    })),
    clicksByPlacement: placementRows.map((r) => ({
      source: r.source,
      clicks: r.clicks,
    })),
  };
}

// ── Seed Action: Popular Beads Catalog Initializer ──

export async function seedPopularBeadProductsAction() {
  await requireAdmin();

  // 1. Cria Categorias Padrão
  const defaultCategories = [
    { id: crypto.randomUUID(), name: 'Kits Completos', slug: 'kits', icon: 'Package', displayOrder: 1 },
    { id: crypto.randomUUID(), name: 'Beads 2,6mm & Refis', slug: 'beads', icon: 'Layers', displayOrder: 2 },
    { id: crypto.randomUUID(), name: 'Placas & Pegboards', slug: 'pegboards', icon: 'Grid', displayOrder: 3 },
    { id: crypto.randomUUID(), name: 'Ferramentas', slug: 'ferramentas', icon: 'Wrench', displayOrder: 4 },
    { id: crypto.randomUUID(), name: 'Fusão & Passar', slug: 'fusao', icon: 'Flame', displayOrder: 5 },
    { id: crypto.randomUUID(), name: 'Organização', slug: 'organizacao', icon: 'Boxes', displayOrder: 6 },
  ];

  for (const cat of defaultCategories) {
    const [existing] = await db.select().from(affiliateCategory).where(eq(affiliateCategory.slug, cat.slug)).limit(1);
    if (!existing) {
      await db.insert(affiliateCategory).values({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: true,
      });
    }
  }

  const allCategories = await db.select().from(affiliateCategory);
  const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  // 2. Cria ou recupera os Marketplaces (Mercado Livre, Shopee, Amazon)
  let [ml] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'mercadolivre')).limit(1);
  if (!ml) {
    const id = crypto.randomUUID();
    await db.insert(affiliateMerchant).values({
      id,
      name: 'Mercado Livre',
      slug: 'mercadolivre',
      programType: 'ml_affiliate',
      baseUrl: 'https://www.mercadolivre.com.br',
      affiliateId: 'beadforge-ml',
      defaultCampaignTag: 'beadforgekits',
      commissionPct: '12.00',
      cookieDurationDays: 1,
      hasApi: false,
      isActive: true,
      priority: 10,
    });
    [ml] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'mercadolivre')).limit(1);
  }

  let [shopee] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'shopee')).limit(1);
  if (!shopee) {
    const id = crypto.randomUUID();
    await db.insert(affiliateMerchant).values({
      id,
      name: 'Shopee Brasil',
      slug: 'shopee',
      programType: 'shopee_affiliate',
      baseUrl: 'https://shopee.com.br',
      affiliateId: 'beadforge-20',
      defaultCampaignTag: 'beadforgekits',
      commissionPct: '8.00',
      cookieDurationDays: 7,
      hasApi: true,
      isActive: true,
      priority: 8,
    });
    [shopee] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'shopee')).limit(1);
  }

  let [amazon] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'amazon')).limit(1);
  if (!amazon) {
    const id = crypto.randomUUID();
    await db.insert(affiliateMerchant).values({
      id,
      name: 'Amazon Brasil',
      slug: 'amazon',
      programType: 'amazon_associates',
      baseUrl: 'https://www.amazon.com.br',
      affiliateId: 'beadforge-20',
      defaultCampaignTag: 'beadforgekits',
      commissionPct: '10.00',
      cookieDurationDays: 1,
      hasApi: true,
      isActive: true,
      priority: 6,
    });
    [amazon] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'amazon')).limit(1);
  }

  let inserted = 0;

  // 3. Cadastra ou Atualiza o PRIMEIRO PRODUTO REAL DO MERCADO LIVRE (Kit 10.000 Beads 24 Cores - R$ 29,96)
  const heroKitImg = 'https://http2.mlstatic.com/D_NQ_NP_2X_735870-MLB77568584488_072024-F.webp';
  const kit15kImg = 'https://http2.mlstatic.com/D_NQ_NP_2X_728148-MLB78311545633_082024-F.webp';
  const plateImg = 'https://http2.mlstatic.com/D_NQ_NP_2X_616853-MLB70724805728_072023-F.webp';
  const paperImg = 'https://http2.mlstatic.com/D_NQ_NP_2X_899234-MLB52674261763_112022-F.webp';
  const tweezerImg = 'https://http2.mlstatic.com/D_NQ_NP_2X_910793-MLB71790432170_092023-F.webp';

  const [existingMlHeroKit] = await db
    .select()
    .from(affiliateProduct)
    .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.externalSku, '7SVEU4-S4TM')))
    .limit(1);

  if (!existingMlHeroKit) {
    await db.insert(affiliateProduct).values({
      id: crypto.randomUUID(),
      merchantId: ml.id,
      categoryId: catMap.get('kits') || null,
      externalSku: '7SVEU4-S4TM',
      title: 'Conjunto 10.000 Hama Beads 2,6mm Miçangas Brinquedo 24 Cores',
      shortDescription: 'Kit completo com 24 cores vivas em caixa organizadora. Ideal para moldes de 2,6mm.',
      url: 'https://meli.la/2q4Xt3j',
      affiliateUrl: 'https://meli.la/2q4Xt3j',
      campaignTag: 'beadforgekits',
      brand: 'generic',
      beadSize: '2.6mm',
      colorCode: null,
      quantityPerPack: 10000,
      colorCount: 24,
      priceBrl: '29.96',
      previousPriceBrl: '39.90',
      pricePerBead: '0.0030',
      priceVaries: true,
      rating: '4.85',
      reviewCount: 140,
      sellerName: 'Mercado Livre Oficial',
      isAvailable: true,
      productType: 'multi_color_kit',
      badgeTag: 'best_value',
      estimatedCommissionPct: '12.00',
      priorityScore: 100, // Máxima prioridade
      imageUrl: heroKitImg,
      estimatedShippingDays: 2,
      isActive: true,
    });
    inserted++;
  } else if (!existingMlHeroKit.imageUrl) {
    await db.update(affiliateProduct).set({ imageUrl: heroKitImg }).where(eq(affiliateProduct.id, existingMlHeroKit.id));
  }

  // 4. Cadastra Kit 15.000 Beads 24 Cores com Pinça e Pegboard (Kit Intermediário Completo)
  const [existingMl15kKit] = await db
    .select()
    .from(affiliateProduct)
    .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.title, 'Kit Perler Hama Beads 2,6mm 15.000un 24 Cores Pinça Pegboard')))
    .limit(1);

  if (!existingMl15kKit) {
    await db.insert(affiliateProduct).values({
      id: crypto.randomUUID(),
      merchantId: ml.id,
      categoryId: catMap.get('kits') || null,
      externalSku: 'ML-KIT-15K-24C',
      title: 'Kit Perler Hama Beads 2,6mm 15.000un 24 Cores Pinça Pegboard',
      shortDescription: 'Kit completo com 24 cores, organizador, placas pegboards e acessórios.',
      url: 'https://meli.la/2q4Xt3j',
      affiliateUrl: 'https://meli.la/2q4Xt3j',
      campaignTag: 'beadforgekits',
      brand: 'generic',
      beadSize: '2.6mm',
      colorCode: null,
      quantityPerPack: 15000,
      colorCount: 24,
      priceBrl: '72.13',
      previousPriceBrl: '89.99',
      pricePerBead: '0.0048',
      priceVaries: true,
      rating: '4.90',
      reviewCount: 85,
      isAvailable: true,
      productType: 'multi_color_kit',
      badgeTag: 'most_complete',
      estimatedCommissionPct: '12.00',
      priorityScore: 95,
      imageUrl: kit15kImg,
      estimatedShippingDays: 2,
      isActive: true,
    });
    inserted++;
  } else if (!existingMl15kKit.imageUrl) {
    await db.update(affiliateProduct).set({ imageUrl: kit15kImg }).where(eq(affiliateProduct.id, existingMl15kKit.id));
  }

  // 5. Cadastra Kit Gigante 42.000 Beads 120 Cores (Opção Master)
  const [existingMlBigKit] = await db
    .select()
    .from(affiliateProduct)
    .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.title, 'Kit 42.000 Hama Beads 2,6mm - 120 Cores com Organizador')))
    .limit(1);

  if (!existingMlBigKit) {
    await db.insert(affiliateProduct).values({
      id: crypto.randomUUID(),
      merchantId: ml.id,
      categoryId: catMap.get('kits') || null,
      externalSku: 'ML-KIT-42K-120C',
      title: 'Kit 42.000 Hama Beads 2,6mm - 120 Cores com Organizador',
      shortDescription: 'Kit master profissional com 120 tons para projetos avançados de pixel art.',
      url: 'https://lista.mercadolivre.com.br/kit-hama-beads-2.6mm-120-cores',
      affiliateUrl: 'https://lista.mercadolivre.com.br/kit-hama-beads-2.6mm-120-cores',
      campaignTag: 'beadforgekits',
      brand: 'generic',
      beadSize: '2.6mm',
      colorCode: null,
      quantityPerPack: 42000,
      colorCount: 120,
      priceBrl: '137.57',
      previousPriceBrl: '169.90',
      pricePerBead: '0.0033',
      priceVaries: true,
      rating: '4.90',
      reviewCount: 95,
      isAvailable: true,
      productType: 'multi_color_kit',
      badgeTag: 'most_complete',
      estimatedCommissionPct: '12.00',
      priorityScore: 85,
      imageUrl: heroKitImg,
      estimatedShippingDays: 3,
      isActive: true,
    });
    inserted++;
  } else if (!existingMlBigKit.imageUrl) {
    await db.update(affiliateProduct).set({ imageUrl: heroKitImg }).where(eq(affiliateProduct.id, existingMlBigKit.id));
  }

  // 6. Cadastra Placa Pegboard Mini 57x57 pinos (14,5 x 14,5 cm)
  const [existingPlate] = await db
    .select()
    .from(affiliateProduct)
    .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.productType, 'pegboard')))
    .limit(1);

  if (!existingPlate) {
    await db.insert(affiliateProduct).values({
      id: crypto.randomUUID(),
      merchantId: ml.id,
      categoryId: catMap.get('pegboards') || null,
      externalSku: 'ML-PEG-57X57',
      title: 'Placa Pegboard Mini 2,6mm Quadrada 57x57 Pinos (14,5x14,5cm)',
      shortDescription: 'Placa modular de alta resistência com encaixes para multiplicação de moldes.',
      url: 'https://lista.mercadolivre.com.br/placa-pegboard-mini-2.6mm-57x57',
      affiliateUrl: 'https://lista.mercadolivre.com.br/placa-pegboard-mini-2.6mm-57x57',
      campaignTag: 'beadforgekits',
      brand: 'generic',
      beadSize: '2.6mm',
      colorCode: null,
      quantityPerPack: 1,
      colorCount: 1,
      priceBrl: '19.90',
      pricePerBead: '19.9000',
      priceVaries: true,
      rating: '4.88',
      reviewCount: 64,
      isAvailable: true,
      productType: 'pegboard',
      badgeTag: 'essential_tool',
      estimatedCommissionPct: '12.00',
      priorityScore: 90,
      specsJson: { pinsHorizontal: 57, pinsVertical: 57, widthCm: 14.5, heightCm: 14.5 },
      imageUrl: plateImg,
      estimatedShippingDays: 2,
      isActive: true,
    });
    inserted++;
  } else if (!existingPlate.imageUrl) {
    await db.update(affiliateProduct).set({ imageUrl: plateImg }).where(eq(affiliateProduct.id, existingPlate.id));
  }

  // 7. Cadastra Papel de Fusão e Pinça de Precisão
  const [existingPaper] = await db
    .select()
    .from(affiliateProduct)
    .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.productType, 'ironing_paper')))
    .limit(1);

  if (!existingPaper) {
    await db.insert(affiliateProduct).values({
      id: crypto.randomUUID(),
      merchantId: ml.id,
      categoryId: catMap.get('fusao') || null,
      externalSku: 'ML-PAPEL-FUSAO',
      title: 'Papel Térmico para Passar / Fusão de Beads Reutilizável (5 Folhas)',
      shortDescription: 'Papel antiaderente com proteção térmica para selagem uniforme sem grudar.',
      url: 'https://lista.mercadolivre.com.br/papel-fusao-hama-beads',
      affiliateUrl: 'https://lista.mercadolivre.com.br/papel-fusao-hama-beads',
      campaignTag: 'beadforgekits',
      brand: 'generic',
      beadSize: '2.6mm',
      quantityPerPack: 5,
      colorCount: 1,
      priceBrl: '14.90',
      pricePerBead: '2.9800',
      priceVaries: true,
      rating: '4.92',
      reviewCount: 42,
      isAvailable: true,
      productType: 'ironing_paper',
      badgeTag: 'essential_tool',
      estimatedCommissionPct: '12.00',
      priorityScore: 80,
      imageUrl: paperImg,
      estimatedShippingDays: 2,
      isActive: true,
    });
    inserted++;
  } else if (!existingPaper.imageUrl) {
    await db.update(affiliateProduct).set({ imageUrl: paperImg }).where(eq(affiliateProduct.id, existingPaper.id));
  }

  const [existingTweezer] = await db
    .select()
    .from(affiliateProduct)
    .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.productType, 'tool')))
    .limit(1);

  if (!existingTweezer) {
    await db.insert(affiliateProduct).values({
      id: crypto.randomUUID(),
      merchantId: ml.id,
      categoryId: catMap.get('ferramentas') || null,
      externalSku: 'ML-PINCA-26MM',
      title: 'Pinça de Precisão Antiestática Ponta Fina para Mini Beads 2,6mm',
      shortDescription: 'Pinça de alta acurácia para manuseio ergonômico e montagem rápida.',
      url: 'https://lista.mercadolivre.com.br/pinca-mini-beads-2.6mm',
      affiliateUrl: 'https://lista.mercadolivre.com.br/pinca-mini-beads-2.6mm',
      campaignTag: 'beadforgekits',
      brand: 'generic',
      beadSize: '2.6mm',
      quantityPerPack: 1,
      colorCount: 1,
      priceBrl: '12.90',
      pricePerBead: '12.9000',
      priceVaries: true,
      rating: '4.86',
      reviewCount: 78,
      isAvailable: true,
      productType: 'tool',
      badgeTag: 'essential_tool',
      estimatedCommissionPct: '12.00',
      priorityScore: 80,
      imageUrl: tweezerImg,
      estimatedShippingDays: 2,
      isActive: true,
    });
    inserted++;
  } else if (!existingTweezer.imageUrl) {
    await db.update(affiliateProduct).set({ imageUrl: tweezerImg }).where(eq(affiliateProduct.id, existingTweezer.id));
  }

  // 7. Cadastra Refis de Cores Populares 2,6mm
  const popularColors = [
    { code: 'A1', name: 'Branco Puro / Creme', hex: '#FDFBF7', price: 14.90 },
    { code: 'A2', name: 'Amarelo Manteiga', hex: '#FDF0A6', price: 14.90 },
    { code: 'A4', name: 'Amarelo Canário', hex: '#E8D44D', price: 14.90 },
    { code: 'A7', name: 'Laranja Vivo', hex: '#F39C12', price: 14.90 },
    { code: 'A19', name: 'Vermelho Carmesim', hex: '#C62828', price: 14.90 },
    { code: 'B3', name: 'Azul Céu', hex: '#85C1E9', price: 14.90 },
    { code: 'B7', name: 'Azul Royal', hex: '#2980B9', price: 14.90 },
    { code: 'B12', name: 'Azul Marinho', hex: '#1B4F72', price: 14.90 },
    { code: 'C8', name: 'Verde Grama', hex: '#27AE60', price: 14.90 },
    { code: 'C15', name: 'Verde Floresta', hex: '#145A32', price: 14.90 },
    { code: 'E6', name: 'Rosa Chiclete', hex: '#E87090', price: 14.90 },
    { code: 'G8', name: 'Marrom Chocolate', hex: '#8B5E3C', price: 14.90 },
    { code: 'H1', name: 'Branco Neve', hex: '#FFFFFF', price: 14.90 },
    { code: 'H7', name: 'Cinza Médio', hex: '#7F8C8D', price: 14.90 },
    { code: 'H10', name: 'Preto Intenso', hex: '#111111', price: 14.90 },
  ];

  for (const c of popularColors) {
    const [existing] = await db
      .select()
      .from(affiliateProduct)
      .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.colorCode, c.code)))
      .limit(1);

    if (!existing) {
      await db.insert(affiliateProduct).values({
        id: crypto.randomUUID(),
        merchantId: ml.id,
        categoryId: catMap.get('beads') || null,
        externalSku: `ML-REFIL-${c.code}`,
        title: `Refil Mini Beads 2,6mm - Cor ${c.code} (${c.name}) 1.000un`,
        shortDescription: `Pacote refil de 1.000 miçangas na cor ${c.code}.`,
        url: `https://lista.mercadolivre.com.br/${encodeURIComponent(`mini beads 2.6mm ${c.code}`)}`,
        affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(`mini beads 2.6mm ${c.code}`)}`,
        campaignTag: 'beadforgekits',
        brand: 'pindoo',
        beadSize: '2.6mm',
        colorCode: c.code,
        colorHex: c.hex,
        quantityPerPack: 1000,
        colorCount: 1,
        priceBrl: String(c.price.toFixed(2)),
        pricePerBead: String((c.price / 1000).toFixed(4)),
        rating: '4.88',
        reviewCount: 110,
        isAvailable: true,
        productType: 'single_color',
        estimatedShippingDays: 2,
        isActive: true,
      });
      inserted++;
    }
  }

  revalidatePath('/admin');
  return { success: true, insertedCount: inserted };
}
