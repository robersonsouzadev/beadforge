export interface PegboardProfile {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  pinsMini26: { width: number; height: number; total: number }; // 2.6mm
  pinsMidi50: { width: number; height: number; total: number }; // 5.0mm
  platesCount: number; // e.g. 1 placa, 4 placas (2x2), 9 placas (3x3)
  description: string;
}

export const PEGBOARD_PROFILES: PegboardProfile[] = [
  {
    id: 'standard-145',
    name: '14,5 × 14,5 cm (Padrão 1 Placa)',
    widthCm: 14.5,
    heightCm: 14.5,
    pinsMini26: { width: 50, height: 50, total: 2500 },
    pinsMidi50: { width: 29, height: 29, total: 841 },
    platesCount: 1,
    description: 'Placa padrão universal quadrada com encaixes laterais',
  },
  {
    id: 'large-280',
    name: '28,0 × 28,0 cm (Grande — 4 Placas 2×2)',
    widthCm: 28.0,
    heightCm: 28.0,
    pinsMini26: { width: 100, height: 100, total: 10000 },
    pinsMidi50: { width: 58, height: 58, total: 3364 },
    platesCount: 4,
    description: '4 placas padrão de 14,5cm encaixadas ou placa inteiriça grande',
  },
  {
    id: 'small-74',
    name: '7,4 × 7,4 cm (Pequena)',
    widthCm: 7.4,
    heightCm: 7.4,
    pinsMini26: { width: 28, height: 28, total: 784 },
    pinsMidi50: { width: 14, height: 14, total: 196 },
    platesCount: 1,
    description: 'Placa compacta para chaveiros, pingentes e mini artes',
  },
  {
    id: 'mural-435',
    name: '43,5 × 43,5 cm (Mural — 9 Placas 3×3)',
    widthCm: 43.5,
    heightCm: 43.5,
    pinsMini26: { width: 150, height: 150, total: 22500 },
    pinsMidi50: { width: 87, height: 87, total: 7569 },
    platesCount: 9,
    description: 'Mural de alta definição com 9 placas encaixadas',
  },
];
