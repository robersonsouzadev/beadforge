import { describe, it, expect } from 'vitest';
import { generateThumbnailFromGrid, generateThumbnailFromGrid3D, createProjectThumbnail } from '../../lib/thumbnail';
import { buildGridMatrix } from '../../core/grid/grid-builder';
import { PALETTES } from '../../data/palettes/index';
import type { BeadColor } from '../../core/schemas/palette';
import type { VoxelGrid3D } from '../../core/voxel/voxel-types';

const PALETTE = PALETTES['pindoo-standard'].colors;
const BEAD_A4 = PALETTE.find((c) => c.code === 'A4')!;
const BEAD_G8 = PALETTE.find((c) => c.code === 'G8')!;

describe('Thumbnail Generator', () => {
  it('gera thumbnail SVG válido a partir de um GridMatrix 2D', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_A4, BEAD_G8],
      [BEAD_G8, BEAD_A4],
    ];
    const grid = buildGridMatrix(rawBeads, 2, 2);
    const thumb = generateThumbnailFromGrid(grid);

    expect(thumb).toBeDefined();
    expect(thumb.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('retorna string vazia para grid nulo ou vazio', () => {
    expect(generateThumbnailFromGrid({ width: 0, height: 0, cells: [], pegboardSize: 29, totalBeads: 0 })).toBe('');
  });

  it('gera thumbnail SVG a partir de VoxelGrid3D', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_A4, BEAD_G8],
      [BEAD_G8, BEAD_A4],
    ];
    const grid = buildGridMatrix(rawBeads, 2, 2);

    const voxelGrid: VoxelGrid3D = {
      width: 2,
      height: 2,
      depth: 2,
      totalBeads: 8,
      totalLayers: 2,
      pitchMm: 2.6,
      layers: [
        {
          z: 0,
          name: 'Camada 1',
          heightMm: 2.6,
          grid,
          beadCount: 4,
          isEmpty: false,
          isVisible: true,
          isLocked: false,
        },
        {
          z: 1,
          name: 'Camada 2',
          heightMm: 5.2,
          grid,
          beadCount: 4,
          isEmpty: false,
          isVisible: true,
          isLocked: false,
        },
      ],
    };

    const thumb = generateThumbnailFromGrid3D(voxelGrid);
    expect(thumb).toBeDefined();
    expect(thumb.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('createProjectThumbnail gera thumbnail apropriado', async () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_A4, BEAD_G8],
    ];
    const grid = buildGridMatrix(rawBeads, 2, 1);

    const thumbFromGrid = await createProjectThumbnail({ grid });
    expect(thumbFromGrid).toBeDefined();
    expect(thumbFromGrid!.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });
});
