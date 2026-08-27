'use client';

import React, { useState } from 'react';
import { useEditorStore, ToolType } from '@/store/editor-store';
import {
  SlidersHorizontal,
  Layers,
  Sparkles,
  FileText,
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

export function MobileBottomNav() {
  const {
    isLeftDrawerOpen,
    isRightDrawerOpen,
    toggleLeftDrawer,
    toggleRightDrawer,
    viewMode,
    setViewMode,
    activeTool,
    setActiveTool,
    undo,
    redo,
    history,
    historyIndex,
    zoom,
    setZoom,
    setPan,
    selectedBead,
  } = useEditorStore();

  const [showToolsDrawer, setShowToolsDrawer] = useState(false);

  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'brush', label: 'Pincel', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'bucket', label: 'Balde', icon: <PaintBucket className="w-4 h-4" /> },
    { id: 'dropper', label: 'Conta-Gotas', icon: <Pipette className="w-4 h-4" /> },
    { id: 'eraser', label: 'Borracha', icon: <Eraser className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Floating Tools Popup when "Ferramentas" is tapped */}
      {showToolsDrawer && (
        <div className="xl:hidden fixed bottom-16 left-3 right-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-2xl p-3 z-40 animate-scale-in space-y-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>Ferramentas de Desenho</span>
            </span>
            {selectedBead && (
              <div className="flex items-center gap-1.5 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                <div
                  className="w-3 h-3 rounded-sm border border-zinc-600"
                  style={{ backgroundColor: selectedBead.hex }}
                />
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {selectedBead.code}
                </span>
              </div>
            )}
          </div>

          {/* Grid de Ferramentas */}
          <div className="grid grid-cols-4 gap-1.5">
            {tools.map((t) => {
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id);
                    setShowToolsDrawer(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                      : 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {t.icon}
                  <span className="text-[10px] mt-1">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ações de Zoom e Desfazer */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 flex items-center gap-1 text-[11px]"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Desfazer</span>
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 flex items-center gap-1 text-[11px]"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Refazer</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(zoom * 0.85)}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] px-1 text-zinc-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(zoom * 1.15)}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoom(1.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-300"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Dock */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 h-14 flex items-center justify-around px-2 select-none">
        {/* 1. Botão Configuração (Sidebar) */}
        <button
          type="button"
          onClick={toggleLeftDrawer}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
            isLeftDrawerOpen
              ? 'text-amber-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Configurar</span>
        </button>

        {/* 2. Botão Ferramentas (Toolbar Floating Drawer) */}
        <button
          type="button"
          onClick={() => setShowToolsDrawer(!showToolsDrawer)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
            showToolsDrawer
              ? 'text-amber-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 capitalize">{activeTool}</span>
        </button>

        {/* 3. Botão Resumo de Cores (ColorSummaryPanel) */}
        <button
          type="button"
          onClick={toggleRightDrawer}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
            isRightDrawerOpen
              ? 'text-amber-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Cores</span>
        </button>

        {/* 4. Botão Alternar Modo (Molde vs Arte) */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'pattern' ? 'assembly' : 'pattern')}
          className="flex flex-col items-center justify-center flex-1 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {viewMode === 'pattern' ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] mt-0.5 text-zinc-300">Ver Arte</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] mt-0.5 text-zinc-300">Ver Molde</span>
            </>
          )}
        </button>
      </nav>
    </>
  );
}
