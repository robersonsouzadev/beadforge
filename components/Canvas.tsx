'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { BeadColor } from '@/core/schemas/palette';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    grid,
    zoom,
    pan,
    setZoom,
    setPan,
    activeTool,
    paintCell,
    eraseCellAt,
    bucketFillAt,
    setSelectedBead,
    activePalette,
    setHoveredCell,
    hoveredCell,
    highlightBeadCode,
    viewMode,
    showPlateDivisions,
    showGridNumbers,
    multiBoardConfig,
  } = useEditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPainting, setIsPainting] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Multi-touch pinch zoom state
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    lastTouch: { x: number; y: number };
  }>({
    initialDist: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    lastTouch: { x: 0, y: 0 },
  });

  // Tamanho base de cada célula no Canvas (em pixels na escala 1.0)
  const baseCellSize = 22;

  // Ajuste automático da prancha para preencher a tela inteira (Auto-Fit)
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container || !grid) return;
    const padding = 16; // Margem mínima (8px em cada lado) para máximo aproveitamento da tela
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
  }, [grid, setZoom, setPan]);

  const lastGridDimRef = useRef<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (grid) {
      if (!lastGridDimRef.current || lastGridDimRef.current.w !== grid.width || lastGridDimRef.current.h !== grid.height) {
        lastGridDimRef.current = { w: grid.width, h: grid.height };
        setTimeout(() => fitToScreen(), 60);
      }
    }
  }, [grid, fitToScreen]);

  // Listener Global de Teclado: Barra de Espaço (Mãozinha/Pan) e Atalhos de Ferramentas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      // Atalhos de Ferramentas
      if (e.key === 'b' || e.key === 'B') useEditorStore.getState().setActiveTool('brush');
      if (e.key === 'e' || e.key === 'E') useEditorStore.getState().setActiveTool('eraser');
      if (e.key === 'g' || e.key === 'G') useEditorStore.getState().setActiveTool('bucket');
      if (e.key === 'i' || e.key === 'I') useEditorStore.getState().setActiveTool('dropper');
      if (e.key === 'f' || e.key === 'F') useEditorStore.getState().toggleZenMode();
      if (e.key === 'z' || e.key === 'Z') fitToScreen();

      // Desfazer / Refazer
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
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

  // Renderização da Grade no Canvas com Estilo Graphite
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Fundo do viewport: Zinc 950 Charcoal Profissional
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (!grid || !grid.cells.length) {
      ctx.fillStyle = '#71717A';
      ctx.font = '500 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Carregue uma imagem no painel de configurações para gerar o molde.',
        rect.width / 2,
        rect.height / 2
      );
      return;
    }

    const currentCellSize = baseCellSize * zoom;
    const gridPixelW = grid.width * currentCellSize;
    const gridPixelH = grid.height * currentCellSize;

    // Posição centralizada da grade considerando pan
    const originX = (rect.width - gridPixelW) / 2 + pan.x;
    const originY = (rect.height - gridPixelH) / 2 + pan.y;

    // Fundo da prancha de beads (base branca da pegboard)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(originX, originY, gridPixelW, gridPixelH);

    const platePinW = multiBoardConfig.pinsHorizontalPerBoard || 57;
    const platePinH = multiBoardConfig.pinsVerticalPerBoard || 57;

    // 1. Renderiza células individuais
    for (let r = 0; r < grid.height; r++) {
      for (let c = 0; c < grid.width; c++) {
        const cell = grid.cells[r][c];
        const cellX = originX + c * currentCellSize;
        const cellY = originY + r * currentCellSize;

        // Skip render se estiver fora do viewport visível
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
          ctx.globalAlpha = isHighlighted ? 1.0 : 0.18;
          ctx.fillRect(cellX, cellY, currentCellSize, currentCellSize);

          if (viewMode === 'assembly') {
            // MODO MONTAGEM / PIXEL ART: Renderiza bead cilíndrico com furo central 3D
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

              // Brilho sutil no anel do bead
              if (currentCellSize >= 14) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 0.8;
                ctx.stroke();
              }
            }
          } else {
            // MODO MOLDE / IMPRESSÃO: Renderiza código alfanumérico com contraste WCAG
            if (currentCellSize >= 5.5 && cell.beadCode) {
              const fontSize = Math.max(5, Math.floor(currentCellSize * 0.44));
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

          // Anel de destaque se for a cor em foco
          if (highlightBeadCode && cell.beadCode === highlightBeadCode) {
            ctx.strokeStyle = '#06B6D4'; // Cyan 500 vivo
            ctx.lineWidth = 2.5;
            ctx.strokeRect(cellX + 0.5, cellY + 0.5, currentCellSize - 1, currentCellSize - 1);
          }
        }

        // Linha fina de grade
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cellX, cellY, currentCellSize, currentCellSize);
      }
    }

    // 2. Linhas de Sub-grade (a cada 5 pinos)
    ctx.strokeStyle = '#52525B'; // Zinc 600
    ctx.lineWidth = 1.2;

    for (let c = 0; c <= grid.width; c++) {
      if (c % 5 === 0 && c !== grid.width && (c % platePinW !== 0 || !showPlateDivisions)) {
        const x = originX + c * currentCellSize;
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, originY + gridPixelH);
        ctx.stroke();
      }
    }

    for (let r = 0; r <= grid.height; r++) {
      if (r % 5 === 0 && r !== grid.height && (r % platePinH !== 0 || !showPlateDivisions)) {
        const y = originY + r * currentCellSize;
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(originX + gridPixelW, y);
        ctx.stroke();
      }
    }

    // 3. DIVISÃO DAS PLACAS FÍSICAS (Linhas ambar destacadas)
    if (showPlateDivisions && (multiBoardConfig.boardsHorizontal > 1 || multiBoardConfig.boardsVertical > 1)) {
      ctx.strokeStyle = '#F59E0B'; // Amber 500
      ctx.lineWidth = 3;

      // Divisões verticais de placas
      for (let bx = 1; bx < multiBoardConfig.boardsHorizontal; bx++) {
        const px = originX + bx * platePinW * currentCellSize;
        ctx.beginPath();
        ctx.moveTo(px, originY);
        ctx.lineTo(px, originY + gridPixelH);
        ctx.stroke();
      }

      // Divisões horizontais de placas
      for (let by = 1; by < multiBoardConfig.boardsVertical; by++) {
        const py = originY + by * platePinH * currentCellSize;
        ctx.beginPath();
        ctx.moveTo(originX, py);
        ctx.lineTo(originX + gridPixelW, py);
        ctx.stroke();
      }

      // Etiquetas das placas físicas
      for (let by = 0; by < multiBoardConfig.boardsVertical; by++) {
        for (let bx = 0; bx < multiBoardConfig.boardsHorizontal; bx++) {
          const tagX = originX + bx * platePinW * currentCellSize + 6;
          const tagY = originY + by * platePinH * currentCellSize + 14;
          if (tagX > 0 && tagX < rect.width && tagY > 0 && tagY < rect.height) {
            ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
            ctx.fillRect(tagX - 3, tagY - 11, 68, 16);
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(tagX - 3, tagY - 11, 68, 16);
            ctx.fillStyle = '#F59E0B';
            ctx.font = '600 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Placa ${bx + 1}-${by + 1}`, tagX, tagY);
          }
        }
      }
    }

    // 4. Borda externa total
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(originX, originY, gridPixelW, gridPixelH);

    // 5. Réguas e Numeração de Linhas/Colunas
    if (showGridNumbers && currentCellSize >= 5) {
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      // Numeração de colunas no topo
      for (let c = 0; c < grid.width; c += (currentCellSize >= 15 ? 1 : 5)) {
        const cx = originX + c * currentCellSize + currentCellSize / 2;
        if (cx > 0 && cx < rect.width) {
          ctx.fillText(String(c + 1), cx, originY - 4);
        }
      }

      // Numeração de linhas na esquerda
      ctx.textAlign = 'right';
      for (let r = 0; r < grid.height; r += (currentCellSize >= 15 ? 1 : 5)) {
        const ry = originY + r * currentCellSize + currentCellSize / 2 + 3;
        if (ry > 0 && ry < rect.height) {
          ctx.fillText(String(r + 1), originX - 4, ry);
        }
      }
    }

    // 6. Indicador de célula em foco (hover ring arcade yellow)
    if (hoveredCell && hoveredCell.row < grid.height && hoveredCell.col < grid.width) {
      const hx = originX + hoveredCell.col * currentCellSize;
      const hy = originY + hoveredCell.row * currentCellSize;
      ctx.strokeStyle = '#FACC15'; // Arcade Yellow 400
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hx, hy, currentCellSize, currentCellSize);
    }
  }, [
    grid,
    zoom,
    pan,
    hoveredCell,
    highlightBeadCode,
    viewMode,
    showPlateDivisions,
    showGridNumbers,
    multiBoardConfig,
  ]);

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
    // Mãozinha (Pan / Mover prancha): Barra de Espaço segurada, Botão do Meio do mouse (Scroll click), ou Tecla Alt
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

  // Zoom In e Out com o Scroll do Mouse convergindo na ponta do cursor (Estilo Photoshop/Figma)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.05, Math.min(zoom * zoomFactor, 4.0));

    // Posição do mouse relativa ao centro da prancha
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    // Converte o pan para manter o ponto sob o mouse exatamente no mesmo lugar
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

  // --- Suporte a Gestos de Toque no Mobile/Tablet (Pinch-to-Zoom e Pintura) ---
  const getTouchDist = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch to zoom início com 2 dedos
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      touchStateRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialPan: { ...pan },
        lastTouch: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        },
      };
      setIsPainting(false);
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // 1 dedo: pintura ou interação com célula
      const touch = e.touches[0];
      const cellInfo = getCellFromMouse(touch.clientX, touch.clientY);
      touchStateRef.current.lastTouch = { x: touch.clientX, y: touch.clientY };

      if (cellInfo) {
        setHoveredCell(cellInfo);
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
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom e Pan com 2 dedos
      e.preventDefault();
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const { initialDist, initialZoom } = touchStateRef.current;
      if (initialDist > 0) {
        const scaleFactor = dist / initialDist;
        setZoom(Math.max(0.2, Math.min(5.0, initialZoom * scaleFactor)));
      }
    } else if (e.touches.length === 1 && isPainting) {
      // Arrasto com 1 dedo pintando
      const touch = e.touches[0];
      const cellInfo = getCellFromMouse(touch.clientX, touch.clientY);
      if (cellInfo) {
        setHoveredCell(cellInfo);
        if (activeTool === 'brush') {
          paintCell(cellInfo.row, cellInfo.col);
        } else if (activeTool === 'eraser') {
          eraseCellAt(cellInfo.row, cellInfo.col);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setIsPainting(false);
    setIsDragging(false);
    touchStateRef.current.initialDist = 0;
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full w-full overflow-hidden bg-zinc-950 select-none touch-none ${getCursorStyle()}`}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {/* Badge de informações da célula em hover com Estilo Graphite Pro */}
      {hoveredCell && (
        <div className="absolute bottom-4 left-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs flex items-center gap-2 sm:gap-3 text-zinc-200 shadow-2xl pointer-events-none ring-1 ring-white/5 animate-scale-in max-w-[90%] truncate">
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
            <span className="text-zinc-500 italic text-[11px]">Vazio</span>
          )}
        </div>
      )}

      {/* Controles Flutuantes de Enquadramento e Tela Cheia (Fundo Direito) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1 rounded-xl shadow-2xl z-30">
        <button
          type="button"
          onClick={() => setZoom(zoom * 0.85)}
          title="Diminuir Zoom (-)"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <span className="text-xs font-mono font-bold text-zinc-300 px-1 min-w-[42px] text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom(zoom * 1.15)}
          title="Aumentar Zoom (+)"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <div className="w-px h-4 bg-zinc-800 mx-0.5" />

        <button
          type="button"
          onClick={fitToScreen}
          title="Ajustar Prancha à Tela Inteira (Auto-Fit)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs transition shadow-sm"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
    </div>
  );
}
