'use client';

import React from 'react';
import { useEditorStore, ToolType } from '@/store/editor-store';
import {
  Paintbrush,
  PaintBucket,
  Pipette,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

export function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    selectedBead,
    zoom,
    setZoom,
    setPan,
    undo,
    redo,
    history,
    historyIndex,
  } = useEditorStore();

  const tools: { id: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { id: 'brush', label: 'Pincel', shortcut: 'B', icon: <Paintbrush className="w-3.5 h-3.5" /> },
    { id: 'bucket', label: 'Balde', shortcut: 'G', icon: <PaintBucket className="w-3.5 h-3.5" /> },
    { id: 'dropper', label: 'Conta-Gotas', shortcut: 'I', icon: <Pipette className="w-3.5 h-3.5" /> },
    { id: 'eraser', label: 'Borracha', shortcut: 'E', icon: <Eraser className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-11 bg-zinc-900 border-b border-zinc-800 px-2 sm:px-3 flex items-center justify-between text-zinc-300 select-none overflow-x-auto no-scrollbar gap-2 shrink-0">
      {/* Ferramentas de Desenho com Estilo Arcade Studio */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 shadow-inner shrink-0">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm ring-1 ring-amber-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 font-medium'
              }`}
            >
              {tool.icon}
              <span className="hidden md:inline text-[11px]">{tool.label}</span>
              <kbd className={`hidden sm:inline text-[9px] px-1 py-0.2 rounded font-mono ${
                isActive ? 'bg-zinc-950/80 text-amber-300 font-bold' : 'bg-zinc-900/60 text-zinc-500'
              }`}>
                {tool.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Cor Selecionada Atual */}
      {selectedBead && (
        <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-800/80 px-2 sm:px-2.5 py-1 rounded-lg border border-zinc-700/60 shadow-inner shrink-0">
          <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Cor:</span>
          <div
            className="w-3.5 h-3.5 rounded-sm border border-zinc-600 shadow-sm shrink-0"
            style={{ backgroundColor: selectedBead.hex }}
          />
          <span className="text-xs font-mono font-bold text-amber-400">
            {selectedBead.code}
          </span>
          <span className="text-[11px] text-zinc-300 hidden lg:inline truncate max-w-[130px]">
            {selectedBead.name}
          </span>
        </div>
      )}

      {/* Ações e Zoom */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Desfazer / Refazer */}
        <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 shadow-inner">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Desfazer (Ctrl+Z)"
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Refazer (Ctrl+Y)"
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 shadow-inner">
          <button
            onClick={() => setZoom(zoom * 0.85)}
            title="Diminuir Zoom"
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-medium px-1 sm:px-1.5 text-zinc-300 min-w-[38px] sm:min-w-[44px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom * 1.15)}
            title="Aumentar Zoom"
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            title="Ajustar à Tela (100%)"
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors border-l border-zinc-700 ml-0.5 pl-1.5"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
