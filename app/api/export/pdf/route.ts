import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generateBeadPDF } from '@/core/export/pdf-generator';
import type { GridMatrix } from '@/core/schemas/grid';
import type { BeadSummary } from '@/core/schemas/project';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { db } from '@/db';
import { creatorProfile } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let isPro = false;
    let studioName: string | undefined = undefined;
    let contactPhone: string | undefined = undefined;
    let instagramHandle: string | undefined = undefined;

    if (session?.user) {
      const sub = await getUserSubscription(session.user.id);
      isPro = !!sub.isPro;

      // Fetch creator profile for White-Label branding
      const [profile] = await db
        .select()
        .from(creatorProfile)
        .where(eq(creatorProfile.userId, session.user.id))
        .limit(1);

      if (profile) {
        studioName = profile.displayName;
        contactPhone = profile.whatsappNumber || undefined;
        instagramHandle = profile.instagramHandle || undefined;
      }
    }

    const body = await req.json();
    const { grid, options } = body as {
      grid: GridMatrix;
      summary?: BeadSummary[];
      title?: string;
      projectName?: string;
      options?: {
        pageSize?: 'A4' | 'A3' | 'Letter';
        orientation?: 'portrait' | 'landscape';
        showCodes?: boolean;
        showSummary?: boolean;
        cellSize?: number;
      };
    };

    if (!grid || !grid.cells) {
      return NextResponse.json(
        { error: 'Dados da grade inválidos ou ausentes.' },
        { status: 400 }
      );
    }

    // Use provided summary or compute from grid automatically
    const summary =
      body.summary && body.summary.length > 0
        ? body.summary
        : Array.from(
            grid.cells
              .flat()
              .filter((c) => !c.isEmpty && c.beadCode)
              .reduce((map, cell) => {
                const item = map.get(cell.beadCode) || {
                  code: cell.beadCode,
                  name: cell.beadName,
                  hex: cell.hex,
                  count: 0,
                };
                item.count++;
                map.set(cell.beadCode, item);
                return map;
              }, new Map<string, BeadSummary>())
              .values()
          );

    const docTitle = body.title || body.projectName || 'BeadForge Pattern';

    const doc = generateBeadPDF(grid, summary, {
      title: docTitle,
      pageSize: options?.pageSize ?? 'A4',
      orientation: options?.orientation ?? 'portrait',
      showCodes: options?.showCodes ?? true,
      showSummary: options?.showSummary ?? true,
      cellSize: options?.cellSize,
      isPro,
      watermark: !isPro,
      studioName,
      contactPhone,
      instagramHandle,
    });

    const chunks: Buffer[] = [];

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    const safeTitle = (docTitle || 'bead-pattern')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error('Erro na rota /api/export/pdf:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao gerar PDF.' },
      { status: 500 }
    );
  }
}
