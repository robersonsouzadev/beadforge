import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: 'test-user', name: 'Artesão Teste' },
      }),
    },
  },
}));

vi.mock('@/db', () => {
  const mockItems = [
    {
      id: 'inv-1',
      inventoryId: 'test-inv',
      brand: 'pindoo',
      colorCode: 'P01',
      colorName: 'Preto',
      colorHex: '#000000',
      quantity: 1000,
      unitCostBrl: '0.0150',
      size: 'midi',
      lowStockThreshold: 100,
    },
    {
      id: 'inv-2',
      inventoryId: 'test-inv',
      brand: 'pindoo',
      colorCode: 'P02',
      colorName: 'Branco',
      colorHex: '#FFFFFF',
      quantity: 200,
      unitCostBrl: '0.0150',
      size: 'midi',
      lowStockThreshold: 100,
    },
  ];

  const whereMock = vi.fn().mockImplementation(() => {
    const promise = Promise.resolve(mockItems);
    (promise as any).limit = vi.fn().mockResolvedValue([{ id: 'test-inv', userId: 'test-user' }]);
    return promise;
  });

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: whereMock,
          orderBy: vi.fn().mockResolvedValue(mockItems),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'test-inv' }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    },
  };
});

import { checkBOMInventoryStock } from '../../app/actions/inventory';

describe('Módulo de Inventário & Cruzamento com BOM (Studio Tier)', () => {
  it('cruza o BOM do projeto com o estoque e classifica itens disponíveis vs. faltantes', async () => {
    // Molde precisa de 500 pretos (P01) e 300 brancos (P02) e 100 vermelhos (P03)
    const projectSummary = [
      { code: 'P01', name: 'Preto', hex: '#000000', count: 500 },
      { code: 'P02', name: 'Branco', hex: '#FFFFFF', count: 300 },
      { code: 'P03', name: 'Vermelho', hex: '#FF0000', count: 100 },
    ];

    const result = await checkBOMInventoryStock(projectSummary);

    // Total necessário = 900
    expect(result.totalRequiredBeads).toBe(900);

    // Disponível = 500 (de 1000 P01) + 200 (de 200 P02) + 0 (P03) = 700
    expect(result.totalAvailableBeads).toBe(700);

    // Faltam = 0 (P01) + 100 (P02) + 100 (P03) = 200 beads faltantes
    expect(result.totalMissingBeads).toBe(200);

    expect(result.isFullyInStock).toBe(false);

    // P01 está in_stock
    const p01 = result.items.find((i) => i.code === 'P01');
    expect(p01?.status).toBe('in_stock');
    expect(p01?.missing).toBe(0);

    // P02 está partial (tem 200, precisa de 300)
    const p02 = result.items.find((i) => i.code === 'P02');
    expect(p02?.status).toBe('partial');
    expect(p02?.missing).toBe(100);

    // P03 está missing (tem 0)
    const p03 = result.items.find((i) => i.code === 'P03');
    expect(p03?.status).toBe('missing');
    expect(p03?.missing).toBe(100);
  });
});
