import { rgbToLab } from '../color/cielab';
import { deltaE00 } from '../color/delta-e-2000';

export interface BackgroundDetectionResult {
  backgroundColor: { r: number; g: number; b: number };
  emptyMask: boolean[][]; // true = célula é fundo (vazia)
}

/**
 * Detecta a cor de fundo mais frequente analisando as bordas perimetrais da imagem.
 */
export function detectBackgroundColor(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number = 3
): { r: number; g: number; b: number } {
  const borderPixels = new Map<string, number>();

  const addPixel = (row: number, col: number) => {
    const idx = (row * width + col) * channels;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const key = `${r},${g},${b}`;
    borderPixels.set(key, (borderPixels.get(key) ?? 0) + 1);
  };

  // Linhas do topo e da base
  for (let x = 0; x < width; x++) {
    addPixel(0, x);
    addPixel(height - 1, x);
  }
  // Colunas da esquerda e da direita
  for (let y = 1; y < height - 1; y++) {
    addPixel(y, 0);
    addPixel(y, width - 1);
  }

  let maxCount = 0;
  let bgKey = '255,255,255';
  for (const [key, count] of borderPixels.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bgKey = key;
    }
  }

  const [r, g, b] = bgKey.split(',').map(Number);
  return { r, g, b };
}

/**
 * Cria uma máscara booleana 2D identificando quais células correspondem ao fundo
 * com base na tolerância perceptual CIEDE2000 (ΔE₀₀).
 */
export function createBackgroundMask(
  pixels: Buffer,
  width: number,
  height: number,
  bgColor: { r: number; g: number; b: number },
  threshold: number = 5.0
): boolean[][] {
  const bgLab = rgbToLab(bgColor.r, bgColor.g, bgColor.b);
  const mask: boolean[][] = [];

  for (let y = 0; y < height; y++) {
    mask[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const pixelLab = rgbToLab(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      const dist = deltaE00(pixelLab, bgLab);
      mask[y][x] = dist < threshold; // true = é fundo
    }
  }

  return mask;
}
