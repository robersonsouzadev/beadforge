'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db, ensureDbTables } from '@/db';
import { affiliateMerchant, affiliateProduct, affiliateClick, user } from '@/db/schema';
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import { isUserAdmin } from '@/lib/admin';

// ── Types & DTOs ──

export interface MerchantDTO {
  id: string;
  name: string;
  slug: string;
  programType: string;
  baseUrl: string | null;
  affiliateId: string | null;
  commissionPct: number;
  cookieDurationDays: number;
  hasApi: boolean;
  isActive: boolean;
  priority: number;
  productCount?: number;
}

export interface ProductDTO {
  id: string;
  merchantId: string;
  merchantName?: string;
  merchantSlug?: string;
  externalSku: string | null;
  title: string;
  url: string;
  affiliateUrl: string | null;
  brand: string;
  beadSize: string;
  colorCode: string | null;
  colorHex: string | null;
  quantityPerPack: number;
  priceBrl: number;
  pricePerBead: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  productType: string;
  imageUrl: string | null;
  estimatedShippingDays: number;
  isActive: boolean;
}

export interface RecommendedColorOption {
  colorCode: string;
  colorName: string;
  colorHex: string;
  requiredCount: number;
  packsNeeded: number;
  totalBeads: number;
  products: Array<{
    id: string;
    merchantName: string;
    merchantSlug: string;
    title: string;
    url: string;
    affiliateUrl: string;
    priceBrl: number;
    pricePerBead: number;
    quantityPerPack: number;
    rating: number;
    estimatedShippingDays: number;
    imageUrl: string | null;
    isBestPrice?: boolean;
  }>;
}

export interface CommerceMetricsDTO {
  totalClicks: number;
  totalMerchants: number;
  totalProducts: number;
  clicksLast7Days: number;
  topProducts: Array<{ id: string; title: string; clicks: number; merchantName: string; priceBrl: number }>;
  topColors: Array<{ colorCode: string; clicks: number }>;
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
    throw new Error(`Acesso negado (${email}). Apenas administradores podem gerenciar o catálogo de commerce.`);
  }

  return session.user;
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
      commissionPct: Number(r.merchant.commissionPct || 8),
      cookieDurationDays: r.merchant.cookieDurationDays || 7,
      hasApi: r.merchant.hasApi || false,
      isActive: r.merchant.isActive,
      priority: r.merchant.priority,
      productCount: r.productCount || 0,
    }));
  } catch (err: any) {
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
    commissionPct: String(data.commissionPct ?? 8.0),
    cookieDurationDays: data.cookieDurationDays ?? 7,
    isActive: data.isActive ?? true,
    priority: data.priority ?? 0,
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
  brand?: string;
  colorCode?: string;
  search?: string;
  limit?: number;
}): Promise<ProductDTO[]> {
  await ensureDbTables();
  const limit = params?.limit || 200;

  const conditions = [];
  if (params?.merchantId) conditions.push(eq(affiliateProduct.merchantId, params.merchantId));
  if (params?.brand) conditions.push(eq(affiliateProduct.brand, params.brand));
  if (params?.colorCode) conditions.push(eq(affiliateProduct.colorCode, params.colorCode));
  if (params?.search) {
    conditions.push(
      sql`(${ilike(affiliateProduct.title, `%${params.search}%`)} OR ${ilike(affiliateProduct.colorCode, `%${params.search}%`)})`
    );
  }

  try {
    const rows = await db
      .select({
        product: affiliateProduct,
        merchantName: affiliateMerchant.name,
        merchantSlug: affiliateMerchant.slug,
      })
      .from(affiliateProduct)
      .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(affiliateProduct.isActive), affiliateProduct.colorCode, affiliateProduct.title)
      .limit(limit);

    return rows.map((r) => ({
      id: r.product.id,
      merchantId: r.product.merchantId,
      merchantName: r.merchantName,
      merchantSlug: r.merchantSlug,
      externalSku: r.product.externalSku,
      title: r.product.title,
      url: r.product.url,
      affiliateUrl: r.product.affiliateUrl || r.product.url,
      brand: r.product.brand,
      beadSize: r.product.beadSize,
      colorCode: r.product.colorCode,
      colorHex: r.product.colorHex,
      quantityPerPack: r.product.quantityPerPack,
      priceBrl: Number(r.product.priceBrl),
      pricePerBead: Number(r.product.pricePerBead),
      rating: Number(r.product.rating || 4.8),
      reviewCount: r.product.reviewCount || 0,
      isAvailable: r.product.isAvailable,
      productType: r.product.productType,
      imageUrl: r.product.imageUrl,
      estimatedShippingDays: r.product.estimatedShippingDays || 5,
      isActive: r.product.isActive,
    }));
  } catch (err: any) {
    console.error('Erro em listProductsAction:', err);
    return [];
  }
}

