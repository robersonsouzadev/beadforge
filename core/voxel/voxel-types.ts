import { z } from 'zod';
import type { GridMatrix, GridCell } from '@/core/schemas/grid';
import type { BeadColor } from '@/core/schemas/palette';

export const Voxel3DSchema = z.object({
  x: z.number().int(), // Coluna (X: 0 .. width - 1)
  y: z.number().int(), // Linha (Y: 0 .. height - 1)
  z: z.number().int(), // Camada de empilhamento vertical (Z: 0 .. depth - 1)
  beadCode: z.string(),
  beadName: z.string(),
  hex: z.string(),
  rgb: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  }),
  textColor: z.enum(['#000000', '#FFFFFF']),
  isEmpty: z.boolean().default(false),
});

export type Voxel3D = z.infer<typeof Voxel3DSchema>;

export interface VoxelLayer {
  z: number; // Índice vertical (0 = base inferior)
  name: string;
  heightMm: number; // Altura real acumulada em milímetros (ex: 2.6mm ou 5.0mm por camada)
  grid: GridMatrix; // Matriz 2D compatível com o editor 2D existente
  beadCount: number;
  isEmpty: boolean;
  isVisible: boolean;
  isLocked: boolean;
}

export interface SupportRod {
  id: string;
  x: number; // Coluna (X)
  y: number; // Linha (Y)
  startZ: number; // Camada inicial
  endZ: number; // Camada final
  lengthLayers: number; // Quantidade de camadas que atravessa
  lengthMm: number; // Comprimento em milímetros
  diameterMm: number; // Diâmetro da haste (2mm ou 3mm)
}

export interface VoxelGrid3D {
  width: number; // Dimensão X (Colunas)
  height: number; // Dimensão Y (Linhas)
  depth: number; // Dimensão Z (Quantidade de Camadas)
  layers: VoxelLayer[];
  totalBeads: number;
  totalLayers: number;
  pitchMm: number; // Distância entre pinos / altura do bead (2.6mm ou 5.0mm)
  rods?: SupportRod[]; // Hastes acrílicas de sustentação calculadas
}

export type VoxelToolMode = 'paint' | 'add' | 'remove' | 'dropper' | 'box';
export type FillMode = 'solid' | 'hollow' | 'surface';

export interface VoxelizationOptions {
  width: number;
  height: number;
  depth: number;
  fillMode: FillMode;
  wallThickness: number; // 1 ou 2 beads de espessura quando oco
  palette: BeadColor[];
  removeBackground?: boolean;
}

export interface BOMItem {
  code: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  totalCount: number;
  layerCounts: { [layerZ: number]: number };
  percentage: number;
}

export interface BOMReport {
  projectName: string;
  totalBeads: number;
  totalLayers: number;
  dimensions: {
    widthBeads: number;
    heightBeads: number;
    depthBeads: number;
    widthCm: number;
    heightCm: number;
    depthCm: number;
  };
  items: BOMItem[];
  estimatedWeightGrams: number;
  boardsRequired: {
    name: string;
    count: number;
  };
  rodsRequired?: {
    count: number;
    diameterMm: number;
    totalLengthCm: number;
    rods: SupportRod[];
  };
}
