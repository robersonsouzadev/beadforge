import { describe, it, expect } from 'vitest';
import { generateBeadPDF } from '../../core/export/pdf-generator';
import { generateBOMReport } from '../../core/export/bom-generator';
import { buildBeadSummary } from '../../core/grid/summary-builder';
import { buildGridMatrix } from '../../core/grid/grid-builder';
import { PALETTES } from '../../data/palettes/index';
import { PaletteMatcher } from '../../core/color/palette-matcher';
import { applyDithering } from '../../core/color/dithering';
import { VoxelEngine } from '../../core/voxel/voxelizer';

describe('PDF & BOM Export Engine', () => {
  const palette = PALETTES['mini-26mm-120'].colors;
  const matcher = new PaletteMatcher(palette);
  const w = 30;
  const h = 30;
  const pixels = Buffer.alloc(w * h * 3, 128);
  const beadGrid = applyDithering(pixels, w, h, matcher, 'none');
  const grid = buildGridMatrix(beadGrid, w, h, { pegboardSize: 29 });

  it('gera relatório BOM 3D com contagem de peças e peso estimado', () => {
    const engine = new VoxelEngine(palette);
    const voxelGrid = engine.buildFromRawVoxels(
      [
        { x: 0, y: 0, z: 0, rgb: { r: 255, g: 0, b: 0 } },
        { x: 1, y: 1, z: 0, rgb: { r: 0, g: 255, b: 0 } },
      ],
      10,
      10,
      2
    );

    const bom = generateBOMReport(voxelGrid, 'Teste 3D');
    expect(bom.totalBeads).toBe(2);
    expect(bom.estimatedWeightGrams).toBeGreaterThan(0);
    expect(bom.items.length).toBeGreaterThan(0);
  });

  it('gera stream de documento PDF vetorial sem erros', async () => {
    const summary = buildBeadSummary(grid);
    const doc = generateBeadPDF(grid, summary, {
      title: 'Teste de Exportação',
      pageSize: 'A4',
      orientation: 'portrait',
      showCodes: true,
      showSummary: true,
    });

    const chunks: Buffer[] = [];
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    expect(buffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes: %PDF
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
