'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { inventory, inventoryItem } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPaletteById } from '@/data/palettes';
import type { BeadSummary } from '@/core/schemas/project';

export interface InventoryItemDTO {
  id: string;
  inventoryId: string;
  brand: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  quantity: number;
  unitCostBrl: number;
  size: 'midi' | 'mini';
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStats {
  totalColors: number;
  totalBeads: number;
  totalValueBrl: number;
  lowStockCount: number;
}

export interface BOMStockCheckResult {
  totalRequiredBeads: number;
  totalAvailableBeads: number;
  totalMissingBeads: number;
  estimatedMaterialCost: number;
  isFullyInStock: boolean;
  colorsInStockCount: number;
  colorsMissingCount: number;
  items: Array<{
    code: string;
    name: string;
    hex: string;
    needed: number;
    inStock: number;
    missing: number;
    unitCostBrl: number;
    status: 'in_stock' | 'partial' | 'missing';
  }>;
}

async function getOrCreateUserInventory(userId: string) {
  const [existing] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const newId = crypto.randomUUID();
  const [created] = await db
    .insert(inventory)
    .values({
      id: newId,
      userId,
      name: 'Meu Estoque Principal',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function getUserInventory(): Promise<{
  inventory: typeof inventory.$inferSelect | null;
  items: InventoryItemDTO[];
  stats: InventoryStats;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      inventory: null,
      items: [],
      stats: {
        totalColors: 0,
        totalBeads: 0,
        totalValueBrl: 0,
        lowStockCount: 0,
      },
    };
  }

  const inv = await getOrCreateUserInventory(session.user.id);

  const rawItems = await db
    .select()
    .from(inventoryItem)
    .where(eq(inventoryItem.inventoryId, inv.id))
    .orderBy(inventoryItem.brand, inventoryItem.colorCode);

  let totalBeads = 0;
  let totalValueBrl = 0;
  let lowStockCount = 0;

  const items: InventoryItemDTO[] = rawItems.map((item) => {
    const qty = Number(item.quantity || 0);
    const unitCost = Number(item.unitCostBrl || 0.015);
    totalBeads += qty;
    totalValueBrl += qty * unitCost;
    if (qty <= (item.lowStockThreshold || 100)) {
      lowStockCount++;
    }

    return {
      id: item.id,
      inventoryId: item.inventoryId,
      brand: item.brand,
      colorCode: item.colorCode,
      colorName: item.colorName,
      colorHex: item.colorHex,
      quantity: qty,
      unitCostBrl: unitCost,
      size: (item.size as 'midi' | 'mini') || 'midi',
      lowStockThreshold: item.lowStockThreshold || 100,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  return {
    inventory: inv,
    items,
    stats: {
      totalColors: items.length,
      totalBeads,
      totalValueBrl,
      lowStockCount,
    },
  };
}

export async function addOrUpdateInventoryItemAction(data: {
  id?: string;
  brand: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  quantity: number;
  unitCostBrl?: number;
  size?: 'midi' | 'mini';
  lowStockThreshold?: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado para gerenciar o estoque.');
  }

  const inv = await getOrCreateUserInventory(session.user.id);
  const brand = data.brand.toLowerCase().trim();
  const colorCode = data.colorCode.trim().toUpperCase();
  const size = data.size || 'midi';
  const unitCostStr = (data.unitCostBrl ?? 0.015).toFixed(4);

  // If specific item ID provided for editing
  if (data.id) {
    await db
      .update(inventoryItem)
      .set({
        brand,
        colorCode,
        colorName: data.colorName.trim(),
        colorHex: data.colorHex.trim(),
        quantity: Math.max(0, data.quantity),
        unitCostBrl: unitCostStr,
        size,
        lowStockThreshold: data.lowStockThreshold ?? 100,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryItem.id, data.id),
          eq(inventoryItem.inventoryId, inv.id)
        )
      );

    revalidatePath('/inventory');
    return { success: true, id: data.id };
  }

  // Check if item with matching brand + code + size already exists in this inventory
  const [existing] = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.inventoryId, inv.id),
        eq(inventoryItem.brand, brand),
        eq(inventoryItem.colorCode, colorCode),
        eq(inventoryItem.size, size)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(inventoryItem)
      .set({
        colorName: data.colorName.trim() || existing.colorName,
        colorHex: data.colorHex.trim() || existing.colorHex,
        quantity: existing.quantity + Math.max(0, data.quantity),
        unitCostBrl: unitCostStr,
        lowStockThreshold: data.lowStockThreshold ?? existing.lowStockThreshold,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItem.id, existing.id));

    revalidatePath('/inventory');
    return { success: true, id: existing.id };
  }

  const newId = crypto.randomUUID();
  await db.insert(inventoryItem).values({
    id: newId,
    inventoryId: inv.id,
    brand,
    colorCode,
    colorName: data.colorName.trim(),
    colorHex: data.colorHex.trim(),
    quantity: Math.max(0, data.quantity),
    unitCostBrl: unitCostStr,
    size,
    lowStockThreshold: data.lowStockThreshold ?? 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/inventory');
  return { success: true, id: newId };
}

export async function updateItemQuantityAction(
  itemId: string,
  amount: number,
  mode: 'set' | 'delta' = 'set'
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado.');
  }

  const inv = await getOrCreateUserInventory(session.user.id);

  const [existing] = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.id, itemId),
        eq(inventoryItem.inventoryId, inv.id)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error('Item do estoque não encontrado.');
  }

  const newQuantity =
    mode === 'delta'
      ? Math.max(0, existing.quantity + amount)
      : Math.max(0, amount);

  await db
    .update(inventoryItem)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItem.id, itemId));

  revalidatePath('/inventory');
  return { success: true, quantity: newQuantity };
}

