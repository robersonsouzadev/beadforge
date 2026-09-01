'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { approval, order, project, user, client } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateThumbnailFromGrid, generateThumbnailFromGrid3D } from '@/lib/thumbnail';

export interface PublicApprovalDTO {
  token: string;
  orderTitle: string;
  projectName: string;
  sellerName: string;
  status: 'pending' | 'approved' | 'revision_requested';
  thumbnailUrl?: string | null;
  patternSnapshot: {
    totalBeads: number;
    colorCount: number;
    dimensions: string;
    colors: Array<{
      code: string;
      name: string;
      hex: string;
      count: number;
    }>;
  };
  clientComment?: string | null;
  respondedAt?: Date | null;
  createdAt: Date;
}

export async function createApprovalAction(orderId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado.');
  }

  // Get order
  const [existingOrder] = await db
    .select()
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);

  if (!existingOrder || existingOrder.userId !== session.user.id) {
    throw new Error('Pedido não encontrado.');
  }

  // Get associated project if exists
  let patternSnapshot = {
    totalBeads: 0,
    colorCount: 0,
    dimensions: '29x29',
    colors: [] as Array<{ code: string; name: string; hex: string; count: number }>,
  };
  let thumbnailUrl: string | null = null;

  if (existingOrder.projectId) {
    const [proj] = await db
      .select()
      .from(project)
      .where(eq(project.id, existingOrder.projectId))
      .limit(1);

    if (proj) {
      thumbnailUrl = proj.thumbnail;
      const projData = proj.data as any;
      const summary = projData?.summary || [];
      const grid = projData?.grid;
      const grid3D = projData?.grid3D;

      if (!thumbnailUrl) {
        if (grid) {
          thumbnailUrl = generateThumbnailFromGrid(grid);
        } else if (grid3D) {
          thumbnailUrl = generateThumbnailFromGrid3D(grid3D);
        }
      }

      patternSnapshot = {
        totalBeads: grid?.totalBeads || summary.reduce((a: number, b: any) => a + (b.count || 0), 0),
        colorCount: summary.length,
        dimensions: grid ? `${grid.width}x${grid.height}` : (grid3D ? `${grid3D.width}x${grid3D.height} (${grid3D.layers?.length || 1} cam)` : '29x29'),
        colors: summary.map((s: any) => ({
          code: s.code || s.beadCode || '',
          name: s.name || s.colorName || '',
          hex: s.hex || s.colorHex || '#000000',
          count: s.count || s.quantity || 0,
        })),
      };
    }
  }

  // Check if approval already exists for this order
  const [existingApproval] = await db
    .select()
    .from(approval)
    .where(eq(approval.orderId, orderId))
    .limit(1);

  if (existingApproval) {
    // Update snapshot
    await db
      .update(approval)
      .set({
        patternSnapshot,
        thumbnailUrl: thumbnailUrl || existingApproval.thumbnailUrl,
        status: 'pending',
      })
      .where(eq(approval.id, existingApproval.id));

    await db
      .update(order)
      .set({ status: 'pending_approval', updatedAt: new Date() })
      .where(eq(order.id, orderId));

    revalidatePath('/orders');
    return {
      success: true,
      token: existingApproval.token,
      approvalUrl: `/approvals/${existingApproval.token}`,
    };
  }

  const token = crypto.randomUUID();
  await db.insert(approval).values({
    id: crypto.randomUUID(),
    orderId,
    token,
    patternSnapshot,
    thumbnailUrl,
    status: 'pending',
    revisionCount: 0,
    maxRevisions: 3,
    createdAt: new Date(),
  });

  await db
    .update(order)
    .set({ status: 'pending_approval', updatedAt: new Date() })
    .where(eq(order.id, orderId));

  revalidatePath('/orders');
  return {
    success: true,
    token,
    approvalUrl: `/approvals/${token}`,
  };
}

export async function getPublicApprovalAction(
  token: string
): Promise<PublicApprovalDTO | null> {
  const [app] = await db
    .select({
      approval: approval,
      order: order,
      user: user,
    })
    .from(approval)
    .innerJoin(order, eq(approval.orderId, order.id))
    .innerJoin(user, eq(order.userId, user.id))
    .where(eq(approval.token, token))
    .limit(1);

  if (!app) {
    return null;
  }

  let thumbnailUrl = app.approval.thumbnailUrl;
  let snapshot = app.approval.patternSnapshot as any;

  // Fallback: se o thumbnail ou snapshot estiver vazio, busca do projeto original
  if ((!thumbnailUrl || !snapshot || !snapshot.colors || snapshot.colors.length === 0) && app.order.projectId) {
    const [proj] = await db
      .select()
      .from(project)
      .where(eq(project.id, app.order.projectId))
      .limit(1);

    if (proj) {
      const projData = proj.data as any;
      if (!thumbnailUrl) {
        if (proj.thumbnail) {
          thumbnailUrl = proj.thumbnail;
        } else if (projData?.grid) {
          thumbnailUrl = generateThumbnailFromGrid(projData.grid);
        } else if (projData?.grid3D) {
          thumbnailUrl = generateThumbnailFromGrid3D(projData.grid3D);
        }
      }

      if (!snapshot || !snapshot.colors || snapshot.colors.length === 0) {
        const summary = projData?.summary || [];
        const grid = projData?.grid;
        const grid3D = projData?.grid3D;
        snapshot = {
          totalBeads: grid?.totalBeads || summary.reduce((a: number, b: any) => a + (b.count || 0), 0),
          colorCount: summary.length,
          dimensions: grid ? `${grid.width}x${grid.height}` : (grid3D ? `${grid3D.width}x${grid3D.height}` : '29x29'),
          colors: summary.map((s: any) => ({
            code: s.code || s.beadCode || '',
            name: s.name || s.colorName || '',
            hex: s.hex || s.colorHex || '#000000',
            count: s.count || s.quantity || 0,
          })),
        };
      }
    }
  }

  return {
    token: app.approval.token,
    orderTitle: app.order.title,
    projectName: app.order.title,
    sellerName: app.user.name || 'Ateliê de Beads',
    status: app.approval.status as 'pending' | 'approved' | 'revision_requested',
    thumbnailUrl: thumbnailUrl,
    patternSnapshot: snapshot || { totalBeads: 0, colorCount: 0, dimensions: '', colors: [] },
    clientComment: app.approval.clientComment,
    respondedAt: app.approval.respondedAt,
    createdAt: app.approval.createdAt,
  };
}

export async function respondToApprovalAction(
  token: string,
  decision: 'approved' | 'revision_requested',
  clientComment?: string
) {
  const [app] = await db
    .select()
    .from(approval)
    .where(eq(approval.token, token))
    .limit(1);

  if (!app) {
    throw new Error('Link de aprovação inválido ou expirado.');
  }

  const newRevisionCount =
    decision === 'revision_requested' ? (app.revisionCount || 0) + 1 : app.revisionCount;

  await db
    .update(approval)
    .set({
      status: decision,
      clientComment: clientComment?.trim() || null,
      revisionCount: newRevisionCount,
      respondedAt: new Date(),
    })
    .where(eq(approval.id, app.id));

  // Update order status
  await db
    .update(order)
    .set({
      status: decision === 'approved' ? 'approved' : 'pending_approval',
      updatedAt: new Date(),
    })
    .where(eq(order.id, app.orderId));

  revalidatePath(`/approvals/${token}`);
  revalidatePath('/orders');
  return { success: true };
}
