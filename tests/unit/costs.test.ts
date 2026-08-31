import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

import { calculateProjectCostAction } from '../../app/actions/costs';

// Mock auth and db for unit testing calculations
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'test-config',
          userId: 'test-user',
          laborRatePerHourBrl: '25.00',
          averageBeadsPerHour: 600,
          wastePct: '10.00',
          packagingCostBrl: '5.00',
          overheadMonthlyBrl: '50.00',
          defaultMarginPct: '35.00',
          defaultChannelFeePct: '14.00',
        }]),
      }),
    }),
  },
}));

describe('Calculadora de Custos e Orçamentos (Studio Tier)', () => {
  it('calcula corretamente o custo de produção, margem e preço de venda com taxas', async () => {
    // Projeto com 1.200 beads, custo base de material R$ 18,00
    const result = await calculateProjectCostAction({
      projectName: 'Quadro Mario 3D',
      totalBeads: 1200,
      baseMaterialCostBrl: 18.0,
      customLaborHours: 2.0,
      customLaborRateBrl: 25.0, // R$ 50,00 mão de obra
      customWastePct: 10.0,     // 10% de R$ 18 = R$ 1,80 -> R$ 19,80 material
      customPackagingBrl: 5.0,  // R$ 5,00 embalagem
      customMarginPct: 30.0,    // 30% lucro sobre custo
      customChannelFeePct: 10.0 // 10% comissão Shopee/ML
    });

    // Custo de produção = 19.80 (mat) + 50.00 (mão de obra) + 5.00 (embalagem) = 74.80
    expect(result.totalProductionCostBrl).toBe(74.8);

    // Subtotal com lucro 30% = 74.80 + 22.44 = 97.24
    expect(result.subtotalWithProfitBrl).toBe(97.24);

    // Preço final com taxa de canal 10% = 97.24 / 0.90 = 108.04
    expect(result.suggestedSellingPriceBrl).toBeCloseTo(108.04, 1);

    // Retorno por hora do artesão (mão de obra + lucro) / 2h = (50 + 22.44) / 2 = 36.22 / hora
    expect(result.hourlyEarningsBrl).toBeGreaterThan(25.0);

    // Mensagem WhatsApp formatada
    expect(result.whatsappMessage).toContain('Quadro Mario 3D');
    expect(result.whatsappMessage).toContain('1.200');
    expect(result.whatsappMessage).toContain('Investimento');
  });

  it('calcula tempo estimado de trabalho baseado na velocidade de montagem quando não especificado', async () => {
    // 600 beads com velocidade padrão de 600 beads/h = 1.0 hora
    const result = await calculateProjectCostAction({
      projectName: 'Chaveiro Pokeball',
      totalBeads: 600,
      baseMaterialCostBrl: 9.0,
      customLaborRateBrl: 30.0,
    });

    expect(result.estimatedLaborHours).toBe(1.0);
    expect(result.laborCostBrl).toBe(30.0);
  });
});
