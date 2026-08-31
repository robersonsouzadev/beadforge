'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { client, order } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export interface ClientDTO {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
  notes?: string | null;
  totalOrdersCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getClientsAction(): Promise<ClientDTO[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  const rawClients = await db
    .select()
    .from(client)
    .where(eq(client.userId, session.user.id))
    .orderBy(desc(client.updatedAt));

  const ordersCountMap = new Map<string, number>();
  const clientOrders = await db
    .select({ clientId: order.clientId, count: count() })
    .from(order)
    .where(eq(order.userId, session.user.id))
    .groupBy(order.clientId);

  for (const o of clientOrders) {
    if (o.clientId) {
      ordersCountMap.set(o.clientId, Number(o.count));
    }
  }

  return rawClients.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    instagram: c.instagram,
    notes: c.notes,
    totalOrdersCount: ordersCountMap.get(c.id) || 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function createOrUpdateClientAction(data: {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  instagram?: string;
  notes?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado.');
  }

  const userId = session.user.id;
  const name = data.name.trim();

  if (!name) {
    throw new Error('O nome do cliente é obrigatório.');
  }

  // Format clean phone number
  const cleanPhone = data.phone ? data.phone.replace(/[^0-9+]/g, '') : null;
  const cleanInstagram = data.instagram ? data.instagram.replace(/^@/, '').trim() : null;

  if (data.id) {
    await db
      .update(client)
      .set({
        name,
        email: data.email?.trim() || null,
        phone: cleanPhone,
        instagram: cleanInstagram,
        notes: data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(client.id, data.id), eq(client.userId, userId)));

    revalidatePath('/clients');
    revalidatePath('/orders');
    return { success: true, id: data.id };
  }

  const newId = crypto.randomUUID();
  await db.insert(client).values({
    id: newId,
    userId,
    name,
    email: data.email?.trim() || null,
    phone: cleanPhone,
    instagram: cleanInstagram,
    notes: data.notes?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/clients');
  revalidatePath('/orders');
  return { success: true, id: newId };
}

export async function deleteClientAction(clientId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado.');
  }

  await db
    .delete(client)
    .where(and(eq(client.id, clientId), eq(client.userId, session.user.id)));

  revalidatePath('/clients');
  revalidatePath('/orders');
  return { success: true };
}
