import type { BeadColor } from '../schemas/palette';
import type { PaletteMatcher } from './palette-matcher';
import { srgbChannelToLinear, linearToSrgbChannel } from './cielab';

export type DitherMode = 'none' | 'floyd-steinberg' | 'atkinson';

function clamp8(v: number): number {
  return Math.round(Math.max(0, Math.min(255, v)));
}

/**
 * Aplica mapeamento de cores e dithering com difusão de erro em espaço Linear RGB.
 * Isso evita completamente os problemas de escurecimento artificial (gamma darkening).
 */
export function applyDithering(
  pixels: Buffer, // sRGB raw bytes [R, G, B, R, G, B, ...]
  width: number,
  height: number,
  matcher: PaletteMatcher,
  mode: DitherMode = 'floyd-steinberg',
  emptyMask?: boolean[][]
): BeadColor[][] {
  // Converte buffer de pixels para array Float64 em espaço linear [0.0 - 1.0]
  const linear = new Float64Array(width * height * 3);
  for (let i = 0; i < width * height * 3; i++) {
    linear[i] = srgbChannelToLinear(pixels[i]);
  }

  const grid: BeadColor[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;

      // Se for célula de fundo mascarada como vazia
      if (emptyMask && emptyMask[y] && emptyMask[y][x]) {
        grid[y][x] = {
          code: '',
          name: 'Empty',
          hex: '#FFFFFF',
          rgb: { r: 255, g: 255, b: 255 },
          finish: 'solid',
          inStock: true,
        };
        continue;
      }

      // Converte do acumulador linear de volta para sRGB (0-255) para matching
      const r8 = clamp8(linearToSrgbChannel(linear[idx]) * 255);
      const g8 = clamp8(linearToSrgbChannel(linear[idx + 1]) * 255);
      const b8 = clamp8(linearToSrgbChannel(linear[idx + 2]) * 255);

      const matchedBead = matcher.findNearest(r8, g8, b8);
      grid[y][x] = matchedBead;

      if (mode === 'none') continue;

      // Calcula o erro em espaço linear
      const beadLinR = srgbChannelToLinear(matchedBead.rgb.r);
      const beadLinG = srgbChannelToLinear(matchedBead.rgb.g);
      const beadLinB = srgbChannelToLinear(matchedBead.rgb.b);

      const errR = linear[idx] - beadLinR;
      const errG = linear[idx + 1] - beadLinG;
      const errB = linear[idx + 2] - beadLinB;

      const diffuse = (dx: number, dy: number, factor: number) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          // Não difunde erro para células marcadas como vazias
          if (emptyMask && emptyMask[ny] && emptyMask[ny][nx]) return;

          const ni = (ny * width + nx) * 3;
          linear[ni] += errR * factor;
          linear[ni + 1] += errG * factor;
          linear[ni + 2] += errB * factor;
        }
      };

      if (mode === 'floyd-steinberg') {
        // Floyd-Steinberg: difunde 100% do erro (7/16, 3/16, 5/16, 1/16)
        diffuse(1, 0, 7 / 16);
        diffuse(-1, 1, 3 / 16);
        diffuse(0, 1, 5 / 16);
        diffuse(1, 1, 1 / 16);
      } else if (mode === 'atkinson') {
        // Atkinson: difunde 75% do erro (1/8 por vizinho, 2/8 descartado)
        diffuse(1, 0, 1 / 8);
        diffuse(2, 0, 1 / 8);
        diffuse(-1, 1, 1 / 8);
        diffuse(0, 1, 1 / 8);
        diffuse(1, 1, 1 / 8);
        diffuse(0, 2, 1 / 8);
      }
    }
  }

  return grid;
}
