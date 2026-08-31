import { describe, it, expect } from 'vitest';
import {
  flipGridHorizontal,
  flipGridVertical,
  rotateGrid90,
  clearAllGrid,
} from '../../core/grid/grid-editor';
import { buildGridMatrix } from '../../core/grid/grid-builder';
import type { BeadColor } from '../../core/schemas/palette';

const redBead: BeadColor = {
  code: 'H05',
  name: 'Red',
  hex: '#FF0000',
  rgb: { r: 255, g: 0, b: 0 },
};

const blueBead: BeadColor = {
  code: 'H08',
  name: 'Blue',
  hex: '#0000FF',
  rgb: { r: 0, g: 0, b: 255 },
};

const emptyBead: BeadColor = {
  code: '',
  name: 'Empty',
  hex: '#FFFFFF',
  rgb: { r: 255, g: 255, b: 255 },
};

describe('Grid Transformation Tools', () => {
  const createTestGrid = () => {
    // 2x2 grid:
    // [ Red,   Blue  ]
    // [ Empty, Red   ]
    const raw = [
      [redBead, blueBead],
      [emptyBead, redBead],
    ];
    return buildGridMatrix(raw, 2, 2);
  };

  it('espelha a grade horizontalmente (flip horizontal)', () => {
    const grid = createTestGrid();
    const flipped = flipGridHorizontal(grid);

    // Row 0: [ Blue, Red ]
    expect(flipped.cells[0][0].beadCode).toBe('H08');
    expect(flipped.cells[0][1].beadCode).toBe('H05');

    // Row 1: [ Red, Empty ]
    expect(flipped.cells[1][0].beadCode).toBe('H05');
    expect(flipped.cells[1][1].isEmpty).toBe(true);
  });

  it('espelha a grade verticalmente (flip vertical)', () => {
    const grid = createTestGrid();
    const flipped = flipGridVertical(grid);

    // Row 0 should be original Row 1: [ Empty, Red ]
    expect(flipped.cells[0][0].isEmpty).toBe(true);
    expect(flipped.cells[0][1].beadCode).toBe('H05');

    // Row 1 should be original Row 0: [ Red, Blue ]
    expect(flipped.cells[1][0].beadCode).toBe('H05');
    expect(flipped.cells[1][1].beadCode).toBe('H08');
  });

  it('rotaciona a grade 90 graus no sentido horário (rotate 90)', () => {
    const grid = createTestGrid();
    const rotated = rotateGrid90(grid);

    // Original:
    // [ (0,0): Red,   (0,1): Blue ]
    // [ (1,0): Empty, (1,1): Red  ]
    // Rotated 90 deg clockwise:
    // [ Empty, Red  ]
    // [ Red,   Blue ]
    expect(rotated.cells[0][0].isEmpty).toBe(true);
    expect(rotated.cells[0][1].beadCode).toBe('H05');
    expect(rotated.cells[1][0].beadCode).toBe('H05');
    expect(rotated.cells[1][1].beadCode).toBe('H08');
  });

  it('limpa toda a grade (clear grid)', () => {
    const grid = createTestGrid();
    const cleared = clearAllGrid(grid);

    expect(cleared.totalBeads).toBe(0);
    expect(cleared.cells[0][0].isEmpty).toBe(true);
    expect(cleared.cells[0][1].isEmpty).toBe(true);
    expect(cleared.cells[1][0].isEmpty).toBe(true);
    expect(cleared.cells[1][1].isEmpty).toBe(true);
  });
});
