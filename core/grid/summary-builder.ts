import type { GridMatrix } from '../schemas/grid';
import type { BeadSummary } from '../schemas/project';

/**
 * Gera o resumo de materiais (contagem de beads por código) a partir da GridMatrix.
 * Ordenado por quantidade de forma decrescente ou por código alfanumérico.
 */
export function buildBeadSummary(
  grid: GridMatrix,
  sortBy: 'count' | 'code' = 'code'
): BeadSummary[] {
  const counts = new Map<
    string,
    { code: string; name: string; hex: string; count: number }
  >();

  for (let r = 0; r < grid.height; r++) {
    for (let c = 0; c < grid.width; c++) {
      const cell = grid.cells[r][c];
      if (cell.isEmpty || !cell.beadCode) continue;

      const key = cell.beadCode;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, {
          code: cell.beadCode,
          name: cell.beadName,
          hex: cell.hex,
          count: 1,
        });
      }
    }
  }

  const summary = Array.from(counts.values());

  if (sortBy === 'count') {
    summary.sort((a, b) => b.count - a.count);
  } else {
    summary.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }

  return summary;
}
