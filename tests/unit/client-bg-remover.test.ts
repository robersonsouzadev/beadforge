import { describe, it, expect } from 'vitest';

describe('Background Removal Logic', () => {
  it('detecta corretamente similaridade de cor para remocao de fundo', () => {
    const bgR = 255;
    const bgG = 255;
    const bgB = 255;
    const tolerance = 30;

    const isColorSimilar = (r: number, g: number, b: number): boolean => {
      const dist = Math.sqrt(
        Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
      );
      return dist <= tolerance * 2.55;
    };

    // Branco puro deve ser similar
    expect(isColorSimilar(255, 255, 255)).toBe(true);
    // Branco suave/cinza clarinho (245, 245, 245)
    expect(isColorSimilar(245, 245, 245)).toBe(true);

    // Amarelo do Bart Simpson (255, 215, 0) NÃO deve ser considerado fundo
    expect(isColorSimilar(255, 215, 0)).toBe(false);
    // Vermelho da camisa (230, 50, 50) NÃO deve ser fundo
    expect(isColorSimilar(230, 50, 50)).toBe(false);
    // Azul do calção (50, 100, 220) NÃO deve ser fundo
    expect(isColorSimilar(50, 100, 220)).toBe(false);
  });
});
