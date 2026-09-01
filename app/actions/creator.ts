'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { creatorProfile, galleryPattern, user } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { resolvePatternThumbnail, type GalleryPatternDTO } from './gallery';

export interface CreatorFullProfileDTO {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  shopUrl?: string | null;
  instagramHandle?: string | null;
  whatsappNumber?: string | null;
  isPublic: boolean;
  totalPatternsCount: number;
  totalLikesCount: number;
  patterns: GalleryPatternDTO[];
}

export async function getCreatorProfileByHandleAction(
  handle: string
): Promise<CreatorFullProfileDTO | null> {
  const cleanHandle = handle.toLowerCase().replace(/^@/, '').trim();

  const [profile] = await db
    .select({
      profile: creatorProfile,
      user: user,
    })
    .from(creatorProfile)
    .innerJoin(user, eq(creatorProfile.userId, user.id))
    .where(eq(creatorProfile.handle, cleanHandle))
    .limit(1);

  if (!profile) {
    return null;
  }

  const cp = profile.profile;
  const u = profile.user;

  const rawPatterns = await db
    .select()
    .from(galleryPattern)
    .where(
      and(
        eq(galleryPattern.userId, cp.userId),
        eq(galleryPattern.isPublished, true)
      )
    )
    .orderBy(desc(galleryPattern.publishedAt));

  let totalLikes = 0;
  const patterns: GalleryPatternDTO[] = rawPatterns.map((p) => {
    totalLikes += p.likesCount || 0;
    const thumb = resolvePatternThumbnail(p.thumbnailUrl, p.patternData);

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category,
      thumbnailUrl: thumb,
      beadCount: p.beadCount,
      colorCount: p.colorCount,
      paletteName: p.paletteName,
      dimensions: p.dimensions,
      likesCount: p.likesCount,
      remixCount: p.remixCount,
      isValidated3D: p.isValidated3D,
      publishedAt: p.publishedAt,
      creator: {
        name: cp.displayName || u.name || 'Criador',
        handle: cp.handle,
        avatarUrl: cp.avatarUrl || u.image || null,
      },
    };
  });

  return {
    id: cp.id,
    userId: cp.userId,
    handle: cp.handle,
    displayName: cp.displayName,
    bio: cp.bio,
    avatarUrl: cp.avatarUrl || u.image,
    shopUrl: cp.shopUrl,
    instagramHandle: cp.instagramHandle,
    whatsappNumber: cp.whatsappNumber,
    isPublic: cp.isPublic,
    totalPatternsCount: patterns.length,
    totalLikesCount: totalLikes,
    patterns,
  };
}

export async function getCurrentUserCreatorProfileAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const [existing] = await db
    .select()
    .from(creatorProfile)
    .where(eq(creatorProfile.userId, session.user.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Generate initial default handle from user name or email
  const baseHandle = (session.user.name || session.user.email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  const initialHandle = `${baseHandle || 'criador'}${Math.floor(100 + Math.random() * 900)}`;

  const newId = crypto.randomUUID();
  const [created] = await db
    .insert(creatorProfile)
    .values({
      id: newId,
      userId: session.user.id,
      handle: initialHandle,
      displayName: session.user.name || 'Artesão BeadForge',
      bio: 'Criador de Pixel Art em Fuse Beads',
      avatarUrl: session.user.image,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function saveCreatorProfileAction(data: {
  handle: string;
  displayName: string;
  bio?: string;
  shopUrl?: string;
  instagramHandle?: string;
  whatsappNumber?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Você precisa estar autenticado.');
  }

  const userId = session.user.id;
  const cleanHandle = data.handle.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim();

  if (!cleanHandle) {
    throw new Error('O nome de usuário (handle) é obrigatório e deve conter apenas letras e números.');
  }

  // Check if handle is already taken by another user
  const [existingHandle] = await db
    .select()
    .from(creatorProfile)
    .where(eq(creatorProfile.handle, cleanHandle))
    .limit(1);

  if (existingHandle && existingHandle.userId !== userId) {
    throw new Error(`O usuário @${cleanHandle} já está em uso por outro criador.`);
  }

  const [existing] = await db
    .select()
    .from(creatorProfile)
    .where(eq(creatorProfile.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(creatorProfile)
      .set({
        handle: cleanHandle,
        displayName: data.displayName.trim() || cleanHandle,
        bio: data.bio?.trim() || null,
        shopUrl: data.shopUrl?.trim() || null,
        instagramHandle: data.instagramHandle?.replace(/^@/, '').trim() || null,
        whatsappNumber: data.whatsappNumber?.replace(/[^0-9]/g, '') || null,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfile.id, existing.id));
  } else {
    await db.insert(creatorProfile).values({
      id: crypto.randomUUID(),
      userId,
      handle: cleanHandle,
      displayName: data.displayName.trim() || cleanHandle,
      bio: data.bio?.trim() || null,
      shopUrl: data.shopUrl?.trim() || null,
      instagramHandle: data.instagramHandle?.replace(/^@/, '').trim() || null,
      whatsappNumber: data.whatsappNumber?.replace(/[^0-9]/g, '') || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath(`/creator/${cleanHandle}`);
  revalidatePath('/gallery');
  return { success: true, handle: cleanHandle };
}
