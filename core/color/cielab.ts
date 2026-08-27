/**
 * Pipeline de Conversão de Espaços de Cor:
 * sRGB (não-linear) → Linear RGB → CIE 1931 XYZ (D65) → CIELAB (L*, a*, b*)
 */

/** Decompressão gamma sRGB (0-255) → Linear (0.0 - 1.0) */
export function srgbChannelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Compressão gamma Linear (0.0 - 1.0) → sRGB (0.0 - 1.0) */
export function linearToSrgbChannel(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Linear RGB → CIE XYZ com iluminante padrão D65 (2° standard observer) */
export function linearRgbToXyz(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  ];
}

/** CIE XYZ → Linear RGB */
export function xyzToLinearRgb(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}

// Constantes CIE standard
const DELTA = 6 / 29;
const DELTA_SQ = DELTA * DELTA;
const DELTA_CU = DELTA * DELTA * DELTA;

/** Função de transferência f(t) para CIELAB */
function labTransfer(t: number): number {
  return t > DELTA_CU ? Math.cbrt(t) : t / (3 * DELTA_SQ) + 4 / 29;
}

/** Inversa da função de transferência CIELAB */
function labTransferInv(t: number): number {
  return t > DELTA ? t * t * t : 3 * DELTA_SQ * (t - 4 / 29);
}

/** Ponto branco de referência D65 */
export const D65 = {
  Xn: 0.95047,
  Yn: 1.0,
  Zn: 1.08883,
};

/**
 * Converte sRGB (0-255) para coordenadas CIELAB [L*, a*, b*]
 * L* ∈ [0, 100], a* ∈ [-128, +128], b* ∈ [-128, +128]
 */
export function rgbToLab(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  const rL = srgbChannelToLinear(r);
  const gL = srgbChannelToLinear(g);
  const bL = srgbChannelToLinear(b);

  const [X, Y, Z] = linearRgbToXyz(rL, gL, bL);

  const fx = labTransfer(X / D65.Xn);
  const fy = labTransfer(Y / D65.Yn);
  const fz = labTransfer(Z / D65.Zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bStar = 200 * (fy - fz);

  return [L, a, bStar];
}

/**
 * Converte coordenadas CIELAB [L*, a*, b*] de volta para sRGB [0-255]
 */
export function labToRgb(
  L: number,
  a: number,
  b: number
): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const X = D65.Xn * labTransferInv(fx);
  const Y = D65.Yn * labTransferInv(fy);
  const Z = D65.Zn * labTransferInv(fz);

  const [rL, gL, bL] = xyzToLinearRgb(X, Y, Z);

  const r = Math.round(Math.max(0, Math.min(255, linearToSrgbChannel(rL) * 255)));
  const g = Math.round(Math.max(0, Math.min(255, linearToSrgbChannel(gL) * 255)));
  const bS = Math.round(Math.max(0, Math.min(255, linearToSrgbChannel(bL) * 255)));

  return [r, g, bS];
}
