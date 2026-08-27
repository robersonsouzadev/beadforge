import type { BeadColor } from '../schemas/palette';
import type { GridCell, GridMatrix } from '../schemas/grid';
import { getContrastTextColor } from '../color/contrast';

export interface GridBuilderOptions {
  pegboardSize?: number; // padrão: 29
}

/**
 * Constrói a estrutura de dados `GridMatrix` a partir de uma matriz 2D de `BeadColor`.
 */
export function buildGridMatrix(
  beadGrid: BeadColor[][],
  width: number,
  height: number,
  options: GridBuilderOptions = {}
): GridMatrix {
  const pegboardSize = options.pegboardSize ?? 29;
  const cells: GridCell[][] = [];
  let totalBeads = 0;

  for (let r = 0; r < height; r++) {
    cells[r] = [];
    for (let c = 0; c < width; c++) {
      const bead = beadGrid[r][c];
      const isEmpty = !bead.code || bead.name === 'Empty';

      if (!isEmpty) {
        totalBeads++;
      }

      cells[r][c] = {
        row: r,
        col: c,
        beadCode: isEmpty ? '' : bead.code,
        beadName: isEmpty ? '' : bead.name,
        hex: isEmpty ? '#FFFFFF' : bead.hex,
        rgb: { ...bead.rgb },
        textColor: isEmpty
          ? '#000000'
          : getContrastTextColor(bead.rgb.r, bead.rgb.g, bead.rgb.b),
        isEmpty,
      };
    }
  }

  return {
    width,
    height,
    cells,
    pegboardSize,
    totalBeads,
  };
}
