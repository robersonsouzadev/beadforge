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
        user: { id: 'user-123', name: 'Artesão Teste' },
      }),
    },
  },
}));

vi.mock('@/db', () => {
  const mockPatterns = [
    {
      pattern: {
        id: 'pat-1',
        slug: 'super-mario-bros-fuse-beads',
        title: 'Super Mario Bros',
        description: 'Molde 29x29 para placas padrão',
        category: 'games',
        beadCount: 450,
        colorCount: 6,
        paletteName: 'Pindoo Standard',
        dimensions: '29x29',
        likesCount: 25,
        remixCount: 10,
        isValidated3D: false,
        publishedAt: new Date(),
        patternData: { summary: [] },
      },
      user: {
        name: 'Artesão Teste',
        image: null,
      },
      profile: {
        displayName: 'Ateliê dos Beads',
        handle: 'ateliebeads',
        avatarUrl: null,
      },
    },
  ];

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                $dynamic: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue(mockPatterns),
                    }),
                  }),
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockPatterns),
                  }),
                }),
                limit: vi.fn().mockResolvedValue(mockPatterns),
              }),
            }),
          }),
          where: vi.fn().mockImplementation(() => ({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockPatterns),
            }),
            limit: vi.fn().mockImplementation(() => {
              return Promise.resolve([
                {
                  id: 'proj-1',
                  userId: 'user-123',
                  name: 'Super Mario',
                  slug: 'super-mario-bros-123',
                  thumbnail: 'data:image/svg+xml;base64,123',
                  data: { summary: [{ code: 'P01', count: 100 }], grid: { width: 29, height: 29, totalBeads: 100 } },
                },
              ]);
            }),
          })),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id', handle: 'teste' }]),
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

import { getPatternBySlugAction, publishPatternToGalleryAction, deleteGalleryPatternAction } from '../../app/actions/gallery';

describe('Galeria Pública e Superfície de SEO (Phase 3)', () => {
  it('recupera detalhes do padrão para exibição na página pública com SEO', async () => {
    const pattern = await getPatternBySlugAction('super-mario-bros-fuse-beads');
    expect(pattern).not.toBeNull();
    expect(pattern?.title).toBe('Super Mario Bros');
    expect(pattern?.creator.name).toBe('Ateliê dos Beads');
    expect(pattern?.creator.handle).toBe('ateliebeads');
    expect(pattern?.likesCount).toBe(25);
  });

  it('publica um projeto na galeria gerando slug amigável', async () => {
    const result = await publishPatternToGalleryAction('proj-1', {
      title: 'Super Mario Bros 3D',
      description: 'Molde em pixel art para quadros',
      category: 'games',
    });

    expect(result.success).toBe(true);
    expect(result.slug).toContain('super-mario-bros');
  });

  it('permite a exclusão de um molde da galeria pública', async () => {
    const result = await deleteGalleryPatternAction('pat-1');
    expect(result.success).toBe(true);
  });
});
