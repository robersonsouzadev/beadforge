/**
 * Cálculo de luminância relativa e contraste de texto WCAG 2.1.
 * Garante legibilidade automática de códigos em células coloridas.
 */

/**
 * Calcula a luminância relativa de um canal sRGB (0-255)
 */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Calcula a luminância relativa Y (0.0 a 1.0) segundo WCAG 2.1
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/**
 * Determina se o texto sobre a cor deve ser preto (#000000) ou branco (#FFFFFF).
 * Baseado no threshold padrão WCAG de luminância ~0.179.
 */
export function getContrastTextColor(
  r: number,
  g: number,
  b: number
): '#000000' | '#FFFFFF' {
  const L = getRelativeLuminance(r, g, b);
  return L > 0.179 ? '#000000' : '#FFFFFF';
}