export async function saveProductAction(data: {
  id?: string;
  merchantId: string;
  externalSku?: string;
  title: string;
  url: string;
  affiliateUrl?: string;
  brand: string;
  beadSize: string;
  colorCode?: string;
  colorHex?: string;
  quantityPerPack: number;
  priceBrl: number;
  rating?: number;
  reviewCount?: number;
  productType?: string;
  imageUrl?: string;
  estimatedShippingDays?: number;
  isActive?: boolean;
}) {
  await requireAdmin();

  const id = data.id || crypto.randomUUID();
  const qty = Math.max(1, isNaN(Number(data.quantityPerPack)) ? 1000 : Number(data.quantityPerPack));
  const price = Math.max(0.01, isNaN(Number(data.priceBrl)) ? 14.90 : Number(data.priceBrl));
  const pricePerBead = Number((price / qty).toFixed(4));

  const values = {
    merchantId: data.merchantId,
    externalSku: data.externalSku?.trim() || null,
    title: data.title.trim(),
    url: data.url.trim(),
    affiliateUrl: data.affiliateUrl?.trim() || data.url.trim(),
    brand: data.brand.trim().toLowerCase() || 'pindoo',
    beadSize: data.beadSize.trim() || '2.6mm',
    colorCode: data.colorCode ? data.colorCode.trim().toUpperCase() : null,
    colorHex: data.colorHex?.trim() || null,
    quantityPerPack: qty,
    priceBrl: String(price.toFixed(2)),
    pricePerBead: String(pricePerBead.toFixed(4)),
    rating: String((data.rating ?? 4.8).toFixed(2)),
    reviewCount: data.reviewCount ?? 120,
    isAvailable: true,
    productType: data.productType || 'single_color',
    imageUrl: data.imageUrl?.trim() || null,
    estimatedShippingDays: data.estimatedShippingDays ?? 5,
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

// ── Recommendation Engine: BOM ↔ Affiliate Catalog ──

export async function getRecommendedProductsForBOMAction(params: {
  summary: Array<{ code: string; name: string; hex: string; count: number }>;
  brand?: string;
  beadSize?: string;
}): Promise<RecommendedColorOption[]> {
  if (!params.summary || params.summary.length === 0) {
    return [];
  }

  const brand = (params.brand || 'pindoo').toLowerCase();
  const beadSize = params.beadSize || '2.6mm';
  const colorCodes = params.summary.map((s) => s.code.toUpperCase());

  // 1. Busca todos os produtos ativos que combinam com as cores do projeto
  const products = await db
    .select({
      product: affiliateProduct,
      merchantName: affiliateMerchant.name,
      merchantSlug: affiliateMerchant.slug,
      merchantAffiliateId: affiliateMerchant.affiliateId,
      merchantProgramType: affiliateMerchant.programType,
    })
    .from(affiliateProduct)
    .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
    .where(
      and(
        eq(affiliateProduct.isActive, true),
        eq(affiliateMerchant.isActive, true),
        sql`${affiliateProduct.colorCode} = ANY(${colorCodes})`
      )
    )
    .orderBy(affiliateProduct.pricePerBead);

  // 2. Agrupa produtos por cor
  const productsByColor = new Map<string, typeof products>();
  for (const item of products) {
    const code = (item.product.colorCode || '').toUpperCase();
    if (!code) continue;
    const list = productsByColor.get(code) || [];
    list.push(item);
    productsByColor.set(code, list);
  }

  // 3. Monta as opções recomendadas por cor
  const results: RecommendedColorOption[] = [];

  for (const s of params.summary) {
    const code = s.code.toUpperCase();
    const available = productsByColor.get(code) || [];

    // Formata os produtos encontrados
    const formattedProducts = available.map((item, idx) => {
      let affiliateUrl = item.product.affiliateUrl || item.product.url;

      // Se for Shopee e tiver affiliateId, monta o link com sub_id
      if (item.merchantProgramType === 'shopee_affiliate' && item.merchantAffiliateId) {
        const subId = `bf_bom_${code.toLowerCase()}`;
        if (!affiliateUrl.includes('sub_id=')) {
          const sep = affiliateUrl.includes('?') ? '&' : '?';
          affiliateUrl = `${affiliateUrl}${sep}sub_id=${subId}`;
        }
      }

      return {
        id: item.product.id,
        merchantName: item.merchantName,
        merchantSlug: item.merchantSlug,
        title: item.product.title,
        url: item.product.url,
        affiliateUrl: affiliateUrl,
        priceBrl: Number(item.product.priceBrl),
        pricePerBead: Number(item.product.pricePerBead),
        quantityPerPack: item.product.quantityPerPack,
        rating: Number(item.product.rating || 4.8),
        estimatedShippingDays: item.product.estimatedShippingDays || 5,
        imageUrl: item.product.imageUrl,
        isBestPrice: idx === 0, // Primeiro é o menor pricePerBead
      };
    });

    const defaultPackSize = formattedProducts[0]?.quantityPerPack || 1000;
    const packsNeeded = Math.max(1, Math.ceil(s.count / defaultPackSize));

    results.push({
      colorCode: code,
      colorName: s.name,
      colorHex: s.hex,
      requiredCount: s.count,
      packsNeeded,
      totalBeads: packsNeeded * defaultPackSize,
      products: formattedProducts,
    });
  }

  return results;
}

export async function getFeaturedKitsAction(): Promise<ProductDTO[]> {
  await ensureDbTables();
  try {
    const rows = await db
      .select({
        product: affiliateProduct,
        merchantName: affiliateMerchant.name,
        merchantSlug: affiliateMerchant.slug,
      })
      .from(affiliateProduct)
      .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
      .where(
        and(
          eq(affiliateProduct.isActive, true),
          eq(affiliateMerchant.isActive, true),
          sql`(${affiliateProduct.productType} IN ('kit', 'pegboard', 'tool') OR ${affiliateProduct.colorCode} IS NULL)`
        )
      )
      .orderBy(desc(affiliateProduct.rating), affiliateProduct.priceBrl)
      .limit(20);

    return rows.map((r) => ({
      id: r.product.id,
      merchantId: r.product.merchantId,
      merchantName: r.merchantName,
      merchantSlug: r.merchantSlug,
      externalSku: r.product.externalSku,
      title: r.product.title,
      url: r.product.url,
      affiliateUrl: r.product.affiliateUrl || r.product.url,
      brand: r.product.brand,
      beadSize: r.product.beadSize,
      colorCode: r.product.colorCode,
      colorHex: r.product.colorHex,
      quantityPerPack: r.product.quantityPerPack,
      priceBrl: Number(r.product.priceBrl),
      pricePerBead: Number(r.product.pricePerBead),
      rating: Number(r.product.rating || 4.8),
      reviewCount: r.product.reviewCount || 0,
      isAvailable: r.product.isAvailable,
      productType: r.product.productType,
      imageUrl: r.product.imageUrl,
      estimatedShippingDays: r.product.estimatedShippingDays || 5,
      isActive: r.product.isActive,
    }));
  } catch (err) {
    console.error('Erro em getFeaturedKitsAction:', err);
    return [];
  }
}

// ── Tracking Action ──

export async function trackProductClickAction(params: {
  productId: string;
  projectId?: string;
  colorCode?: string;
  source?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const headerList = await headers();
    const userAgent = headerList.get('user-agent') || undefined;
    const ipAddress = headerList.get('x-forwarded-for') || undefined;

    await db.insert(affiliateClick).values({
      id: crypto.randomUUID(),
      userId: session?.user?.id || null,
      productId: params.productId,
      projectId: params.projectId || null,
      colorCode: params.colorCode || null,
      source: params.source || 'bom_panel',
      userAgent,
      ipAddress,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (err) {
    console.warn('Erro ao registrar clique de afiliado:', err);
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
      merchantName: affiliateMerchant.name,
      clicks: sql<number>`count(${affiliateClick.id})::int`,
    })
    .from(affiliateClick)
    .innerJoin(affiliateProduct, eq(affiliateClick.productId, affiliateProduct.id))
    .innerJoin(affiliateMerchant, eq(affiliateProduct.merchantId, affiliateMerchant.id))
    .groupBy(affiliateProduct.id, affiliateMerchant.name)
    .orderBy(desc(sql`count(${affiliateClick.id})`))
    .limit(5);

  // Top 5 Cores mais buscadas
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

  return {
    totalClicks: totalClicksRes?.count || 0,
    totalMerchants: merchantsCountRes?.count || 0,
    totalProducts: productsCountRes?.count || 0,
    clicksLast7Days: clicks7dRes?.count || 0,
    topProducts: topProductsRows.map((p) => ({
      id: p.id,
      title: p.title,
      clicks: p.clicks,
      merchantName: p.merchantName,
      priceBrl: Number(p.priceBrl),
    })),
    topColors: topColorsRows.map((c) => ({
      colorCode: c.colorCode || '',
      clicks: c.clicks,
    })),
  };
}

// ── Seed Action: Popular Beads Catalog Initializer ──

export async function seedPopularBeadProductsAction() {
  await requireAdmin();

  // 1. Cria ou recupera os 3 principais marketplaces brasileiros
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
      commissionPct: '8.00',
      cookieDurationDays: 7,
      hasApi: true,
      isActive: true,
      priority: 10,
    });
    [shopee] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'shopee')).limit(1);
  }

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
      commissionPct: '9.00',
      cookieDurationDays: 1,
      hasApi: false,
      isActive: true,
      priority: 8,
    });
    [ml] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'mercadolivre')).limit(1);
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
      commissionPct: '10.00',
      cookieDurationDays: 1,
      hasApi: true,
      isActive: true,
      priority: 6,
    });
    [amazon] = await db.select().from(affiliateMerchant).where(eq(affiliateMerchant.slug, 'amazon')).limit(1);
  }

  // 2. Lista de cores populares (Pindoo Standard / Mini 2.6mm)
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

  let inserted = 0;

  for (const c of popularColors) {
    // Verifica se já existe para a Shopee
    const [existingShopee] = await db
      .select()
      .from(affiliateProduct)
      .where(and(eq(affiliateProduct.merchantId, shopee.id), eq(affiliateProduct.colorCode, c.code)))
      .limit(1);

    if (!existingShopee) {
      await db.insert(affiliateProduct).values({
        id: crypto.randomUUID(),
        merchantId: shopee.id,
        title: `Mini Beads 2.6mm - Cor ${c.code} (${c.name}) 1.000un`,
        url: `https://shopee.com.br/search?keyword=${encodeURIComponent(`mini beads 2.6mm ${c.code}`)}`,
        affiliateUrl: `https://shopee.com.br/search?keyword=${encodeURIComponent(`mini beads 2.6mm ${c.code}`)}&utm_source=beadforge`,
        brand: 'pindoo',
        beadSize: '2.6mm',
        colorCode: c.code,
        colorHex: c.hex,
        quantityPerPack: 1000,
        priceBrl: String(c.price.toFixed(2)),
        pricePerBead: String((c.price / 1000).toFixed(4)),
        rating: '4.90',
        reviewCount: 240,
        isAvailable: true,
        productType: 'single_color',
        estimatedShippingDays: 4,
        isActive: true,
      });
      inserted++;
    }

    // Mercado Livre
    const [existingMl] = await db
      .select()
      .from(affiliateProduct)
      .where(and(eq(affiliateProduct.merchantId, ml.id), eq(affiliateProduct.colorCode, c.code)))
      .limit(1);

    if (!existingMl) {
      await db.insert(affiliateProduct).values({
        id: crypto.randomUUID(),
        merchantId: ml.id,
        title: `Refil Hama Mini Beads 2.6mm Cor ${c.code} 1000 Peças`,
        url: `https://lista.mercadolivre.com.br/${encodeURIComponent(`mini beads 2.6mm ${c.code}`)}`,
        affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(`mini beads 2.6mm ${c.code}`)}`,
        brand: 'pindoo',
        beadSize: '2.6mm',
        colorCode: c.code,
        colorHex: c.hex,
        quantityPerPack: 1000,
        priceBrl: '16.90',
        pricePerBead: '0.0169',
        rating: '4.85',
        reviewCount: 85,
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
