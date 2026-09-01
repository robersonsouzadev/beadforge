// @ts-ignore
import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';
import type { GridMatrix } from '../schemas/grid';
import type { BeadSummary } from '../schemas/project';
import type { VoxelGrid3D } from '../voxel/voxel-types';

export interface PDFOptions {
  pageSize?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  cellSize?: number; // pontos PDF (1pt = 1/72 pol)
  showCodes?: boolean;
  showGrid?: boolean;
  showSummary?: boolean;
  title?: string;
  pegboardSize?: number; // 29 por padrão
  watermark?: boolean;
  isPro?: boolean;
  studioName?: string;
  contactPhone?: string;
  instagramHandle?: string;
}

const GRID_LINE_COLOR = '#CCCCCC';
const GRID_LINE_WIDTH = 0.5;
const THICK_LINE_COLOR = '#333333';
const THICK_LINE_WIDTH = 1.5;
const THICK_LINE_INTERVAL = 5;

/**
 * Gera um documento PDF vetorial diagramado com precisão milimétrica.
 */
export function generateBeadPDF(
  grid: GridMatrix,
  summary: BeadSummary[],
  options: PDFOptions = {}
): typeof PDFDocument {
  const pageSize = options.pageSize ?? 'A4';
  const orientation = options.orientation ?? 'portrait';
  const title = options.title ?? 'Bead Pattern';
  const showCodes = options.showCodes ?? true;
  const showSummary = options.showSummary ?? true;

  const doc = new (PDFDocument as any)({
    size: pageSize,
    layout: orientation,
    margin: 36, // 0.5 polegada
    compress: true,
    info: {
      Title: title,
      Creator: 'BeadForge',
    },
  });

  const margin = 36;
  const pageW = doc.page.width - margin * 2;
  const pageH = doc.page.height - margin * 2;

  // Dimensões de layout
  const headerHeight = 35;
  const colLabelHeight = 12;
  const rowLabelWidth = 18;
  const summaryReserveHeight = showSummary ? 95 : 10;

  const gridAreaW = pageW - rowLabelWidth;
  const gridAreaH = pageH - headerHeight - colLabelHeight - summaryReserveHeight;

  // Calcula tamanho ótimo da célula se não fornecido
  let cellSize = options.cellSize;
  if (!cellSize) {
    const maxCellW = gridAreaW / grid.width;
    const maxCellH = gridAreaH / grid.height;
    cellSize = Math.max(8, Math.min(18, Math.min(maxCellW, maxCellH)));
  }

  // Colunas e linhas por página
  const colsPerPage = Math.max(1, Math.floor(gridAreaW / cellSize));
  const rowsPerPage = Math.max(1, Math.floor(gridAreaH / cellSize));

  const totalPageCols = Math.ceil(grid.width / colsPerPage);
  const totalPageRows = Math.ceil(grid.height / rowsPerPage);
  const totalPages = totalPageCols * totalPageRows;

  // ─────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO DOS TILES / PÁGINAS DA GRADE
  // ─────────────────────────────────────────────────────────────
  for (let pageRow = 0; pageRow < totalPageRows; pageRow++) {
    for (let pageCol = 0; pageCol < totalPageCols; pageCol++) {
      if (pageRow > 0 || pageCol > 0) {
        doc.addPage();
      }

      const pageNum = pageRow * totalPageCols + pageCol + 1;

      // Header: Título centralizado
      doc.fontSize(16).fillColor('#222222').text(title, margin, margin, {
        width: pageW,
        align: 'center',
      });

      if (totalPages > 1) {
        doc.fontSize(8).fillColor('#888888').text(
          `Prancha ${pageNum} / ${totalPages}`,
          margin,
          margin + 20,
          { width: pageW, align: 'center' }
        );
      }

      const startCol = pageCol * colsPerPage;
      const endCol = Math.min(startCol + colsPerPage, grid.width);
      const startRow = pageRow * rowsPerPage;
      const endRow = Math.min(startRow + rowsPerPage, grid.height);

      const renderedCols = endCol - startCol;
      const renderedRows = endRow - startRow;

      // Centraliza horizontalmente a grid na página
      const totalGridW = renderedCols * cellSize;
      const gridOriginX = margin + rowLabelWidth + Math.max(0, (gridAreaW - totalGridW) / 2);
      const gridOriginY = margin + headerHeight + colLabelHeight;

      // Indicadores de Coluna (topo)
      doc.fontSize(6).fillColor('#777777');
      for (let c = startCol; c < endCol; c++) {
        const x = gridOriginX + (c - startCol) * cellSize;
        doc.text(String(c + 1), x, gridOriginY - colLabelHeight + 2, {
          width: cellSize,
          align: 'center',
        });
      }

      // Renderiza Células da Grade
      for (let r = startRow; r < endRow; r++) {
        const y = gridOriginY + (r - startRow) * cellSize;

        // Indicador de Linha (esquerda)
        doc.fontSize(6).fillColor('#777777').text(
          String(r + 1),
          gridOriginX - rowLabelWidth,
          y + (cellSize - 6) / 2,
          {
            width: rowLabelWidth - 4,
            align: 'right',
          }
        );

        for (let c = startCol; c < endCol; c++) {
          const x = gridOriginX + (c - startCol) * cellSize;
          const cell = grid.cells[r][c];

          if (cell.isEmpty) {
            // Célula Vazia: fundo branco e linha sutil
            doc.rect(x, y, cellSize, cellSize)
              .lineWidth(GRID_LINE_WIDTH)
              .strokeColor(GRID_LINE_COLOR)
              .stroke();
          } else {
            // Célula Preenchida: fundo com a cor do bead
            doc.rect(x, y, cellSize, cellSize)
              .lineWidth(GRID_LINE_WIDTH)
              .fillAndStroke(cell.hex, GRID_LINE_COLOR);

            // Código do bead
            if (showCodes && cellSize >= 9) {
              const codeFontSize = Math.max(4, Math.min(cellSize * 0.38, 7.5));
              doc.fontSize(codeFontSize)
                .fillColor(cell.textColor)
                .text(cell.beadCode, x, y + (cellSize - codeFontSize) / 2, {
                  width: cellSize,
                  align: 'center',
                  lineBreak: false,
                });
            }
          }
        }
      }

      // Linhas Grossas a cada 5 Células
      doc.lineWidth(THICK_LINE_WIDTH).strokeColor(THICK_LINE_COLOR);

      for (let c = 0; c <= renderedCols; c++) {
        if ((startCol + c) % THICK_LINE_INTERVAL === 0 || c === renderedCols) {
          const x = gridOriginX + c * cellSize;
          doc.moveTo(x, gridOriginY)
            .lineTo(x, gridOriginY + renderedRows * cellSize)
            .stroke();
        }
      }

      for (let r = 0; r <= renderedRows; r++) {
        if ((startRow + r) % THICK_LINE_INTERVAL === 0 || r === renderedRows) {
          const y = gridOriginY + r * cellSize;
          doc.moveTo(gridOriginX, y)
            .lineTo(gridOriginX + renderedCols * cellSize, y)
            .stroke();
        }
      }

      // Borda Externa Grossa da Grade
      doc.rect(gridOriginX, gridOriginY, totalGridW, renderedRows * cellSize)
        .lineWidth(THICK_LINE_WIDTH)
        .strokeColor(THICK_LINE_COLOR)
        .stroke();

      // ─────────────────────────────────────────────────────────────
      // SEÇÃO COLOR SUMMARY NA BASE DA PÁGINA (Estilo Pindoo Create)
      // ─────────────────────────────────────────────────────────────
      if (showSummary && summary.length > 0 && pageNum === totalPages) {
        const summaryStartY = gridOriginY + renderedRows * cellSize + 16;

        // Título e Contagem Total
        doc.fontSize(11).fillColor('#222222').text(
          'Color Summary',
          margin,
          summaryStartY
        );

        doc.fontSize(11).fillColor('#222222').text(
          `Total beads: ${grid.totalBeads}`,
          margin,
          summaryStartY,
          { width: pageW, align: 'right' }
        );

        // Layout em Grade de Swatches Cilíndricos
        const swatchSlotW = 44;
        const swatchSlotH = 50;
        const swatchesPerRow = Math.floor(pageW / swatchSlotW);
        const beadIconW = 20;
        const beadIconH = 22;

        const sortedSummary = [...summary].sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true })
        );

        let curX = margin;
        let curY = summaryStartY + 18;

        for (let i = 0; i < sortedSummary.length; i++) {
          const item = sortedSummary[i];

          if (i > 0 && i % swatchesPerRow === 0) {
            curX = margin;
            curY += swatchSlotH;
          }

          // 1. Código da Cor (acima do ícone)
          doc.fontSize(7).fillColor('#666666').text(
            item.code,
            curX,
            curY,
            { width: swatchSlotW, align: 'center' }
          );

          // 2. Ícone cilíndrico do bead (retângulo arredondado sombreado)
          const iconX = curX + (swatchSlotW - beadIconW) / 2;
          const iconY = curY + 10;

          doc.roundedRect(iconX, iconY, beadIconW, beadIconH, 3)
            .lineWidth(0.5)
            .fillAndStroke(item.hex, '#AAAAAA');

          // Furo central do bead (pequeno círculo)
          doc.circle(iconX + beadIconW / 2, iconY + 5, 2.5)
            .lineWidth(0.5)
            .fillAndStroke('#FFFFFF', '#AAAAAA');

          // 3. Quantidade de Peças (abaixo do ícone)
          doc.fontSize(8).fillColor('#222222').text(
            String(item.count),
            curX,
            iconY + beadIconH + 4,
            { width: swatchSlotW, align: 'center' }
          );

          curX += swatchSlotW;
        }
      }

      // Marca d'água discreta de paridade para plano gratuito OU Branding White-Label Studio
      renderPDFFooter(doc, options, margin, pageW, pageH);
    }
  }

  return doc;
}

