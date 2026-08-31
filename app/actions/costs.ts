'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { costConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CostConfigDTO {
  id: string;
  userId: string;
  laborRatePerHourBrl: number;
  averageBeadsPerHour: number;
  wastePct: number;
  packagingCostBrl: number;
  overheadMonthlyBrl: number;
  defaultMarginPct: number;
  defaultChannelFeePct: number;
}

export interface ProjectCostCalculationResult {
  totalBeads: number;
  baseMaterialCostBrl: number;
  wasteAmountBrl: number;
  totalMaterialCostBrl: number;
  estimatedLaborHours: number;
  laborCostBrl: number;
  packagingCostBrl: number;
  totalProductionCostBrl: number;
  profitMarginPct: number;
  netProfitBrl: number;
  subtotalWithProfitBrl: number;
  channelFeePct: number;
  channelFeeAmountBrl: number;
  suggestedSellingPriceBrl: number;
  hourlyEarningsBrl: number;
  whatsappMessage: string;
}

export async function getUserCostConfig(): Promise<CostConfigDTO> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const defaultValues: CostConfigDTO = {
    id: '',
    userId: session?.user?.id || '',
    laborRatePerHourBrl: 25.0,
    averageBeadsPerHour: 600,
    wastePct: 10.0,
    packagingCostBrl: 5.0,
    overheadMonthlyBrl: 50.0,
    defaultMarginPct: 35.0,
    defaultChannelFeePct: 14.0, // Taxa média padrão de marketplaces (Shopee/ML)
  };

  if (!session?.user) {
    return defaultValues;
  }

  const [existing] = await db
    .select()
    .from(costConfig)
    .where(eq(costConfig.userId, session.user.id))
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      laborRatePerHourBrl: Number(existing.laborRatePerHourBrl || 25),
      averageBeadsPerHour: Number(existing.averageBeadsPerHour || 600),
      wastePct: Number(existing.wastePct || 10),
      packagingCostBrl: Number(existing.packagingCostBrl || 5),
      overheadMonthlyBrl: Number(existing.overheadMonthlyBrl || 50),
      defaultMarginPct: Number(existing.defaultMarginPct || 35),
      defaultChannelFeePct: Number(existing.defaultChannelFeePct || 14),
    };
  }

  const newId = crypto.randomUUID();
  const [created] = await db
    .insert(costConfig)
    .values({
      id: newId,
      userId: session.user.id,
      laborRatePerHourBrl: '25.00',
      averageBeadsPerHour: 600,
      wastePct: '10.00',
      packagingCostBrl: '5.00',
      overheadMonthlyBrl: '50.00',
      defaultMarginPct: '35.00',
      defaultChannelFeePct: '14.00',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    id: created.id,
    userId: created.userId,
    laborRatePerHourBrl: Number(created.laborRatePerHourBrl),
    averageBeadsPerHour: Number(created.averageBeadsPerHour),
    wastePct: Number(created.wastePct),
    packagingCostBrl: Number(created.packagingCostBrl),
    overheadMonthlyBrl: Number(created.overheadMonthlyBrl),
    defaultMarginPct: Number(created.defaultMarginPct),
    defaultChannelFeePct: Number(created.defaultChannelFeePct),
  };
}

