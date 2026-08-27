import { describe, it, expect } from 'vitest';
import { buildGridMatrix } from '../../core/grid/grid-builder';
import { buildBeadSummary } from '../../core/grid/summary-builder';
import { setCellBead, floodFill, eraseCell, batchReplaceBead } from '../../core/grid/grid-editor';
import { generateBeadPDF } from '../../core/export/pdf-generator';
import { PALETTES } from '../../data/palettes/index';
import type { BeadColor } from '../../core/schemas/palette';

const PALETTE = PALETTES['pindoo-standard'].colors;
const BEAD_A4 = PALETTE.find((c) => c.code === 'A4')!;
const BEAD_G8 = PALETTE.find((c) => c.code === 'G8')!;
const BEAD_H2 = PALETTE.find((c) => c.code === 'H2')!;

describe('Grid Builder & Summary', () => {
  it('constrói uma matriz 3x3 com contagem correta e metadados', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_A4, BEAD_G8, BEAD_H2],
      [BEAD_H2, BEAD_A4, BEAD_G8],
      [BEAD_G8, BEAD_G8, BEAD_H2],
    ];

    const grid = buildGridMatrix(rawBeads, 3, 3, { pegboardSize: 29 });
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(3);
    expect(grid.totalBeads).toBe(9);
    expect(grid.cells[0][0].beadCode).toBe('A4');
    expect(grid.cells[0][0].textColor).toBe('#000000'); // A4 é amarelo claro
    expect(grid.cells[0][1].beadCode).toBe('G8');
    expect(grid.cells[0][1].textColor).toBe('#FFFFFF'); // G8 é marrom escuro

    const summary = buildBeadSummary(grid);
    expect(summary.length).toBe(3);

    const a4Summary = summary.find((s) => s.code === 'A4')!;
    const g8Summary = summary.find((s) => s.code === 'G8')!;
    const h2Summary = summary.find((s) => s.code === 'H2')!;

    expect(a4Summary.count).toBe(2);
    expect(g8Summary.count).toBe(4);
    expect(h2Summary.count).toBe(3);
  });
});

describe('Grid Interactive Editor', () => {
  it('permite pintar uma célula individual com setCellBead', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_H2, BEAD_H2],
      [BEAD_H2, BEAD_H2],
    ];
    let grid = buildGridMatrix(rawBeads, 2, 2);
    grid = setCellBead(grid, 0, 1, BEAD_A4);

    expect(grid.cells[0][1].beadCode).toBe('A4');
    expect(grid.cells[0][0].beadCode).toBe('H2');
  });

  it('permite apagar uma célula com eraseCell', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_H2, BEAD_A4],
      [BEAD_H2, BEAD_H2],
    ];
    let grid = buildGridMatrix(rawBeads, 2, 2);
    expect(grid.totalBeads).toBe(4);

    grid = eraseCell(grid, 0, 1);
    expect(grid.cells[0][1].isEmpty).toBe(true);
    expect(grid.cells[0][1].beadCode).toBe('');
    expect(grid.totalBeads).toBe(3);
  });

  it('executa Flood Fill em células contíguas', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_H2, BEAD_H2, BEAD_G8],
      [BEAD_H2, BEAD_H2, BEAD_G8],
      [BEAD_G8, BEAD_G8, BEAD_G8],
    ];
    let grid = buildGridMatrix(rawBeads, 3, 3);
    grid = floodFill(grid, 0, 0, BEAD_A4);

    expect(grid.cells[0][0].beadCode).toBe('A4');
    expect(grid.cells[0][1].beadCode).toBe('A4');
    expect(grid.cells[1][0].beadCode).toBe('A4');
    expect(grid.cells[1][1].beadCode).toBe('A4');
    expect(grid.cells[0][2].beadCode).toBe('G8'); // Não alterado
  });

  it('executa substituição em lote com batchReplaceBead', () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_A4, BEAD_G8],
      [BEAD_G8, BEAD_A4],
    ];
    let grid = buildGridMatrix(rawBeads, 2, 2);
    grid = batchReplaceBead(grid, 'A4', BEAD_H2);

    expect(grid.cells[0][0].beadCode).toBe('H2');
    expect(grid.cells[1][1].beadCode).toBe('H2');
    expect(grid.cells[0][1].beadCode).toBe('G8');
  });
});

describe('PDF Generator', () => {
  it('gera stream PDFKit válido para a grid e summary', async () => {
    const rawBeads: BeadColor[][] = [
      [BEAD_A4, BEAD_G8],
      [BEAD_G8, BEAD_H2],
    ];
    const grid = buildGridMatrix(rawBeads, 2, 2);
    const summary = buildBeadSummary(grid);

    const doc = generateBeadPDF(grid, summary, {
      title: 'Hello Kitty Test',
      showCodes: true,
      showSummary: true,
    });

    expect(doc).toBeDefined();

    // Captura os buffers do PDF para validar que foi gerado sem erros
    const chunks: Buffer[] = [];
    const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.end();
    const pdfBuffer = await pdfBufferPromise;
    expect(pdfBuffer.length).toBeGreaterThan(500); // PDF gerado com sucesso
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-'); // Cabeçalho mágico de PDF
  });
});
