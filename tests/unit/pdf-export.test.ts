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

  it('gera PDF com marca d\'água discreta para exportação do plano gratuito', async () => {
    const summary = buildBeadSummary(grid);
    const doc = generateBeadPDF(grid, summary, {
      title: 'Molde Gratuito',
      pageSize: 'A4',
      orientation: 'portrait',
      isPro: false,
      watermark: true,
    });

    const chunks: Buffer[] = [];
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('permite exportação de PDF e CSV no plano gratuito em subscriptions config', async () => {
    const { SUBSCRIPTION_PLANS } = await import('../../config/subscriptions');
    expect(SUBSCRIPTION_PLANS.free.limits.exportFormats).toContain('pdf');
    expect(SUBSCRIPTION_PLANS.free.limits.exportFormats).toContain('csv');
    expect(SUBSCRIPTION_PLANS.free.limits.exportFormats).toContain('png');
    expect(SUBSCRIPTION_PLANS.free.limits.maxDimension).toBeGreaterThanOrEqual(200);
  });

  it('gera PDF White-Label personalizado para assinantes Studio', async () => {
    const summary = buildBeadSummary(grid);
    const doc = generateBeadPDF(grid, summary, {
      title: 'Encomenda Quadro Mário',
      pageSize: 'A4',
      orientation: 'portrait',
      isPro: true,
      watermark: false,
      studioName: 'Ateliê Geek Art',
      contactPhone: '11999998888',
      instagramHandle: 'ateliegeekart',
    });

    const chunks: Buffer[] = [];
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
