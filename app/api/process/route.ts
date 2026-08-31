import { NextRequest, NextResponse } from 'next/server';
import { downsampleImage } from '@/core/image/downsampler';
import { detectBackgroundColor, createBackgroundMask } from '@/core/image/background-detector';
import { PaletteMatcher } from '@/core/color/palette-matcher';
import { applyDithering, DitherMode } from '@/core/color/dithering';
import { buildGridMatrix } from '@/core/grid/grid-builder';
import { buildBeadSummary } from '@/core/grid/summary-builder';
import { getPaletteById } from '@/data/palettes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const base64Data = formData.get('imageBase64') as string | null;
    const gridWidth = parseInt((formData.get('gridWidth') as string) || '29', 10);
    const gridHeight = parseInt((formData.get('gridHeight') as string) || '29', 10);
    const paletteId = (formData.get('paletteId') as string) || 'pindoo-standard';
    const ditherMode = (formData.get('ditherMode') as DitherMode) || 'floyd-steinberg';
    const contrast = parseFloat((formData.get('contrast') as string) || '0');
    const saturation = parseFloat((formData.get('saturation') as string) || '0');
    const brightness = parseFloat((formData.get('brightness') as string) || '0');
    const scale = parseFloat((formData.get('scale') as string) || '1.0');
    const offsetX = parseFloat((formData.get('offsetX') as string) || '0');
    const offsetY = parseFloat((formData.get('offsetY') as string) || '0');
    const bgTolerance = parseFloat((formData.get('bgTolerance') as string) || '5.0');
    const removeBackground = formData.get('removeBackground') === 'true';

    let inputBuffer: Buffer;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      return NextResponse.json(
        { error: 'Nenhuma imagem foi fornecida (envie um arquivo ou base64).' },
        { status: 400 }
      );
    }

    // 1. Redimensionamento via Sharp com Escala e Posição X/Y
    const { pixels, width, height, hasAlpha } = await downsampleImage(inputBuffer, {
      targetWidth: gridWidth,
      targetHeight: gridHeight,
      fit: 'contain',
      scale,
      offsetX,
      offsetY,
      contrastAdjust: contrast,
      saturationAdjust: saturation,
      brightnessAdjust: brightness,
    });

    // 2. Detecção e máscara de fundo
    let emptyMask: boolean[][] | undefined;
    if (hasAlpha) {
      // Se a imagem possui transparência nativa (PNG/WebP), o canal alpha define o fundo sem falsos positivos
      emptyMask = Array.from({ length: height }, () => Array(width).fill(false));
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (pixels[idx + 3] < 128) {
            emptyMask[y][x] = true;
          }
        }
      }
    } else if (removeBackground) {
      // Se a imagem for opaca (JPEG) e o usuário ativou remoção de fundo
      const bgColor = detectBackgroundColor(pixels, width, height, 4);
      emptyMask = createBackgroundMask(pixels, width, height, bgColor, bgTolerance);
    }

    // 3. Obtenção da paleta e Mapeamento de Cores CIEDE2000
    const palette = getPaletteById(paletteId);
    const enabledCodesJson = formData.get('enabledBeadCodes') as string | null;
    let activeColors = palette.colors;

    if (enabledCodesJson) {
      try {
        const allowed = JSON.parse(enabledCodesJson) as string[];
        if (Array.isArray(allowed) && allowed.length > 0) {
          const allowedSet = new Set(allowed);
          const filtered = palette.colors.filter((c) => allowedSet.has(c.code));
          if (filtered.length > 0) {
            activeColors = filtered;
          }
        }
      } catch (err) {
        console.warn('Erro ao parsear enabledBeadCodes:', err);
      }
    }

    const matcher = new PaletteMatcher(activeColors);
    const beadGrid = applyDithering(pixels, width, height, matcher, ditherMode, emptyMask);

    // 4. Construção da Matriz e Resumo
    const grid = buildGridMatrix(beadGrid, width, height, { pegboardSize: 29 });
    const summary = buildBeadSummary(grid, 'count');

    return NextResponse.json({
      success: true,
      grid,
      summary,
      totalBeads: grid.totalBeads,
      colorsUsed: summary.length,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/process:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar imagem.' },
      { status: 500 }
    );
  }
}