export async function deleteInventoryItemAction(itemId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado.');
  }

  const inv = await getOrCreateUserInventory(session.user.id);

  await db
    .delete(inventoryItem)
    .where(
      and(
        eq(inventoryItem.id, itemId),
        eq(inventoryItem.inventoryId, inv.id)
      )
    );

  revalidatePath('/inventory');
  return { success: true };
}

export async function populateFromPaletteAction(
  paletteId: string,
  defaultQuantity: number = 1000,
  unitCostBrl: number = 0.015
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado.');
  }

  const inv = await getOrCreateUserInventory(session.user.id);
  const palette = getPaletteById(paletteId);

  if (!palette || !palette.colors || palette.colors.length === 0) {
    throw new Error('Paleta não encontrada ou sem cores cadastradas.');
  }

  const brand =
    paletteId.includes('pindoo') ? 'pindoo' :
    paletteId.includes('hama') ? 'hama' :
    paletteId.includes('artkal') ? 'artkal' : 'other';

  const size = paletteId.includes('mini') ? 'mini' : 'midi';
  const unitCostStr = unitCostBrl.toFixed(4);

  // Fetch existing to avoid duplicates
  const existingItems = await db
    .select({ colorCode: inventoryItem.colorCode })
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.inventoryId, inv.id),
        eq(inventoryItem.brand, brand),
        eq(inventoryItem.size, size)
      )
    );

  const existingSet = new Set(existingItems.map((i) => i.colorCode.toUpperCase()));

  const newItemsToInsert = palette.colors
    .filter((c) => !existingSet.has(c.code.toUpperCase()))
    .map((c) => ({
      id: crypto.randomUUID(),
      inventoryId: inv.id,
      brand,
      colorCode: c.code,
      colorName: c.name,
      colorHex: c.hex,
      quantity: defaultQuantity,
      unitCostBrl: unitCostStr,
      size,
      lowStockThreshold: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  if (newItemsToInsert.length > 0) {
    await db.insert(inventoryItem).values(newItemsToInsert);
  }

  revalidatePath('/inventory');
  return { success: true, addedCount: newItemsToInsert.length };
}

export async function checkBOMInventoryStock(
  summary: BeadSummary[]
): Promise<BOMStockCheckResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !summary || summary.length === 0) {
    const totalReq = summary?.reduce((acc, s) => acc + s.count, 0) || 0;
    return {
      totalRequiredBeads: totalReq,
      totalAvailableBeads: 0,
      totalMissingBeads: totalReq,
      estimatedMaterialCost: totalReq * 0.015,
      isFullyInStock: false,
      colorsInStockCount: 0,
      colorsMissingCount: summary?.length || 0,
      items: (summary || []).map((s) => ({
        code: s.code,
        name: s.name,
        hex: s.hex,
        needed: s.count,
        inStock: 0,
        missing: s.count,
        unitCostBrl: 0.015,
        status: 'missing',
      })),
    };
  }

  const inv = await getOrCreateUserInventory(session.user.id);
  const rawItems = await db
    .select()
    .from(inventoryItem)
    .where(eq(inventoryItem.inventoryId, inv.id));

  const inventoryMap = new Map<string, typeof inventoryItem.$inferSelect>();
  for (const item of rawItems) {
    inventoryMap.set(item.colorCode.toUpperCase(), item);
  }

  let totalRequiredBeads = 0;
  let totalAvailableBeads = 0;
  let totalMissingBeads = 0;
  let estimatedMaterialCost = 0;
  let colorsInStockCount = 0;
  let colorsMissingCount = 0;

  const items = summary.map((s) => {
    const codeKey = s.code.toUpperCase();
    const invItem = inventoryMap.get(codeKey);
    const inStock = invItem ? Number(invItem.quantity) : 0;
    const unitCost = invItem ? Number(invItem.unitCostBrl || 0.015) : 0.015;
    const needed = s.count;

    totalRequiredBeads += needed;
    totalAvailableBeads += Math.min(needed, inStock);
    estimatedMaterialCost += needed * unitCost;

    const missing = Math.max(0, needed - inStock);
    totalMissingBeads += missing;

    let status: 'in_stock' | 'partial' | 'missing' = 'missing';
    if (inStock >= needed) {
      status = 'in_stock';
      colorsInStockCount++;
    } else if (inStock > 0) {
      status = 'partial';
      colorsMissingCount++;
    } else {
      status = 'missing';
      colorsMissingCount++;
    }

    return {
      code: s.code,
      name: s.name,
      hex: s.hex,
      needed,
      inStock,
      missing,
      unitCostBrl: unitCost,
      status,
    };
  });

  return {
    totalRequiredBeads,
    totalAvailableBeads,
    totalMissingBeads,
    estimatedMaterialCost,
    isFullyInStock: totalMissingBeads === 0,
    colorsInStockCount,
    colorsMissingCount,
    items,
  };
}

export async function deductProjectStockAction(summary: BeadSummary[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado para dar baixa no estoque.');
  }

  const inv = await getOrCreateUserInventory(session.user.id);
  const rawItems = await db
    .select()
    .from(inventoryItem)
    .where(eq(inventoryItem.inventoryId, inv.id));

  const inventoryMap = new Map<string, typeof inventoryItem.$inferSelect>();
  for (const item of rawItems) {
    inventoryMap.set(item.colorCode.toUpperCase(), item);
  }

  for (const s of summary) {
    const codeKey = s.code.toUpperCase();
    const invItem = inventoryMap.get(codeKey);
    if (invItem) {
      const newQty = Math.max(0, invItem.quantity - s.count);
      await db
        .update(inventoryItem)
        .set({
          quantity: newQty,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItem.id, invItem.id));
    }
  }

  revalidatePath('/inventory');
  return { success: true };
}
