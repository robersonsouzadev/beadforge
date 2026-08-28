import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generateBeadPDF } from '@/core/export/pdf-generator';
import type { GridMatrix } from '@/core/schemas/grid';
import type { BeadSummary } from '@/core/schemas/project';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para exportar PDF.' },
        { status: 401 }
      );
    }

    const sub = await getUserSubscription(session.user.id);
    if (!sub.isPro) {
      return NextResponse.json(
        {
          error:
            'A exportação vetorial em PDF em alta escala é um recurso exclusivo do Plano Pro. Faça o upgrade para exportar.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { grid, summary, title, options } = body as {
      grid: GridMatrix;
      summary: BeadSummary[];
      title?: string;
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

    const doc = generateBeadPDF(grid, summary || [], {
      title: title || 'BeadForge Pattern',
      pageSize: options?.pageSize ?? 'A4',
      orientation: options?.orientation ?? 'portrait',
      showCodes: options?.showCodes ?? true,
      showSummary: options?.showSummary ?? true,
      cellSize: options?.cellSize,
    });

    const chunks: Buffer[] = [];

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    const safeTitle = (title || 'bead-pattern')
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
