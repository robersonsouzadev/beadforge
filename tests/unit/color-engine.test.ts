import { describe, it, expect } from 'vitest';
import { rgbToLab, labToRgb, srgbChannelToLinear, linearToSrgbChannel } from '../../core/color/cielab';
import { deltaE00 } from '../../core/color/delta-e-2000';
import { getContrastTextColor, getRelativeLuminance } from '../../core/color/contrast';
import { PaletteMatcher } from '../../core/color/palette-matcher';
import { PALETTES } from '../../data/palettes/index';

describe('CIELAB Color Space Conversion', () => {
  it('converte sRGB puro branco (255, 255, 255) para L*=100, a*≈0, b*≈0', () => {
    const [L, a, b] = rgbToLab(255, 255, 255);
    expect(L).toBeCloseTo(100, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it('converte sRGB puro preto (0, 0, 0) para L*=0, a*=0, b*=0', () => {
    const [L, a, b] = rgbToLab(0, 0, 0);
    expect(L).toBeCloseTo(0, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it('é inversível (sRGB → LAB → sRGB)', () => {
    const original = [180, 40, 85];
    const [L, a, b] = rgbToLab(original[0], original[1], original[2]);
    const reconstructed = labToRgb(L, a, b);
    expect(reconstructed[0]).toBe(original[0]);
    expect(reconstructed[1]).toBe(original[1]);
    expect(reconstructed[2]).toBe(original[2]);
  });
});

describe('CIEDE2000 (ΔE₀₀) Algorithm', () => {
  it('calcula ΔE₀₀ = 0 para cores idênticas', () => {
    const lab: [number, number, number] = [50, 20, -30];
    expect(deltaE00(lab, lab)).toBe(0);
  });

  it('calcula corretamente o par padrão de referência CIE', () => {
    // Par 1 de referência padrão CIE / Sharma et al. (2005)
    // Lab1 = (50.0, 2.6772, -79.7751), Lab2 = (50.0, 0.0, -82.7485)
    // ΔE00 esperado: ~2.0425
    const lab1: [number, number, number] = [50.0, 2.6772, -79.7751];
    const lab2: [number, number, number] = [50.0, 0.0, -82.7485];
    const dist = deltaE00(lab1, lab2);
    expect(dist).toBeCloseTo(2.0425, 2);
  });
});

describe('WCAG 2.1 Text Contrast', () => {
  it('retorna texto preto (#000000) para fundos claros como branco e amarelo', () => {
    expect(getContrastTextColor(255, 255, 255)).toBe('#000000');
    expect(getContrastTextColor(232, 212, 77)).toBe('#000000'); // Amarelo A4
    expect(getContrastTextColor(245, 240, 235)).toBe('#000000'); // Branco H2
  });

  it('retorna texto branco (#FFFFFF) para fundos escuros como preto e marrom', () => {
    expect(getContrastTextColor(0, 0, 0)).toBe('#FFFFFF');
    expect(getContrastTextColor(80, 24, 40)).toBe('#FFFFFF'); // Vinho F12
    expect(getContrastTextColor(139, 94, 60)).toBe('#FFFFFF'); // Marrom G8
  });
});

describe('PaletteMatcher', () => {
  it('encontra a cor exata para um valor presente na paleta Pindoo', () => {
    const matcher = new PaletteMatcher(PALETTES['pindoo-standard'].colors);
    const yellow = matcher.findNearest(232, 212, 77); // Canary Yellow A4
    expect(yellow.code).toBe('A4');
  });

  it('utiliza o cache para chamadas subsequentes com a mesma cor', () => {
    const matcher = new PaletteMatcher(PALETTES['pindoo-standard'].colors);
    const first = matcher.findNearest(198, 40, 40); // A19
    const second = matcher.findNearest(198, 40, 40);
    expect(first.code).toBe('A19');
    expect(second).toBe(first);
  });
});
