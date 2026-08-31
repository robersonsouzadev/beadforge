import type { GridMatrix, GridCell } from '../schemas/grid';
import type { BeadColor } from '../schemas/palette';
import { getContrastTextColor } from '../color/contrast';

/**
 * Atualiza uma célula específica com uma nova cor de bead.
 */
export function setCellBead(
  grid: GridMatrix,
  row: number,
  col: number,
  bead: BeadColor
): GridMatrix {
  if (row < 0 || row >= grid.height || col < 0 || col >= grid.width) {
    return grid;
  }

  const newCells = grid.cells.map((r, rIdx) =>
    rIdx === row
      ? r.map((c, cIdx) => {
          if (cIdx !== col) return c;
          const wasEmpty = c.isEmpty;
          return {
            row,
            col,
            beadCode: bead.code,
            beadName: bead.name,
            hex: bead.hex,
            rgb: { ...bead.rgb },
            textColor: getContrastTextColor(bead.rgb.r, bead.rgb.g, bead.rgb.b),
            isEmpty: false,
          };
        })
      : r
  );

  const prevEmpty = grid.cells[row][col].isEmpty;
  const newTotal = prevEmpty ? grid.totalBeads + 1 : grid.totalBeads;

  return {
    ...grid,
    cells: newCells,
    totalBeads: newTotal,
  };
}

/**
 * Marca uma célula como vazia (borracha).
 */
export function eraseCell(
  grid: GridMatrix,
  row: number,
  col: number
): GridMatrix {
  if (row < 0 || row >= grid.height || col < 0 || col >= grid.width) {
    return grid;
  }

  const wasEmpty = grid.cells[row][col].isEmpty;
  if (wasEmpty) return grid;

  const newCells = grid.cells.map((r, rIdx) =>
    rIdx === row
      ? r.map((c, cIdx) => {
          if (cIdx !== col) return c;
          return {
            row,
            col,
            beadCode: '',
            beadName: '',
            hex: '#FFFFFF',
            rgb: { r: 255, g: 255, b: 255 },
            textColor: '#000000' as const,
            isEmpty: true,
          };
        })
      : r
  );

  return {
    ...grid,
    cells: newCells,
    totalBeads: Math.max(0, grid.totalBeads - 1),
  };
}

/**
 * Preenchimento por inundação (Flood Fill / Balde de Tinta).
 */
export function floodFill(
  grid: GridMatrix,
  startRow: number,
  startCol: number,
  newBead: BeadColor
): GridMatrix {
  if (startRow < 0 || startRow >= grid.height || startCol < 0 || startCol >= grid.width) {
    return grid;
  }

  const targetCode = grid.cells[startRow][startCol].beadCode;
  const targetEmpty = grid.cells[startRow][startCol].isEmpty;

  // Se já for da mesma cor, não faz nada
  if (!targetEmpty && targetCode === newBead.code) {
    return grid;
  }

  const visited = Array.from({ length: grid.height }, () =>
    new Array(grid.width).fill(false)
  );

  const queue: [number, number][] = [[startRow, startCol]];
  visited[startRow][startCol] = true;

  const cellsToUpdate = new Set<string>();

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    cellsToUpdate.add(`${r},${c}`);

    const neighbors: [number, number][] = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < grid.height && nc >= 0 && nc < grid.width && !visited[nr][nc]) {
        const neighborCell = grid.cells[nr][nc];
        const match = targetEmpty
          ? neighborCell.isEmpty
          : !neighborCell.isEmpty && neighborCell.beadCode === targetCode;

        if (match) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
  }

  let totalDiff = 0;
  const newCells = grid.cells.map((rowArr, r) =>
    rowArr.map((cell, c) => {
      if (cellsToUpdate.has(`${r},${c}`)) {
        if (cell.isEmpty) totalDiff++;
        return {
          row: r,
          col: c,
          beadCode: newBead.code,
          beadName: newBead.name,
          hex: newBead.hex,
          rgb: { ...newBead.rgb },
          textColor: getContrastTextColor(newBead.rgb.r, newBead.rgb.g, newBead.rgb.b),
          isEmpty: false,
        };
      }
      return cell;
    })
  );

  return {
    ...grid,
    cells: newCells,
    totalBeads: grid.totalBeads + totalDiff,
  };
}

/**
 * Substituição em lote de uma cor por outra em toda a prancha.
 */
export function batchReplaceBead(
  grid: GridMatrix,
  fromCode: string,
  toBead: BeadColor
): GridMatrix {
  let changed = 0;
  const newCells = grid.cells.map((rowArr, r) =>
    rowArr.map((cell, c) => {
      if (!cell.isEmpty && cell.beadCode === fromCode) {
        changed++;
        return {
          row: r,
          col: c,
          beadCode: toBead.code,
          beadName: toBead.name,
          hex: toBead.hex,
          rgb: { ...toBead.rgb },
          textColor: getContrastTextColor(toBead.rgb.r, toBead.rgb.g, toBead.rgb.b),
          isEmpty: false,
        };
      }
      return cell;
    })
  );

  if (changed === 0) return grid;

  return {
    ...grid,
    cells: newCells,
  };
}

/**
 * Espelha a grade horizontalmente (inverte esquerda/direita).
 */
export function flipGridHorizontal(grid: GridMatrix): GridMatrix {
  const width = grid.width;
  const newCells = grid.cells.map((rowArr, r) =>
    [...rowArr].reverse().map((cell, c) => ({
      ...cell,
      row: r,
      col: c,
    }))
  );

  return {
    ...grid,
    cells: newCells,
  };
}

/**
 * Espelha a grade verticalmente (inverte topo/base).
 */
export function flipGridVertical(grid: GridMatrix): GridMatrix {
  const height = grid.height;
  const newCells = [...grid.cells].reverse().map((rowArr, r) =>
    rowArr.map((cell, c) => ({
      ...cell,
      row: r,
      col: c,
    }))
  );

  return {
    ...grid,
    cells: newCells,
  };
}

/**
 * Rotaciona a grade 90 graus no sentido horário.
 */
export function rotateGrid90(grid: GridMatrix): GridMatrix {
  const oldH = grid.height;
  const oldW = grid.width;
  const newH = oldW;
  const newW = oldH;

  const newCells: GridCell[][] = [];

  for (let r = 0; r < newH; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < newW; c++) {
      const srcCell = grid.cells[oldH - 1 - c][r];
      row.push({
        ...srcCell,
        row: r,
        col: c,
      });
    }
    newCells.push(row);
  }

  return {
    ...grid,
    width: newW,
    height: newH,
    cells: newCells,
  };
}

/**
 * Limpa toda a grade (torna todas as células vazias).
 */
export function clearAllGrid(grid: GridMatrix): GridMatrix {
  const newCells = grid.cells.map((rowArr, r) =>
    rowArr.map((_, c) => ({
      row: r,
      col: c,
      beadCode: '',
      beadName: '',
      hex: '#FFFFFF',
      rgb: { r: 255, g: 255, b: 255 },
      textColor: '#000000' as const,
      isEmpty: true,
    }))
  );

  return {
    ...grid,
    cells: newCells,
    totalBeads: 0,
  };
}

