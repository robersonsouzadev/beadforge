'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { order, client, project, approval } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'pending_approval'
  | 'approved'
  | 'in_production'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export interface OrderDTO {
  id: string;
  userId: string;
  clientId?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectThumbnail?: string | null;
  title: string;
  status: OrderStatus;
  quotedPriceBrl: number;
  materialCostBrl: number;
  laborCostBrl: number;
  finalPriceBrl: number;
  channel: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  approvalToken?: string | null;
  approvalStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrdersAction(): Promise<OrderDTO[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  const userId = session.user.id;

  const rawOrders = await db
    .select({
      order: order,
      client: client,
      project: project,
      approval: approval,
    })
    .from(order)
    .leftJoin(client, eq(order.clientId, client.id))
    .leftJoin(project, eq(order.projectId, project.id))
    .leftJoin(approval, eq(approval.orderId, order.id))
    .where(eq(order.userId, userId))
    .orderBy(desc(order.updatedAt));

  return rawOrders.map(({ order: o, client: c, project: p, approval: a }) => ({
    id: o.id,
    userId: o.userId,
    clientId: o.clientId,
    clientName: c?.name || null,
    clientPhone: c?.phone || null,
    projectId: o.projectId,
    projectName: p?.name || null,
    projectThumbnail: p?.thumbnail || null,
    title: o.title,
    status: o.status as OrderStatus,
    quotedPriceBrl: Number(o.quotedPriceBrl || 0),
    materialCostBrl: Number(o.materialCostBrl || 0),
    laborCostBrl: Number(o.laborCostBrl || 0),
    finalPriceBrl: Number(o.finalPriceBrl || 0),
    channel: o.channel || 'direct',
    dueDate: o.dueDate,
    completedAt: o.completedAt,
    notes: o.notes,
    approvalToken: a?.token || null,
    approvalStatus: a?.status || null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));
}

export async function createOrUpdateOrderAction(data: {
  id?: string;
  title: string;
  clientId?: string;
  projectId?: string;
  status?: OrderStatus;
  quotedPriceBrl?: number;
  materialCostBrl?: number;
  laborCostBrl?: number;
  finalPriceBrl?: number;
  channel?: string;
  dueDate?: string | null;
  notes?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado.');
  }

  const userId = session.user.id;
  const title = data.title.trim();

  if (!title) {
    throw new Error('O título do pedido é obrigatório.');
  }

  const quotedPriceStr = (data.quotedPriceBrl || 0).toFixed(2);
  const materialCostStr = (data.materialCostBrl || 0).toFixed(2);
  const laborCostStr = (data.laborCostBrl || 0).toFixed(2);
  const finalPriceStr = (data.finalPriceBrl || data.quotedPriceBrl || 0).toFixed(2);
  const dueDateObj = data.dueDate ? new Date(data.dueDate) : null;

  if (data.id) {
    await db
      .update(order)
      .set({
        title,
        clientId: data.clientId || null,
        projectId: data.projectId || null,
        status: data.status || 'draft',
        quotedPriceBrl: quotedPriceStr,
        materialCostBrl: materialCostStr,
        laborCostBrl: laborCostStr,
        finalPriceBrl: finalPriceStr,
        channel: data.channel || 'direct',
        dueDate: dueDateObj,
        notes: data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(order.id, data.id), eq(order.userId, userId)));

    revalidatePath('/orders');
    return { success: true, id: data.id };
  }

  const newId = crypto.randomUUID();
  await db.insert(order).values({
    id: newId,
    userId,
    title,
    clientId: data.clientId || null,
    projectId: data.projectId || null,
    status: data.status || 'draft',
    quotedPriceBrl: quotedPriceStr,
    materialCostBrl: materialCostStr,
    laborCostBrl: laborCostStr,
    finalPriceBrl: finalPriceStr,
    channel: data.channel || 'direct',
    dueDate: dueDateObj,
    notes: data.notes?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/orders');
  return { success: true, id: newId };
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado.');
  }

  const completedAt =
    newStatus === 'completed' || newStatus === 'delivered'
      ? new Date()
      : null;

  await db
    .update(order)
    .set({
      status: newStatus,
      completedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(order.id, orderId), eq(order.userId, session.user.id)));

  revalidatePath('/orders');
  return { success: true };
}

export async function deleteOrderAction(orderId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado.');
  }

  await db
    .delete(order)
    .where(and(eq(order.id, orderId), eq(order.userId, session.user.id)));

  revalidatePath('/orders');
  return { success: true };
}
