import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generate3DAssemblyPDF } from '@/core/export/pdf-generator';
import type { VoxelGrid3D } from '@/core/voxel/voxel-types';
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
    const { grid3D, options, title, projectName } = body as {
      grid3D: VoxelGrid3D;
      title?: string;
      projectName?: string;
      options?: {
        pageSize?: 'A4' | 'A3' | 'Letter';
        orientation?: 'portrait' | 'landscape';
        showCodes?: boolean;
        cellSize?: number;
      };
    };

    if (!grid3D || !grid3D.layers || grid3D.layers.length === 0) {
      return NextResponse.json(
        { error: 'Dados do modelo 3D inválidos ou ausentes.' },
        { status: 400 }
      );
    }

    const docTitle = title || projectName || 'Guia de Montagem 3D';

    const doc = generate3DAssemblyPDF(grid3D, {
      title: docTitle,
      pageSize: options?.pageSize ?? 'A4',
      orientation: options?.orientation ?? 'portrait',
      showCodes: options?.showCodes ?? true,
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

    const safeTitle = (docTitle || '3d-blueprint')
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
    console.error('Erro na rota /api/export/pdf-3d:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao gerar Guia de Montagem 3D em PDF.' },
      { status: 500 }
    );
  }
}
