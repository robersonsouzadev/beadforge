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
  channels?: number
): { r: number; g: number; b: number } {
  const actualChannels = channels || (pixels.length >= width * height * 4 ? 4 : 3);
  const borderPixels = new Map<string, number>();

  const addPixel = (row: number, col: number) => {
    const idx = (row * width + col) * actualChannels;
    if (actualChannels === 4 && pixels[idx + 3] < 128) return; // ignora pixels transparentes
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
 * Cria uma máscara booleana 2D identificando o fundo através de FLOOD-FILL (BFS)
 * a partir das 4 bordas externas da imagem.
 *
 * Isso garante que cores brancas/claras INTERNAS ao desenho (como o rosto da Hello Kitty,
 * olhos, roupas ou pele) NUNCA sejam removidas por engano!
 */
export function createBackgroundMask(
  pixels: Buffer,
  width: number,
  height: number,
  bgColor: { r: number; g: number; b: number },
  threshold: number = 5.0
): boolean[][] {
  const actualChannels = pixels.length >= width * height * 4 ? 4 : 3;
  const bgLab = rgbToLab(bgColor.r, bgColor.g, bgColor.b);

  // Matriz inicial de máscara (false = não é fundo)
  const mask: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );

  const visited: boolean[][] = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );

  const isColorMatch = (x: number, y: number): boolean => {
    const idx = (y * width + x) * actualChannels;
    if (actualChannels === 4 && pixels[idx + 3] < 128) {
      return true; // Transparente é sempre fundo
    }

    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];

    const rDiff = Math.abs(r - bgColor.r);
    const gDiff = Math.abs(g - bgColor.g);
    const bDiff = Math.abs(b - bgColor.b);

    const maxRgbDiff = Math.max(rDiff, gDiff, bDiff);
    // Limite estrito para evitar vazamento através de linhas finas
    if (maxRgbDiff > Math.max(14, threshold * 2.5)) {
      return false;
    }

    const pixelLab = rgbToLab(r, g, b);
    const dist = deltaE00(pixelLab, bgLab);
    return dist < threshold;
  };

  const queue: [number, number][] = [];

  // 1. Inicializa a fila a partir das 4 bordas (perímetro externo da imagem)
  // Topo e Base
  for (let x = 0; x < width; x++) {
    if (!visited[0][x] && isColorMatch(x, 0)) {
      visited[0][x] = true;
      mask[0][x] = true;
      queue.push([x, 0]);
    }
    if (!visited[height - 1][x] && isColorMatch(x, height - 1)) {
      visited[height - 1][x] = true;
      mask[height - 1][x] = true;
      queue.push([x, height - 1]);
    }
  }

  // Laterais Esquerda e Direita
  for (let y = 0; y < height; y++) {
    if (!visited[y][0] && isColorMatch(0, y)) {
      visited[y][0] = true;
      mask[y][0] = true;
      queue.push([0, y]);
    }
    if (!visited[y][width - 1] && isColorMatch(width - 1, y)) {
      visited[y][width - 1] = true;
      mask[y][width - 1] = true;
      queue.push([width - 1, y]);
    }
  }

  // 2. BFS: Expande o preenchimento de fundo apenas para pixels contíguos externos
  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];

    const neighbors: [number, number][] = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited[ny][nx]) {
          visited[ny][nx] = true;
          if (isColorMatch(nx, ny)) {
            mask[ny][nx] = true;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  return mask;
}
