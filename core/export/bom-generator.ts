import type { VoxelGrid3D, BOMReport, BOMItem } from '@/core/voxel/voxel-types';

/**
 * Gera o relatório consolidado de Lista de Materiais (BOM) para projetos 3D Ultra
 */
export function generateBOMReport(grid3D: VoxelGrid3D, projectName: string = 'Projeto 3D Ultra'): BOMReport {
  const itemMap = new Map<string, BOMItem>();

  for (const layer of grid3D.layers) {
    if (layer.isEmpty) continue;

    for (let r = 0; r < layer.grid.height; r++) {
      for (let c = 0; c < layer.grid.width; c++) {
        const cell = layer.grid.cells[r][c];
        if (cell.isEmpty || !cell.beadCode) continue;

        let item = itemMap.get(cell.beadCode);
        if (!item) {
          item = {
            code: cell.beadCode,
            name: cell.beadName,
            hex: cell.hex,
            rgb: cell.rgb,
            totalCount: 0,
            layerCounts: {},
            percentage: 0,
          };
          itemMap.set(cell.beadCode, item);
        }

        item.totalCount++;
        item.layerCounts[layer.z] = (item.layerCounts[layer.z] || 0) + 1;
      }
    }
  }

  const items = Array.from(itemMap.values()).sort((a, b) => b.totalCount - a.totalCount);

  // Calcular porcentagens
  for (const item of items) {
    item.percentage = Number(((item.totalCount / Math.max(1, grid3D.totalBeads)) * 100).toFixed(1));
  }

  // Dimensões reais estimadas em cm
  const pitchCm = grid3D.pitchMm / 10;
  const widthCm = Number((grid3D.width * pitchCm).toFixed(1));
  const heightCm = Number((grid3D.height * pitchCm).toFixed(1));
  const depthCm = Number((grid3D.depth * pitchCm).toFixed(1));

  // Peso estimado por bead (g): Mini 2.6mm = 0.015g / Midi 5.0mm = 0.065g
  const beadWeightG = grid3D.pitchMm <= 3.0 ? 0.015 : 0.065;
  const rawWeight = grid3D.totalBeads * beadWeightG;
  const estimatedWeightGrams = Number(rawWeight.toFixed(rawWeight < 1 ? 3 : 1));

  // Quantidade de placas pegboard necessárias
  const boardP = grid3D.pitchMm <= 3.0 ? 57 : 29;
  const boardsW = Math.ceil(grid3D.width / boardP);
  const boardsH = Math.ceil(grid3D.height / boardP);

  const rods = grid3D.rods || [];
  const rodsRequired =
    rods.length > 0
      ? {
          count: rods.length,
          diameterMm: rods[0].diameterMm || (grid3D.pitchMm <= 3.0 ? 2.0 : 3.0),
          totalLengthCm: Number(
            (rods.reduce((sum, r) => sum + r.lengthMm, 0) / 10).toFixed(1)
          ),
          rods,
        }
      : undefined;

  return {
    projectName,
    totalBeads: grid3D.totalBeads,
    totalLayers: grid3D.totalLayers,
    dimensions: {
      widthBeads: grid3D.width,
      heightBeads: grid3D.height,
      depthBeads: grid3D.depth,
      widthCm,
      heightCm,
      depthCm,
    },
    items,
    estimatedWeightGrams,
    boardsRequired: {
      name: grid3D.pitchMm <= 3.0 ? 'Placa Mini 14.5x14.5cm' : 'Placa Midi 14.5x14.5cm',
      count: boardsW * boardsH,
    },
    rodsRequired,
  };
}
