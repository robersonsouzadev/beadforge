'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GridMatrix, GridCell } from '@/core/schemas/grid';
import type { BeadColor } from '@/core/schemas/palette';
import { useEditorStore } from '@/store/editor-store';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface LayerCanvas2DProps {
  grid: GridMatrix;
  highlightBeadCode?: string | null;
  viewMode?: 'pattern' | 'assembly';
  className?: string;
}

export function LayerCanvas2D({
  grid,
  highlightBeadCode = null,
  viewMode = 'pattern',
  className = '',
}: LayerCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    activeTool,
    selectedBead,
    setSelectedBead,
    activePalette,
    paintCell,
    eraseCellAt,
    bucketFillAt,
  } = useEditorStore();

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPainting, setIsPainting] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; cell: GridCell } | null>(null);

  const baseCellSize = 22;

  // Ajuste automático da camada para ocupar a tela inteira
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container || !grid) return;
    const padding = 16;
    const availableW = Math.max(100, container.clientWidth - padding);
    const availableH = Math.max(100, container.clientHeight - padding);
    const gridPixelW = grid.width * baseCellSize;
    const gridPixelH = grid.height * baseCellSize;

    const scaleX = availableW / gridPixelW;
    const scaleY = availableH / gridPixelH;
    const optimalZoom = Math.min(scaleX, scaleY);
    const clampedZoom = Math.max(0.05, Math.min(optimalZoom, 2.5));

    setZoom(Number(clampedZoom.toFixed(2)));
    setPan({ x: 0, y: 0 });
  }, [grid]);

  // Auto-fit ao carregar nova grade/camada
  const lastGridRef = useRef<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (grid) {
      if (!lastGridRef.current || lastGridRef.current.w !== grid.width || lastGridRef.current.h !== grid.height) {
        lastGridRef.current = { w: grid.width, h: grid.height };
        setTimeout(() => fitToScreen(), 50);
      }
    }
  }, [grid, fitToScreen]);

  // Listener de Teclado (Espaço para Mãozinha + Atalhos)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      if (e.key === 'b' || e.key === 'B') useEditorStore.getState().setActiveTool('brush');
      if (e.key === 'e' || e.key === 'E') useEditorStore.getState().setActiveTool('eraser');
      if (e.key === 'g' || e.key === 'G') useEditorStore.getState().setActiveTool('bucket');
      if (e.key === 'i' || e.key === 'I') useEditorStore.getState().setActiveTool('dropper');
      if (e.key === 'z' || e.key === 'Z') fitToScreen();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fitToScreen]);

  // Renderização da Grade da Camada
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Fundo escuro Graphite Pro
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const currentCellSize = baseCellSize * zoom;
    const gridPixelW = grid.width * currentCellSize;
    const gridPixelH = grid.height * currentCellSize;

    const originX = (rect.width - gridPixelW) / 2 + pan.x;
    const originY = (rect.height - gridPixelH) / 2 + pan.y;

    // Fundo branco da prancha
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(originX, originY, gridPixelW, gridPixelH);

    // 1. Renderizar Células
    for (let r = 0; r < grid.height; r++) {
      for (let c = 0; c < grid.width; c++) {
        const cell = grid.cells[r][c];
        const cellX = originX + c * currentCellSize;
        const cellY = originY + r * currentCellSize;

        if (
          cellX + currentCellSize < 0 ||
          cellX > rect.width ||
          cellY + currentCellSize < 0 ||
          cellY > rect.height
        ) {
          continue;
        }

        const isHighlighted =
          !highlightBeadCode || (cell.beadCode === highlightBeadCode && !cell.isEmpty);

        if (cell.isEmpty) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(cellX, cellY, currentCellSize, currentCellSize);
        } else {
          ctx.fillStyle = cell.hex;
          ctx.globalAlpha = isHighlighted ? 1.0 : 0.15;
          ctx.fillRect(cellX, cellY, currentCellSize, currentCellSize);

          if (viewMode === 'assembly') {
            // Efeito 3D de bead cilíndrico
            if (currentCellSize >= 8) {
              const radius = currentCellSize * 0.22;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
              ctx.beginPath();
              ctx.arc(
                cellX + currentCellSize / 2,
                cellY + currentCellSize / 2,
                radius,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          } else {
            // Modo Molde: Código da cor com contraste
            if (currentCellSize >= 11 && cell.beadCode) {
              const fontSize = Math.max(8, Math.floor(currentCellSize * 0.38));
              ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = isHighlighted ? (cell.textColor || '#000000') : 'rgba(100,100,100,0.3)';
              ctx.fillText(
                cell.beadCode,
                cellX + currentCellSize / 2,
                cellY + currentCellSize / 2
              );
            }
          }

          ctx.globalAlpha = 1.0;

          // Anel de destaque de cor focada
          if (highlightBeadCode && cell.beadCode === highlightBeadCode) {
            ctx.strokeStyle = '#06B6D4';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(cellX + 0.5, cellY + 0.5, currentCellSize - 1, currentCellSize - 1);
          }
        }

        // Borda fina da célula
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cellX, cellY, currentCellSize, currentCellSize);
      }
    }

    // 2. Linhas de Sub-grade a cada 5 pinos
    ctx.strokeStyle = '#52525B';
    ctx.lineWidth = 1.2;

    for (let c = 0; c <= grid.width; c += 5) {
      const x = originX + c * currentCellSize;
      ctx.beginPath();
      ctx.moveTo(x, originY);
      ctx.lineTo(x, originY + gridPixelH);
      ctx.stroke();
    }

    for (let r = 0; r <= grid.height; r += 5) {
      const y = originY + r * currentCellSize;
      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(originX + gridPixelW, y);
      ctx.stroke();
    }

    // 3. Réguas e Numeração de Linhas e Colunas
    if (currentCellSize >= 12) {
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      for (let c = 0; c < grid.width; c += (currentCellSize >= 20 ? 1 : 5)) {
        const cx = originX + c * currentCellSize + currentCellSize / 2;
        if (cx > 0 && cx < rect.width) {
          ctx.fillText(String(c + 1), cx, originY - 4);
        }
      }

      ctx.textAlign = 'right';
      for (let r = 0; r < grid.height; r += (currentCellSize >= 20 ? 1 : 5)) {
        const ry = originY + r * currentCellSize + currentCellSize / 2 + 3;
        if (ry > 0 && ry < rect.height) {
          ctx.fillText(String(r + 1), originX - 4, ry);
        }
      }
    }

    // 4. Borda externa amarela
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    ctx.strokeRect(originX, originY, gridPixelW, gridPixelH);
  }, [grid, zoom, pan, highlightBeadCode, viewMode]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  const getCellFromMouse = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return null;
    const rect = canvas.getBoundingClientRect();
    const currentCellSize = baseCellSize * zoom;
    const gridPixelW = grid.width * currentCellSize;
    const gridPixelH = grid.height * currentCellSize;

    const originX = (rect.width - gridPixelW) / 2 + pan.x;
    const originY = (rect.height - gridPixelH) / 2 + pan.y;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const col = Math.floor((mouseX - originX) / currentCellSize);
    const row = Math.floor((mouseY - originY) / currentCellSize);

    if (row >= 0 && row < grid.height && col >= 0 && col < grid.width) {
      return { row, col, cell: grid.cells[row][col] };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Mãozinha (Pan): Espaço segurado, botão do meio (1) ou Alt
    if (isSpacePressed || e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    const cellInfo = getCellFromMouse(e.clientX, e.clientY);
    if (!cellInfo) return;

    if (activeTool === 'brush') {
      paintCell(cellInfo.row, cellInfo.col);
      setIsPainting(true);
    } else if (activeTool === 'eraser') {
      eraseCellAt(cellInfo.row, cellInfo.col);
      setIsPainting(true);
    } else if (activeTool === 'bucket') {
      bucketFillAt(cellInfo.row, cellInfo.col);
    } else if (activeTool === 'dropper') {
      if (!cellInfo.cell.isEmpty) {
        const found = activePalette.find((b: BeadColor) => b.code === cellInfo.cell.beadCode);
        if (found) setSelectedBead(found);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    const cellInfo = getCellFromMouse(e.clientX, e.clientY);
    setHoveredCell(cellInfo);

    if (isPainting && cellInfo) {
      if (activeTool === 'brush') {
        paintCell(cellInfo.row, cellInfo.col);
      } else if (activeTool === 'eraser') {
        eraseCellAt(cellInfo.row, cellInfo.col);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPainting(false);
  };

  // Zoom In / Out com o mouse convergindo na ponta do cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.05, Math.min(zoom * zoomFactor, 4.0));

    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const scaleChange = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scaleChange;
    const newPanY = mouseY - (mouseY - pan.y) * scaleChange;

    setZoom(Number(newZoom.toFixed(3)));
    setPan({ x: newPanX, y: newPanY });
  };

  const getCursorStyle = () => {
    if (isDragging) return 'cursor-grabbing';
    if (isSpacePressed) return 'cursor-grab';
    if (activeTool === 'brush') return 'cursor-crosshair';
    if (activeTool === 'eraser') return 'cursor-cell';
    if (activeTool === 'dropper') return 'cursor-copy';
    if (activeTool === 'bucket') return 'cursor-crosshair';
    return 'cursor-crosshair';
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-zinc-950 overflow-hidden select-none touch-none ${getCursorStyle()} ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredCell(null);
        }}
        onWheel={handleWheel}
      />

      {/* Badge de informações da célula em hover */}
      {hoveredCell && (
        <div className="absolute bottom-4 left-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs flex items-center gap-2 sm:gap-3 text-zinc-200 shadow-2xl pointer-events-none ring-1 ring-white/5 animate-scale-in max-w-[90%] truncate z-20">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-zinc-400 hidden sm:inline">Posição:</span>
            <span className="font-semibold text-zinc-100">
              L{hoveredCell.row + 1}, C{hoveredCell.col + 1}
            </span>
          </div>

          {!hoveredCell.cell.isEmpty ? (
            <>
              <div
                className="w-3.5 h-3.5 rounded-sm border border-zinc-600 shadow-sm shrink-0"
                style={{ backgroundColor: hoveredCell.cell.hex }}
              />
              <div className="flex items-center gap-1 truncate text-[11px]">
                <span className="font-mono font-bold text-amber-400">
                  [{hoveredCell.cell.beadCode}]
                </span>
                <span className="text-zinc-300 font-medium truncate">{hoveredCell.cell.beadName}</span>
              </div>
            </>
          ) : (
            <span className="text-zinc-500 text-[11px] italic">Vazio</span>
          )}
        </div>
      )}

      {/* Controles de Zoom & Auto-Fit Flutuantes */}
      <div className="absolute bottom-4 right-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-1 flex items-center gap-1 shadow-2xl z-20">
        <button
          type="button"
          onClick={() => setZoom((z) => Number(Math.max(0.05, z * 0.85).toFixed(3)))}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] font-mono text-amber-400 w-12 text-center font-bold">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Number(Math.min(4.0, z * 1.15).toFixed(3)))}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={fitToScreen}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
          title="Auto-Ajustar à Tela (Z)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
