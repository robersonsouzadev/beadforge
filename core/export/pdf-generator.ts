// @ts-ignore
import PDFDocument from 'pdfkit/js/pdfkit.standalone.js';
import type { GridMatrix } from '../schemas/grid';
import type { BeadSummary } from '../schemas/project';

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

      // Marca d'água discreta de paridade para plano gratuito
      const isWatermarkActive = options.watermark || options.isPro === false;
      if (isWatermarkActive) {
        doc.fontSize(6.5).fillColor('#999999').text(
          'Criado gratuitamente com BeadForge Studio • app.hamabeadsbrasil.com.br',
          margin,
          pageH + margin - 8,
          { width: pageW, align: 'center' }
        );
      }
    }
  }

  return doc;
}
