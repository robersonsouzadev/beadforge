/**
 * Implementação completa e padronizada do algoritmo CIEDE2000 (ΔE₀₀).
 * Referência: CIE Publication 142-2001 (ISO/CIE 11664-6:2014)
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Calcula a diferença de cor perceptual CIEDE2000 entre dois pontos CIELAB.
 *
 * @param lab1 Primeira cor [L*, a*, b*]
 * @param lab2 Segunda cor [L*, a*, b*]
 * @param kL Peso paramétrico de luminosidade (padrão: 1)
 * @param kC Peso paramétrico de croma (padrão: 1)
 * @param kH Peso paramétrico de matiz (padrão: 1)
 * @returns Diferença perceptual ΔE₀₀
 */
export function deltaE00(
  lab1: [number, number, number],
  lab2: [number, number, number],
  kL = 1,
  kC = 1,
  kH = 1
): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  // 1. Croma e ajuste de eixo a' (correção de saturação próxima ao neutro)
  const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab_mean = (C1ab + C2ab) / 2;
  const Cab7 = Math.pow(Cab_mean, 7);
  const G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 6103515625))); // 25^7 = 6103515625

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const Cp_mean = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p) * DEG;
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * DEG;
  if (h2p < 0) h2p += 360;

  // 2. Diferenças métricas
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * RAD);

  // 3. Matiz médio (Hp_mean)
  let Hp_mean: number;
  if (C1p * C2p === 0) {
    Hp_mean = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    Hp_mean = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    Hp_mean = (h1p + h2p + 360) / 2;
  } else {
    Hp_mean = (h1p + h2p - 360) / 2;
  }

  // 4. Funções de ponderação (SL, SC, SH) e Rotação (RT)
  const Lp_mean = (L1 + L2) / 2;
  const T =
    1 -
    0.17 * Math.cos((Hp_mean - 30) * RAD) +
    0.24 * Math.cos(2 * Hp_mean * RAD) +
    0.32 * Math.cos((3 * Hp_mean + 6) * RAD) -
    0.2 * Math.cos((4 * Hp_mean - 63) * RAD);

  const Lp50sq = (Lp_mean - 50) * (Lp_mean - 50);
  const SL = 1 + (0.015 * Lp50sq) / Math.sqrt(20 + Lp50sq);
  const SC = 1 + 0.045 * Cp_mean;
  const SH = 1 + 0.015 * Cp_mean * T;

  const dTheta = 30 * Math.exp(-Math.pow((Hp_mean - 275) / 25, 2));
  const Cp7 = Math.pow(Cp_mean, 7);
  const RC = 2 * Math.sqrt(Cp7 / (Cp7 + 6103515625));
  const RT = -Math.sin(2 * dTheta * RAD) * RC;

  // 5. Total CIEDE2000
  const lpTerm = dLp / (kL * SL);
  const cpTerm = dCp / (kC * SC);
  const hpTerm = dHp / (kH * SH);

  return Math.sqrt(
    lpTerm * lpTerm +
      cpTerm * cpTerm +
      hpTerm * hpTerm +
      RT * cpTerm * hpTerm
  );
}
