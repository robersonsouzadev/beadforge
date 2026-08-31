import { MetadataRoute } from 'next';
import { db } from '@/db';
import { galleryPattern, creatorProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://app.hamabeadsbrasil.com.br';

  // Rotas Estáticas Principais
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/editor`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  try {
    // Rotas Dinâmicas de Moldes da Galeria
    const patterns = await db
      .select({
        slug: galleryPattern.slug,
        updatedAt: galleryPattern.updatedAt,
      })
      .from(galleryPattern)
      .where(eq(galleryPattern.isPublished, true));

    const patternRoutes: MetadataRoute.Sitemap = patterns.map((p) => ({
      url: `${baseUrl}/gallery/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Rotas Dinâmicas de Perfis de Criadores
    const creators = await db
      .select({
        handle: creatorProfile.handle,
        updatedAt: creatorProfile.updatedAt,
      })
      .from(creatorProfile)
      .where(eq(creatorProfile.isPublic, true));

    const creatorRoutes: MetadataRoute.Sitemap = creators.map((c) => ({
      url: `${baseUrl}/creator/${c.handle}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...patternRoutes, ...creatorRoutes];
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
    return staticRoutes;
  }
}
