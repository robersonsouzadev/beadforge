import { describe, it, expect } from 'vitest';
import { VoxelEngine } from '../../core/voxel/voxelizer';
import { parseVoxBinary } from '../../core/voxel/vox-parser';
import { generateBOMReport } from '../../core/export/bom-generator';
import { PALETTES } from '../../data/palettes/index';

describe('Voxel Engine & 3D Layer Stacking', () => {
  const palette = PALETTES['mini-26mm-120'].colors;
  const engine = new VoxelEngine(palette);

  it('deve criar um VoxelGrid3D vazio com as dimensões corretas', () => {
    const grid3D = VoxelEngine.createEmptyGrid(20, 20, 10, 2.6);
    expect(grid3D.width).toBe(20);
    expect(grid3D.height).toBe(20);
    expect(grid3D.depth).toBe(10);
    expect(grid3D.layers.length).toBe(10);
    expect(grid3D.totalBeads).toBe(0);
    expect(grid3D.layers[0].grid.cells.length).toBe(20);
    expect(grid3D.layers[0].grid.cells[0].length).toBe(20);
  });

  it('deve construir VoxelGrid3D a partir de pontos brutos em modo sólido', () => {
    const rawVoxels = [
      { x: 0, y: 0, z: 0, rgb: { r: 255, g: 0, b: 0 } },
      { x: 1, y: 0, z: 0, rgb: { r: 255, g: 0, b: 0 } },
      { x: 0, y: 1, z: 0, rgb: { r: 0, g: 255, b: 0 } },
      { x: 0, y: 0, z: 1, rgb: { r: 0, g: 0, b: 255 } },
    ];

    const grid3D = engine.buildFromRawVoxels(rawVoxels, 10, 10, 5, { fillMode: 'solid' });
    expect(grid3D.totalBeads).toBeGreaterThan(0);
    expect(grid3D.layers[0].beadCount).toBeGreaterThan(0);
  });

  it('deve processar e gerar relatório de materiais (BOM)', () => {
    const rawVoxels = [
      { x: 0, y: 0, z: 0, rgb: { r: 255, g: 0, b: 0 } },
      { x: 1, y: 1, z: 0, rgb: { r: 255, g: 0, b: 0 } },
      { x: 2, y: 2, z: 1, rgb: { r: 20, g: 20, b: 20 } },
    ];

    const grid3D = engine.buildFromRawVoxels(rawVoxels, 15, 15, 5, { fillMode: 'solid' });
    const bom = generateBOMReport(grid3D, 'Teste 3D');

    expect(bom.totalBeads).toBe(grid3D.totalBeads);
    expect(bom.items.length).toBeGreaterThan(0);
    expect(bom.estimatedWeightGrams).toBeGreaterThan(0);
  });

  it('deve validar e rejeitar buffers binários não-VOX', () => {
    const fakeBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(() => parseVoxBinary(fakeBuffer)).toThrow('Arquivo inválido');
  });
});
