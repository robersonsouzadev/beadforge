'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { project } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { getUserSubscription } from '@/lib/subscription';
import { generateThumbnailFromGrid, generateThumbnailFromGrid3D } from '@/lib/thumbnail';

export async function getUserProjects() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  const projects = await db
    .select({
      id: project.id,
      name: project.name,
      mode: project.mode,
      thumbnail: project.thumbnail,
      data: project.data,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    .from(project)
    .where(eq(project.userId, session.user.id))
    .orderBy(desc(project.updatedAt));

  return projects.map((p) => {
    let thumb = p.thumbnail;
    if (!thumb && p.data) {
      const data = p.data as any;
      if (data.originalImage && typeof data.originalImage === 'string' && data.originalImage.startsWith('data:image')) {
        thumb = data.originalImage;
      } else if (data.imageBase64 && typeof data.imageBase64 === 'string' && data.imageBase64.startsWith('data:image')) {
        thumb = data.imageBase64;
      } else if (data.grid) {
        thumb = generateThumbnailFromGrid(data.grid);
      } else if (data.grid3D) {
        thumb = generateThumbnailFromGrid3D(data.grid3D);
      }
    }

    return {
      id: p.id,
      name: p.name,
      mode: p.mode,
      thumbnail: thumb || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}

export async function getProjectById(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado');
  }

  const [proj] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
    .limit(1);

  if (!proj) {
    throw new Error('Projeto não encontrado');
  }

  return proj;
}

export async function saveProjectAction(data: {
  id?: string;
  name: string;
  mode: '2d' | 'ultra';
  projectData: any;
  thumbnail?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado para salvar projetos.');
  }

  const userId = session.user.id;
  const userSub = await getUserSubscription(userId);

  // If updating existing project
  if (data.id) {
    const [existing] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, data.id), eq(project.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new Error('Projeto não encontrado.');
    }

    await db
      .update(project)
      .set({
        name: data.name,
        mode: data.mode,
        data: data.projectData,
        thumbnail: data.thumbnail || existing.thumbnail,
        updatedAt: new Date(),
      })
      .where(eq(project.id, data.id));

    revalidatePath('/dashboard');
    return { success: true, id: data.id };
  }

  // If creating new project -> check tier limits!
  const [projectCountResult] = await db
    .select({ count: count() })
    .from(project)
    .where(eq(project.userId, userId));

  const totalProjects = Number(projectCountResult?.count || 0);

  if (totalProjects >= userSub.plan.limits.maxProjects) {
    throw new Error(
      `Você atingiu o limite de ${userSub.plan.limits.maxProjects} projetos do Plano Gratuito. Faça o upgrade para o Plano Pro para projetos ilimitados!`
    );
  }

  // Check 3D access for Free users
  if (data.mode === 'ultra' && !userSub.isPro) {
    throw new Error(
      'Salvar projetos no formato Ultra 3D é exclusivo para assinantes Pro.'
    );
  }

  const newId = crypto.randomUUID();

  await db.insert(project).values({
    id: newId,
    userId,
    name: data.name,
    mode: data.mode,
    data: data.projectData,
    thumbnail: data.thumbnail,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/dashboard');
  return { success: true, id: newId };
}

export async function deleteProjectAction(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Não autorizado');
  }

  await db
    .delete(project)
    .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)));

  revalidatePath('/dashboard');
  return { success: true };
}