function renderPDFFooter(
  doc: any,
  options: PDFOptions,
  margin: number,
  pageW: number,
  pageH: number
) {
  const isWatermarkActive = options.watermark || options.isPro === false;

  // Marca d'água diagonal personalizada com nome do usuário e data (Benchmark Beads3D)
  if (isWatermarkActive || options.studioName) {
    const userName = options.studioName || 'BeadForge Studio';
    const dateStr = new Date().toISOString().split('T')[0];
    const watermarkText = `${userName.toUpperCase()} ${dateStr} • BEADFORGE.COM.BR`;

    doc.save();
    doc.fontSize(14).fillColor('#E4E4E7');
    doc.opacity(0.3);
    doc.rotate(-35, { origin: [pageW / 2, pageH / 2] });

    doc.text(watermarkText, -100, pageH / 2 - 120, { width: pageW + 300, align: 'center' });
    doc.text(watermarkText, -100, pageH / 2, { width: pageW + 300, align: 'center' });
    doc.text(watermarkText, -100, pageH / 2 + 120, { width: pageW + 300, align: 'center' });
    doc.restore();
  }

  if (isWatermarkActive) {
    doc.fontSize(6.5).fillColor('#71717A').text(
      'Criado com BeadForge Studio • Materiais recomendados no Mercado Livre: meli.la/2q4Xt3j (Kit 10.000 Beads 2,6mm)',
      margin,
      pageH + margin - 8,
      { width: pageW, align: 'center' }
    );
  } else if (options.studioName || options.contactPhone || options.instagramHandle) {
    const brandParts = [];
    if (options.studioName) brandParts.push(`Ateliê: ${options.studioName}`);
    if (options.contactPhone) brandParts.push(`WhatsApp: ${options.contactPhone}`);
    if (options.instagramHandle) brandParts.push(`@${options.instagramHandle}`);

    doc.fontSize(7).fillColor('#555555').text(
      brandParts.join(' • '),
      margin,
      pageH + margin - 8,
      { width: pageW, align: 'center' }
    );
  }
}

