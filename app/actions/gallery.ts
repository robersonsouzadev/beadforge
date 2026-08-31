'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { galleryPattern, creatorProfile, user, project } from '@/db/schema';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';

export interface GalleryPatternDTO {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  thumbnailUrl?: string | null;
  beadCount: number;
  colorCount: number;
  paletteName?: string | null;
  dimensions?: string | null;
  likesCount: number;
  remixCount: number;
  isValidated3D: boolean;
  publishedAt: Date;
  creator: {
    name: string;
    handle?: string | null;
    avatarUrl?: string | null;
  };
}

export interface PatternDetailsDTO extends GalleryPatternDTO {
  patternData: any;
  createdAt: Date;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  const rand = Math.random().toString(36).substring(2, 7);
  return `${base || 'molde-beads'}-${rand}`;
}

export async function getGalleryPatternsAction(options?: {
  search?: string;
  category?: string;
  sort?: 'popular' | 'recent' | 'small';
  limit?: number;
}): Promise<GalleryPatternDTO[]> {
  const search = options?.search?.trim();
  const category = options?.category && options.category !== 'all' ? options.category : null;
  const sort = options?.sort || 'popular';
  const limit = options?.limit || 40;

  let query = db
    .select({
      pattern: galleryPattern,
      user: user,
      profile: creatorProfile,
    })
    .from(galleryPattern)
    .innerJoin(user, eq(galleryPattern.userId, user.id))
    .leftJoin(creatorProfile, eq(creatorProfile.userId, user.id))
    .where(eq(galleryPattern.isPublished, true))
    .$dynamic();

  if (category) {
    query = query.where(eq(galleryPattern.category, category));
  }

  if (search) {
    query = query.where(
      or(
        ilike(galleryPattern.title, `%${search}%`),
        ilike(galleryPattern.description, `%${search}%`)
      )
    );
  }

  if (sort === 'recent') {
    query = query.orderBy(desc(galleryPattern.publishedAt));
  } else if (sort === 'small') {
    query = query.orderBy(galleryPattern.beadCount);
  } else {
    // popular
    query = query.orderBy(desc(galleryPattern.likesCount), desc(galleryPattern.remixCount));
  }

  const results = await query.limit(limit);

  return results.map(({ pattern: p, user: u, profile: cp }) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    thumbnailUrl: p.thumbnailUrl,
    beadCount: p.beadCount,
    colorCount: p.colorCount,
    paletteName: p.paletteName,
    dimensions: p.dimensions,
    likesCount: p.likesCount,
    remixCount: p.remixCount,
    isValidated3D: p.isValidated3D,
    publishedAt: p.publishedAt,
    creator: {
      name: cp?.displayName || u.name || 'Criador BeadForge',
      handle: cp?.handle || null,
      avatarUrl: cp?.avatarUrl || u.image || null,
    },
  }));
}

export async function getPatternBySlugAction(
  slug: string
): Promise<PatternDetailsDTO | null> {
  const [result] = await db
    .select({
      pattern: galleryPattern,
      user: user,
      profile: creatorProfile,
    })
    .from(galleryPattern)
    .innerJoin(user, eq(galleryPattern.userId, user.id))
    .leftJoin(creatorProfile, eq(creatorProfile.userId, user.id))
    .where(eq(galleryPattern.slug, slug))
    .limit(1);

  if (!result) {
    return null;
  }

  const { pattern: p, user: u, profile: cp } = result;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    thumbnailUrl: p.thumbnailUrl,
    patternData: p.patternData,
    beadCount: p.beadCount,
    colorCount: p.colorCount,
    paletteName: p.paletteName,
    dimensions: p.dimensions,
    likesCount: p.likesCount,
    remixCount: p.remixCount,
    isValidated3D: p.isValidated3D,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    creator: {
      name: cp?.displayName || u.name || 'Criador BeadForge',
      handle: cp?.handle || null,
      avatarUrl: cp?.avatarUrl || u.image || null,
    },
  };
}

export async function publishPatternToGalleryAction(
  projectId: string,
  data: {
    title: string;
    description?: string;
    category?: string;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar logado para publicar na galeria.');
  }

  const [proj] = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .limit(1);

  if (!proj || proj.userId !== session.user.id) {
    throw new Error('Projeto não encontrado.');
  }

  const projData = proj.data as any;
  const summary = projData?.summary || [];
  const grid = projData?.grid;

  const beadCount =
    grid?.totalBeads ||
    summary.reduce((acc: number, item: any) => acc + (item.count || 0), 0);
  const colorCount = summary.length;
  const dimensions = grid ? `${grid.width}x${grid.height}` : '29x29';
  const paletteName = projData?.activePaletteId || 'Pindoo Standard';

  // Check if already published
  const [existing] = await db
    .select()
    .from(galleryPattern)
    .where(
      and(
        eq(galleryPattern.projectId, projectId),
        eq(galleryPattern.userId, session.user.id)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(galleryPattern)
      .set({
        title: data.title.trim() || existing.title,
        description: data.description?.trim() || existing.description,
        category: data.category || existing.category,
        thumbnailUrl: proj.thumbnail || existing.thumbnailUrl,
        patternData: proj.data,
        beadCount,
        colorCount,
        paletteName,
        dimensions,
        isPublished: true,
        updatedAt: new Date(),
      })
      .where(eq(galleryPattern.id, existing.id));

    revalidatePath('/gallery');
    revalidatePath(`/gallery/${existing.slug}`);
    return { success: true, slug: existing.slug };
  }

  const slug = generateSlug(data.title.trim() || proj.name);
  const newId = crypto.randomUUID();

  await db.insert(galleryPattern).values({
    id: newId,
    userId: session.user.id,
    projectId,
    slug,
    title: data.title.trim() || proj.name,
    description: data.description?.trim() || null,
    category: data.category || 'geek',
    thumbnailUrl: proj.thumbnail,
    patternData: proj.data,
    beadCount,
    colorCount,
    paletteName,
    dimensions,
    likesCount: 0,
    remixCount: 0,
    isPublished: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/gallery');
  return { success: true, slug };
}

export async function likePatternAction(slug: string) {
  await db
    .update(galleryPattern)
    .set({
      likesCount: sql`${galleryPattern.likesCount} + 1`,
    })
    .where(eq(galleryPattern.slug, slug));

  revalidatePath(`/gallery/${slug}`);
  revalidatePath('/gallery');
  return { success: true };
}

export async function remixPatternAction(slug: string) {
  const [pat] = await db
    .select()
    .from(galleryPattern)
    .where(eq(galleryPattern.slug, slug))
    .limit(1);

  if (!pat) {
    throw new Error('Padrão não encontrado.');
  }

  await db
    .update(galleryPattern)
    .set({
      remixCount: sql`${galleryPattern.remixCount} + 1`,
    })
    .where(eq(galleryPattern.id, pat.id));

  return {
    success: true,
    title: pat.title,
    patternData: pat.patternData,
  };
}
