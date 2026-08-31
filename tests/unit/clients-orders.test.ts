import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: 'seller-123', name: 'Ateliê Geek Beads' },
      }),
    },
  },
}));

vi.mock('@/db', () => {
  const mockOrders = [
    {
      order: {
        id: 'ord-1',
        userId: 'seller-123',
        clientId: 'cli-1',
        projectId: 'proj-1',
        title: 'Quadro Charmander Pixel Art',
        status: 'pending_approval',
        quotedPriceBrl: '120.00',
        materialCostBrl: '22.00',
        laborCostBrl: '50.00',
        finalPriceBrl: '120.00',
        channel: 'whatsapp',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      client: {
        id: 'cli-1',
        name: 'Maria Silva',
        phone: '5511999998888',
      },
      project: {
        id: 'proj-1',
        name: 'Charmander',
        thumbnail: 'data:image/svg+xml;base64,123',
      },
      approval: {
        id: 'app-1',
        token: 'token-uuid-12345',
        status: 'pending',
      },
    },
  ];

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockOrders),
                }),
              }),
            }),
          }),
          where: vi.fn().mockImplementation(() => ({
            orderBy: vi.fn().mockResolvedValue(mockOrders),
            limit: vi.fn().mockImplementation(() => {
              return Promise.resolve([
                {
                  id: 'ord-1',
                  orderId: 'ord-1',
                  userId: 'seller-123',
                  projectId: 'proj-1',
                  title: 'Quadro Charmander',
                  token: 'token-uuid-12345',
                  data: { summary: [] },
                },
              ]);
            }),
          })),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    },
  };
});

import { getOrdersAction } from '../../app/actions/orders';
import { createApprovalAction } from '../../app/actions/approvals';

describe('Gestão de Pedidos e Prova Pública (Studio Tier)', () => {
  it('lista pedidos com vínculo de cliente, projeto e token de aprovação', async () => {
    const orders = await getOrdersAction();
    expect(orders.length).toBe(1);
    expect(orders[0].title).toBe('Quadro Charmander Pixel Art');
    expect(orders[0].clientName).toBe('Maria Silva');
    expect(orders[0].approvalToken).toBe('token-uuid-12345');
    expect(orders[0].status).toBe('pending_approval');
  });

  it('cria token e link público de aprovação para um pedido', async () => {
    const result = await createApprovalAction('ord-1');
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.approvalUrl).toContain('/approvals/');
  });
});
