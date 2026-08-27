'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GridMatrix, GridCell } from '@/core/schemas/grid';
import { ZoomIn, ZoomOut, RotateCcw, Eye } from 'lucide-react';

interface LayerCanvas2DProps {
  grid: GridMatrix;
  highlightBeadCode?: string | null;
  viewMode?: 'pattern' | 'assembly';
  onCellClick?: (row: number, col: number) => void;
  className?: string;
}

export function LayerCanvas2D({
  grid,
  highlightBeadCode = null,
  viewMode = 'pattern',
  onCellClick,
  className = '',
}: LayerCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; cell: GridCell } | null>(null);

  const baseCellSize = 24;

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

    // Fundo cinza escuro profissional
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const currentCellSize = baseCellSize * zoom;
    const gridPixelW = grid.width * currentCellSize;
    const gridPixelH = grid.height * currentCellSize;

    const originX = (rect.width - gridPixelW) / 2 + pan.x;
    const originY = (rect.height - gridPixelH) / 2 + pan.y;

    // Fundo branco da base pegboard
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
              ctx.fillStyle = isHighlighted ? cell.textColor : 'rgba(100,100,100,0.3)';
              ctx.fillText(
                cell.beadCode,
                cellX + currentCellSize / 2,
                cellY + currentCellSize / 2
              );
            }
          }

          ctx.globalAlpha = 1.0;

          // Anel de destaque
          if (highlightBeadCode && cell.beadCode === highlightBeadCode) {
            ctx.strokeStyle = '#06B6D4';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(cellX + 0.5, cellY + 0.5, currentCellSize - 1, currentCellSize - 1);
          }
        }

        // Borda fina
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

    // 4. Borda externa
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((z) => Math.max(0.3, Math.min(4.0, z * factor)));
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-zinc-950 overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Controles de Zoom Flutuantes */}
      <div className="absolute bottom-3 right-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-1 flex items-center gap-1 shadow-xl z-10">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.3, z * 0.85))}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-[10px] font-mono text-amber-400 w-10 text-center font-bold">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(4.0, z * 1.15))}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3 bg-zinc-800 my-0.5" />

        <button
          type="button"
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Resetar Enquadramento"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
