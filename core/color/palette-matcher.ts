import { rgbToLab } from './cielab';
import { deltaE00 } from './delta-e-2000';
import type { BeadColor } from '../schemas/palette';

export class PaletteMatcher {
  private palette: BeadColor[];
  private paletteLab: [number, number, number][];
  private cache = new Map<number, BeadColor>();

  constructor(palette: BeadColor[]) {
    this.palette = palette;
    // Pré-computa coordenadas CIELAB para todas as cores da paleta
    this.paletteLab = palette.map((c) => {
      if (c.lab) {
        return [c.lab.l, c.lab.a, c.lab.b];
      }
      return rgbToLab(c.rgb.r, c.rgb.g, c.rgb.b);
    });
  }

  /**
   * Encontra a cor de bead mais próxima para um pixel sRGB [r, g, b].
   * Utiliza Two-Stage Pruning (CIE76 → Top 5 → CIEDE2000) e memoização de cores únicas.
   */
  findNearest(r: number, g: number, b: number): BeadColor {
    // Chave única para o cache (24-bit RGB empacotado)
    const key = (r << 16) | (g << 8) | b;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const pixelLab = rgbToLab(r, g, b);
    let bestIdx = 0;
    let bestDist = Infinity;

    // Stage 1: Filtro rápido de distância euclidiana CIE76 em CIELAB
    const candidates: { idx: number; roughDist: number }[] = [];
    for (let i = 0; i < this.paletteLab.length; i++) {
      const [L, a, bS] = this.paletteLab[i];
      const dL = pixelLab[0] - L;
      const da = pixelLab[1] - a;
      const db = pixelLab[2] - bS;
      candidates.push({ idx: i, roughDist: dL * dL + da * da + db * db });
    }
    candidates.sort((c1, c2) => c1.roughDist - c2.roughDist);

    // Stage 2: Avaliação precisa CIEDE2000 apenas nos top 5 candidatos mais promissores
    const topN = Math.min(5, candidates.length);
    for (let i = 0; i < topN; i++) {
      const idx = candidates[i].idx;
      const dist = deltaE00(pixelLab, this.paletteLab[idx]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    }

    const result = this.palette[bestIdx];
    this.cache.set(key, result);
    return result;
  }

  /**
   * Limpa o cache de busca de cores
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Retorna a lista completa de cores da paleta ativa
   */
  getPalette(): BeadColor[] {
    return this.palette;
  }
}
