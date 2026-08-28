import sharp from 'sharp';

export interface DownsampleOptions {
  targetWidth: number; // e.g. 29, 58, 87
  targetHeight: number; // e.g. 29, 58, 87
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  scale?: number; // 0.5 a 2.5 (1.0 = 100%)
  offsetX?: number; // -100 a +100 (% de deslocamento horizontal)
  offsetY?: number; // -100 a +100 (% de deslocamento vertical)
  background?: { r: number; g: number; b: number };
  contrastAdjust?: number; // -100 a +100
  saturationAdjust?: number; // -100 a +100
  brightnessAdjust?: number; // -100 a +100
}

/**
 * Pipeline de Redimensionamento e Enquadramento:
 * 1. Ajustes de cor, contraste, saturação e brilho
 * 2. Lanczos3 para resolução intermediária de alta fidelidade
 * 3. Amostragem com Escala (Scale) e Deslocamento (Offset X/Y) matemáticos precisos
 */
export async function downsampleImage(
  inputBuffer: Buffer,
  options: DownsampleOptions
): Promise<{ pixels: Buffer; width: number; height: number; hasAlpha: boolean }> {
  const targetW = options.targetWidth;
  const targetH = options.targetHeight;
  const fit = options.fit ?? 'contain';
  const bg = options.background ?? { r: 255, g: 255, b: 255 };
  const scale = Math.max(0.2, Math.min(options.scale ?? 1.0, 3.0));
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;

  // Inicializa pipeline Sharp
  let pipeline = sharp(inputBuffer);

  const metadata = await pipeline.metadata();
  const hasAlpha = metadata.hasAlpha ?? false;

  // Ajustes de brilho e saturação
  if (options.brightnessAdjust || options.saturationAdjust) {
    const brightness = 1 + (options.brightnessAdjust ?? 0) / 100;
    const saturation = 1 + (options.saturationAdjust ?? 0) / 100;
    pipeline = pipeline.modulate({
      brightness: Math.max(0.1, brightness),
      saturation: Math.max(0.1, saturation),
    });
  }

  // Ajuste de contraste linear
  if (options.contrastAdjust && options.contrastAdjust !== 0) {
    const factor =
      (259 * ((options.contrastAdjust ?? 0) + 255)) /
      (255 * (259 - (options.contrastAdjust ?? 0)));
    pipeline = pipeline.linear(factor, -(128 * factor) + 128);
  }

  // Resolução intermediária de alta fidelidade (Lanczos3)
  const intermediateW = targetW * 2;
  const intermediateH = targetH * 2;

  const intermediate = await pipeline
    .resize(intermediateW, intermediateH, {
      kernel: sharp.kernel.lanczos3,
      fit: fit,
      background: hasAlpha
        ? { r: 0, g: 0, b: 0, alpha: 0 }
        : { r: bg.r, g: bg.g, b: bg.b, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Amostragem com suporte total a Escala, Posicionamento X/Y e Canal Alpha
  const finalPixels = resampleWithTransform(
    intermediate.data,
    intermediate.info.width,
    intermediate.info.height,
    targetW,
    targetH,
    scale,
    offsetX,
    offsetY,
    bg,
    hasAlpha
  );

  return {
    pixels: finalPixels,
    width: targetW,
    height: targetH,
    hasAlpha,
  };
}

/**
 * Resampling com transformação afim (Escala + Translação X/Y) mantendo RGBA
 */
function resampleWithTransform(
  src: Buffer,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  scale: number,
  offsetXPercent: number,
  offsetYPercent: number,
  bg: { r: number; g: number; b: number },
  hasAlpha: boolean
): Buffer {
  const channels = 4;
  const dst = Buffer.alloc(dstW * dstH * channels);

  // Converte deslocamento percentual para pixels de destino
  const shiftX = (offsetXPercent / 100) * dstW;
  const shiftY = (offsetYPercent / 100) * dstH;

  const dstCenterX = dstW / 2;
  const dstCenterY = dstH / 2;

  const srcCenterX = srcW / 2;
  const srcCenterY = srcH / 2;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const dstIdx = (dy * dstW + dx) * channels;

      // Mapeia coordenadas do destino de volta para a origem com escala e deslocamento
      const normX = (dx - dstCenterX - shiftX) / scale;
      const normY = (dy - dstCenterY - shiftY) / scale;

      const sx = Math.floor(normX * (srcW / dstW) + srcCenterX);
      const sy = Math.floor(normY * (srcH / dstH) + srcCenterY);

      // Se a coordenada mapeada estiver dentro dos limites da imagem de origem
      if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
        const srcIdx = (sy * srcW + sx) * channels;
        dst[dstIdx] = src[srcIdx];
        dst[dstIdx + 1] = src[srcIdx + 1];
        dst[dstIdx + 2] = src[srcIdx + 2];
        dst[dstIdx + 3] = src[srcIdx + 3];
      } else {
        // Fora dos limites = cor de fundo / transparência
        dst[dstIdx] = bg.r;
        dst[dstIdx + 1] = bg.g;
        dst[dstIdx + 2] = bg.b;
        dst[dstIdx + 3] = hasAlpha ? 0 : 255;
      }
    }
  }

  return dst;
}