/**
 * Gera o Guia de Montagem e Blueprints 3D Camada-por-Camada em PDF Vetorial.
 */
export function generate3DAssemblyPDF(
  grid3D: VoxelGrid3D,
  options: PDFOptions = {}
): typeof PDFDocument {
  const pageSize = options.pageSize ?? 'A4';
  const orientation = options.orientation ?? 'portrait';
  const title = options.title ?? 'Guia de Montagem 3D';
  const showCodes = options.showCodes ?? true;

  const doc = new (PDFDocument as any)({
    size: pageSize,
    layout: orientation,
    margin: 36,
    compress: true,
    info: {
      Title: title,
      Creator: 'BeadForge Ultra 3D',
    },
  });

  const margin = 36;
  const pageW = doc.page.width - margin * 2;
  const pageH = doc.page.height - margin * 2;

  // ─────────────────────────────────────────────────────────────
  // PÁGINA 1: CAPA, RESUMO DO PROJETO & INSTRUÇÕES DE MONTAGEM
  // ─────────────────────────────────────────────────────────────
  doc.fontSize(18).fillColor('#18181B').text(title, margin, margin, {
    width: pageW,
    align: 'center',
  });

  doc.fontSize(8.5).fillColor('#D97706').text(
    'BEADFORGE ULTRA 3D • GUIA DE MONTAGEM E FATIAMENTO PASSO A PASSO',
    margin,
    margin + 24,
    { width: pageW, align: 'center' }
  );

  // Caixa de Estatísticas
  const statsY = margin + 44;
  doc.rect(margin, statsY, pageW, 46).fillAndStroke('#F4F4F5', '#E4E4E7');

  const statColW = pageW / 4;
  const depthMm = (grid3D.totalLayers * (grid3D.pitchMm || 2.6)).toFixed(1);

  doc.fontSize(7.5).fillColor('#71717A').text('TOTAL DE CAMADAS', margin, statsY + 8, { width: statColW, align: 'center' });
  doc.fontSize(11).fillColor('#18181B').text(`${grid3D.totalLayers} Camadas`, margin, statsY + 20, { width: statColW, align: 'center' });

  doc.fontSize(7.5).fillColor('#71717A').text('ALTURA FINAL', margin + statColW, statsY + 8, { width: statColW, align: 'center' });
  doc.fontSize(11).fillColor('#18181B').text(`${depthMm} mm`, margin + statColW, statsY + 20, { width: statColW, align: 'center' });

  doc.fontSize(7.5).fillColor('#71717A').text('TOTAL DE BEADS', margin + statColW * 2, statsY + 8, { width: statColW, align: 'center' });
  doc.fontSize(11).fillColor('#D97706').text(`${grid3D.totalBeads.toLocaleString()} peças`, margin + statColW * 2, statsY + 20, { width: statColW, align: 'center' });

  doc.fontSize(7.5).fillColor('#71717A').text('BASE DO GRID', margin + statColW * 3, statsY + 8, { width: statColW, align: 'center' });
  doc.fontSize(11).fillColor('#18181B').text(`${grid3D.width} × ${grid3D.height} pinos`, margin + statColW * 3, statsY + 20, { width: statColW, align: 'center' });

  // Manual de Oficina / Instruções de Ferro e Colagem
  const guideY = statsY + 54;
  doc.fontSize(10).fillColor('#18181B').text('Instruções de Montagem e Passagem a Ferro:', margin, guideY);

  const steps = [
    '1. Montagem da Camada: Monte cada camada individual em sua pegboard seguindo o gabarito das páginas seguintes.',
    '2. Passagem a Ferro: Passe cada camada com ferro de passar a seco (temperatura média) e papel manteiga por 10-15s apenas no lado inferior.',
    '3. Prensagem e Nivelamento: Deixe cada camada esfriar sob um peso reto por 3 a 5 minutos para evitar empenamento.',
    '4. Empilhamento e Fixação: Empilhe as camadas em ordem crescente (Camada 1 na base até o topo) aplicando cola entre as faces fundidas.',
  ];

  let curStepY = guideY + 14;
  for (const step of steps) {
    doc.fontSize(7.5).fillColor('#3F3F46').text(step, margin + 4, curStepY, { width: pageW - 8 });
    curStepY += 13;
  }

  // Lista Consolidada de Materiais (BOM Total 3D)
  const bomTotalMap = new Map<string, { code: string; name: string; hex: string; count: number }>();
  for (const layer of grid3D.layers) {
    for (let r = 0; r < layer.grid.height; r++) {
      for (let c = 0; c < layer.grid.width; c++) {
        const cell = layer.grid.cells[r][c];
        if (cell.isEmpty || !cell.beadCode) continue;
        let entry = bomTotalMap.get(cell.beadCode);
        if (!entry) {
          entry = { code: cell.beadCode, name: cell.beadName, hex: cell.hex, count: 0 };
          bomTotalMap.set(cell.beadCode, entry);
        }
        entry.count++;
      }
    }
  }

  const consolidatedSummary = Array.from(bomTotalMap.values()).sort((a, b) => b.count - a.count);

  const bomY = curStepY + 10;
  doc.fontSize(10).fillColor('#18181B').text('Lista Consolidada de Materiais (Todas as Camadas):', margin, bomY);

  const swatchSlotW = 42;
  const swatchSlotH = 42;
  const swatchesPerRow = Math.floor(pageW / swatchSlotW);
  const beadIconW = 16;
  const beadIconH = 18;

  let curX = margin;
  let curY = bomY + 14;

  for (let i = 0; i < consolidatedSummary.length; i++) {
    const item = consolidatedSummary[i];
    if (i > 0 && i % swatchesPerRow === 0) {
      curX = margin;
      curY += swatchSlotH;
    }

    doc.fontSize(6.5).fillColor('#52525B').text(item.code, curX, curY, { width: swatchSlotW, align: 'center' });

    const iconX = curX + (swatchSlotW - beadIconW) / 2;
    const iconY = curY + 8;

    doc.roundedRect(iconX, iconY, beadIconW, beadIconH, 2)
      .lineWidth(0.5)
      .fillAndStroke(item.hex, '#A1A1AA');

    doc.circle(iconX + beadIconW / 2, iconY + 4, 1.8)
      .lineWidth(0.5)
      .fillAndStroke('#FFFFFF', '#A1A1AA');

    doc.fontSize(7).fillColor('#18181B').text(String(item.count), curX, iconY + beadIconH + 2, {
      width: swatchSlotW,
      align: 'center',
    });

    curX += swatchSlotW;
  }

  // Seção de Hastes Acrílicas de Sustentação (+)
  if (grid3D.rods && grid3D.rods.length > 0) {
    const rodDiameter = grid3D.rods[0].diameterMm || 2.0;
    const rodSectionY = curY + swatchSlotH + 8;
    doc.fontSize(9.5).fillColor('#18181B').text(
      `Hastes Acrílicas de Sustentação (+) — ${grid3D.rods.length} hastes de Ø ${rodDiameter}mm necessárias:`,
      margin,
      rodSectionY
    );
    const rodDetails = grid3D.rods
      .map((r) => `${r.id}: ${r.lengthMm}mm (Camadas ${r.startZ + 1} a ${r.endZ + 1})`)
      .join(' • ');
    doc.fontSize(7.5).fillColor('#52525B').text(rodDetails, margin, rodSectionY + 12, { width: pageW });
  }

  renderPDFFooter(doc, options, margin, pageW, pageH);

  // ─────────────────────────────────────────────────────────────
  // PÁGINAS 2 a N+1: BLUEPRINT DE CADA CAMADA (1 Página por Camada)
  // ─────────────────────────────────────────────────────────────
  for (let lIdx = 0; lIdx < grid3D.layers.length; lIdx++) {
    const layer = grid3D.layers[lIdx];
    doc.addPage();

    // Cabeçalho da Camada
    doc.fontSize(13).fillColor('#18181B').text(
      `Camada ${lIdx + 1} de ${grid3D.totalLayers} — ${layer.name || `Camada Z=${lIdx + 1}`}`,
      margin,
      margin,
      { width: pageW, align: 'left' }
    );

    doc.fontSize(8).fillColor('#71717A').text(
      `Altura: ${layer.heightMm} mm • ${layer.beadCount} beads nesta camada`,
      margin,
      margin + 16,
      { width: pageW, align: 'left' }
    );

    // Renderiza a grade desta camada
    const gridAreaW = pageW - 24;
    const gridAreaH = pageH - 110;

    const maxCellW = gridAreaW / layer.grid.width;
    const maxCellH = gridAreaH / layer.grid.height;
    const cellSize = Math.max(5, Math.min(16, Math.min(maxCellW, maxCellH)));

    const actualGridW = layer.grid.width * cellSize;
    const actualGridH = layer.grid.height * cellSize;
    const gridOriginX = margin + 18 + (gridAreaW - actualGridW) / 2;
    const gridOriginY = margin + 36;

    // Fundo do Grid
    doc.rect(gridOriginX, gridOriginY, actualGridW, actualGridH)
      .fillAndStroke('#FFFFFF', '#E4E4E7');

    // Células
    for (let r = 0; r < layer.grid.height; r++) {
      for (let c = 0; c < layer.grid.width; c++) {
        const cell = layer.grid.cells[r][c];
        const cellX = gridOriginX + c * cellSize;
        const cellY = gridOriginY + r * cellSize;

        if (!cell.isEmpty && cell.beadCode) {
          doc.rect(cellX, cellY, cellSize, cellSize).fill(cell.hex);

          if (cell.isRodHole) {
            // Marcador de Haste Acrílica (+) de Reforço Estrutural (Estilo Beads3D)
            const plusSize = Math.max(2.2, cellSize * 0.35);
            const midX = cellX + cellSize / 2;
            const midY = cellY + cellSize / 2;
            const plusColor = cell.textColor || '#000000';

            doc.moveTo(midX - plusSize, midY)
              .lineTo(midX + plusSize, midY)
              .lineWidth(1.2)
              .strokeColor(plusColor)
              .stroke();

            doc.moveTo(midX, midY - plusSize)
              .lineTo(midX, midY + plusSize)
              .lineWidth(1.2)
              .strokeColor(plusColor)
              .stroke();
          } else if (showCodes && cellSize >= 6.5) {
            const fontSize = Math.max(3.5, Math.floor(cellSize * 0.42));
            const textColor = cell.textColor || '#000000';
            doc.fontSize(fontSize).fillColor(textColor).text(
              cell.beadCode,
              cellX,
              cellY + (cellSize - fontSize) / 2 - 0.5,
              { width: cellSize, align: 'center' }
            );
          }
        }
      }
    }

    // Linhas de Grade
    for (let c = 0; c <= layer.grid.width; c++) {
      const x = gridOriginX + c * cellSize;
      const isThick = c % 5 === 0;
      doc.moveTo(x, gridOriginY)
        .lineTo(x, gridOriginY + actualGridH)
        .lineWidth(isThick ? 0.8 : 0.35)
        .strokeColor(isThick ? '#71717A' : '#E4E4E7')
        .stroke();
    }

    for (let r = 0; r <= layer.grid.height; r++) {
      const y = gridOriginY + r * cellSize;
      const isThick = r % 5 === 0;
      doc.moveTo(gridOriginX, y)
        .lineTo(gridOriginX + actualGridW, y)
        .lineWidth(isThick ? 0.8 : 0.35)
        .strokeColor(isThick ? '#71717A' : '#E4E4E7')
        .stroke();
    }

    // Réguas Numéricas nas Bordas
    doc.fontSize(5).fillColor('#71717A');
    for (let c = 0; c < layer.grid.width; c++) {
      if ((c + 1) % 5 === 0 || c === 0) {
        doc.text(String(c + 1), gridOriginX + c * cellSize, gridOriginY - 7, {
          width: cellSize,
          align: 'center',
        });
      }
    }

    for (let r = 0; r < layer.grid.height; r++) {
      if ((r + 1) % 5 === 0 || r === 0) {
        doc.text(String(r + 1), gridOriginX - 14, gridOriginY + r * cellSize + (cellSize - 5) / 2, {
          width: 12,
          align: 'right',
        });
      }
    }

    // Mini Lista de Cores Usadas Nesta Camada
    const layerColorMap = new Map<string, { code: string; name: string; hex: string; count: number }>();
    for (let r = 0; r < layer.grid.height; r++) {
      for (let c = 0; c < layer.grid.width; c++) {
        const cell = layer.grid.cells[r][c];
        if (cell.isEmpty || !cell.beadCode) continue;
        let entry = layerColorMap.get(cell.beadCode);
        if (!entry) {
          entry = { code: cell.beadCode, name: cell.beadName, hex: cell.hex, count: 0 };
          layerColorMap.set(cell.beadCode, entry);
        }
        entry.count++;
      }
    }

    const layerSummary = Array.from(layerColorMap.values()).sort((a, b) => b.count - a.count);
    const layerBOMStartY = gridOriginY + actualGridH + 10;

    doc.fontSize(8).fillColor('#18181B').text(
      `Cores desta camada (${layerSummary.length} cores):`,
      margin,
      layerBOMStartY
    );

    let lCurX = margin;
    let lCurY = layerBOMStartY + 10;
    for (let sIdx = 0; sIdx < layerSummary.length; sIdx++) {
      const sItem = layerSummary[sIdx];
      if (sIdx > 0 && sIdx % 12 === 0) {
        lCurX = margin;
        lCurY += 14;
      }

      doc.circle(lCurX + 4, lCurY + 4, 3.5).fillAndStroke(sItem.hex, '#A1A1AA');
      doc.fontSize(6.5).fillColor('#18181B').text(
        `${sItem.code}: ${sItem.count}`,
        lCurX + 10,
        lCurY + 1.5
      );

      lCurX += 38;
    }

    renderPDFFooter(doc, options, margin, pageW, pageH);
  }

  return doc;
}