export async function saveUserCostConfigAction(data: {
  laborRatePerHourBrl: number;
  averageBeadsPerHour: number;
  wastePct: number;
  packagingCostBrl: number;
  overheadMonthlyBrl: number;
  defaultMarginPct: number;
  defaultChannelFeePct: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado.');
  }

  const userId = session.user.id;
  const [existing] = await db
    .select()
    .from(costConfig)
    .where(eq(costConfig.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(costConfig)
      .set({
        laborRatePerHourBrl: data.laborRatePerHourBrl.toFixed(2),
        averageBeadsPerHour: Math.max(100, data.averageBeadsPerHour),
        wastePct: data.wastePct.toFixed(2),
        packagingCostBrl: data.packagingCostBrl.toFixed(2),
        overheadMonthlyBrl: data.overheadMonthlyBrl.toFixed(2),
        defaultMarginPct: data.defaultMarginPct.toFixed(2),
        defaultChannelFeePct: data.defaultChannelFeePct.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(costConfig.id, existing.id));
  } else {
    await db.insert(costConfig).values({
      id: crypto.randomUUID(),
      userId,
      laborRatePerHourBrl: data.laborRatePerHourBrl.toFixed(2),
      averageBeadsPerHour: Math.max(100, data.averageBeadsPerHour),
      wastePct: data.wastePct.toFixed(2),
      packagingCostBrl: data.packagingCostBrl.toFixed(2),
      overheadMonthlyBrl: data.overheadMonthlyBrl.toFixed(2),
      defaultMarginPct: data.defaultMarginPct.toFixed(2),
      defaultChannelFeePct: data.defaultChannelFeePct.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath('/inventory');
  return { success: true };
}

export async function calculateProjectCostAction(params: {
  projectName?: string;
  totalBeads: number;
  baseMaterialCostBrl: number;
  customLaborHours?: number;
  customLaborRateBrl?: number;
  customWastePct?: number;
  customPackagingBrl?: number;
  customMarginPct?: number;
  customChannelFeePct?: number;
}): Promise<ProjectCostCalculationResult> {
  const config = await getUserCostConfig();

  const totalBeads = Math.max(0, params.totalBeads);
  const baseMaterialCost = Math.max(0, params.baseMaterialCostBrl || totalBeads * 0.015);
  const wastePct = params.customWastePct ?? config.wastePct;
  const wasteAmount = baseMaterialCost * (wastePct / 100);
  const totalMaterialCost = baseMaterialCost + wasteAmount;

  const speedPerHour = config.averageBeadsPerHour > 0 ? config.averageBeadsPerHour : 600;
  const estimatedHours =
    params.customLaborHours !== undefined
      ? params.customLaborHours
      : Number((totalBeads / speedPerHour).toFixed(1)) || 0.5;

  const laborRate = params.customLaborRateBrl ?? config.laborRatePerHourBrl;
  const laborCost = estimatedHours * laborRate;

  const packagingCost = params.customPackagingBrl ?? config.packagingCostBrl;
  const totalProductionCost = totalMaterialCost + laborCost + packagingCost;

  const marginPct = params.customMarginPct ?? config.defaultMarginPct;
  const netProfit = totalProductionCost * (marginPct / 100);
  const subtotalWithProfit = totalProductionCost + netProfit;

  const channelFeePct = params.customChannelFeePct ?? config.defaultChannelFeePct;
  const feeFactor = 1 - channelFeePct / 100;
  const finalPrice = feeFactor > 0 ? subtotalWithProfit / feeFactor : subtotalWithProfit;
  const channelFeeAmount = finalPrice - subtotalWithProfit;

  const hourlyEarnings = estimatedHours > 0 ? (laborCost + netProfit) / estimatedHours : laborRate;

  const projName = params.projectName || 'Arte em Beads Personalizada';

  const formatBrl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const whatsappMessage =
`✨ *Proposta de Encomenda - ${projName}* ✨

Olá! Segue o detalhamento do seu pedido personalizado em Pixel Art / Fuse Beads:

🎨 *Especificações da Peça:*
• Projeto: ${projName}
• Total de peças (beads): ${totalBeads.toLocaleString('pt-BR')} peças
• Tempo estimado de produção: ~${estimatedHours}h
• Acabamento: Passado a ferro térmico + Embalagem de proteção

💎 *Investimento:*
• Valor do projeto: *${formatBrl(finalPrice)}*

📦 *Formas de Pagamento:*
• PIX (com desconto à vista) ou Cartão de Crédito em até 12x.

Ficou alguma dúvida ou deseja aprovar para iniciarmos a montagem?`;

  return {
    totalBeads,
    baseMaterialCostBrl: Number(baseMaterialCost.toFixed(2)),
    wasteAmountBrl: Number(wasteAmount.toFixed(2)),
    totalMaterialCostBrl: Number(totalMaterialCost.toFixed(2)),
    estimatedLaborHours: Number(estimatedHours.toFixed(1)),
    laborCostBrl: Number(laborCost.toFixed(2)),
    packagingCostBrl: Number(packagingCost.toFixed(2)),
    totalProductionCostBrl: Number(totalProductionCost.toFixed(2)),
    profitMarginPct: Number(marginPct.toFixed(1)),
    netProfitBrl: Number(netProfit.toFixed(2)),
    subtotalWithProfitBrl: Number(subtotalWithProfit.toFixed(2)),
    channelFeePct: Number(channelFeePct.toFixed(1)),
    channelFeeAmountBrl: Number(channelFeeAmount.toFixed(2)),
    suggestedSellingPriceBrl: Number(finalPrice.toFixed(2)),
    hourlyEarningsBrl: Number(hourlyEarnings.toFixed(2)),
    whatsappMessage,
  };
}
