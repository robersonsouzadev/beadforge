import { describe, it, expect } from 'vitest';
import { calculateSupportRods } from '../../core/voxel/rod-calculator';
import { VoxelEngine } from '../../core/voxel/voxelizer';
import { PALETTES } from '../../data/palettes';

describe('Acrylic Support Rods Calculator (Pinos Estruturais 3D)', () => {
  const palette = PALETTES['mini-26mm-120'].colors;

  it('calcula posições verticais e marca isRodHole em modelo 3D alto', () => {
    const engine = new VoxelEngine(palette);
    const rawVoxels: Array<{ x: number; y: number; z: number; rgb: { r: number; g: number; b: number } }> = [];

    // Cria um cilindro vertical de 10 camadas de altura no centro (x=5..7, y=5..7)
    for (let z = 0; z < 10; z++) {
      for (let x = 5; x <= 7; x++) {
        for (let y = 5; y <= 7; y++) {
          rawVoxels.push({
            x,
            y,
            z,
            rgb: { r: 255, g: 0, b: 0 },
          });
        }
      }
    }

    const grid3D = engine.buildFromRawVoxels(rawVoxels, 15, 15, 10, 2.6);
    const { grid3D: updatedGrid, rods } = calculateSupportRods(grid3D, {
      minOverlapLayers: 4,
      minSpacing: 3,
    });

    expect(rods.length).toBeGreaterThan(0);
    expect(rods[0].lengthLayers).toBeGreaterThanOrEqual(4);
    expect(rods[0].lengthMm).toBeGreaterThan(10);

    // Verifica se as células correspondentes foram marcadas com isRodHole = true
    const rodX = rods[0].x;
    const rodY = rods[0].y;
    const sampleLayer = updatedGrid.layers[2];
    expect(sampleLayer.grid.cells[rodY][rodX].isRodHole).toBe(true);
  });

  it('não gera hastes para modelos muito finos (menos de 4 camadas)', () => {
    const engine = new VoxelEngine(palette);
    const rawVoxels = [
      { x: 5, y: 5, z: 0, rgb: { r: 255, g: 0, b: 0 } },
      { x: 5, y: 5, z: 1, rgb: { r: 255, g: 0, b: 0 } },
    ];

    const grid3D = engine.buildFromRawVoxels(rawVoxels, 10, 10, 2, 2.6);
    const { rods } = calculateSupportRods(grid3D, { minOverlapLayers: 4 });

    expect(rods.length).toBe(0);
  });
});
