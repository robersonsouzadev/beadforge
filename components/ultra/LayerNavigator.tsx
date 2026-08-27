'use client';

import React from 'react';
import { useEditorStore } from '@/store/editor-store';
import {
  Layers,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';

interface LayerNavigatorProps {
  onClose?: () => void;
  isDrawer?: boolean;
}

export function LayerNavigator({ onClose, isDrawer = false }: LayerNavigatorProps) {
  const {
    grid3D,
    activeLayerZ,
    setActiveLayerZ,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayer3D,
    duplicateLayer3D,
    deleteLayer3D,
    closeDrawers,
  } = useEditorStore();

  const handleClose = onClose || closeDrawers;

  if (!grid3D) return null;

  return (
    <div className="w-full sm:w-80 min-w-0 sm:min-w-[320px] max-w-full bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden text-zinc-200 select-none shadow-2xl xl:shadow-none">
      {/* Header do Navegador de Camadas */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 sticky top-0 z-20 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold tracking-wide uppercase text-zinc-100 font-sans">
            Camadas 3D ({grid3D.layers.length})
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={addLayer3D}
            className="text-[11px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-400/25 transition-colors font-bold"
            title="Adicionar nova camada no topo"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova</span>
          </button>

          {isDrawer && (
            <button
              onClick={handleClose}
              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrubber Rápido de Camadas */}
      <div className="px-3.5 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between text-xs">
        <span className="text-zinc-400 text-[11px]">Navegar Z:</span>
        <div className="flex items-center gap-2 flex-1 max-w-[160px] mx-2">
          <input
            type="range"
            min="0"
            max={Math.max(0, grid3D.layers.length - 1)}
            value={activeLayerZ}
            onChange={(e) => setActiveLayerZ(Number(e.target.value))}
            className="w-full accent-amber-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
        <span className="font-mono font-bold text-amber-400 text-xs">
          {activeLayerZ + 1} / {grid3D.layers.length}
        </span>
      </div>

      {/* Lista Vertical de Camadas (do topo para a base) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-w-0">
        {[...grid3D.layers].reverse().map((layer) => {
          const isActive = layer.z === activeLayerZ;

          return (
            <div
              key={layer.z}
              onClick={() => setActiveLayerZ(layer.z)}
              className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 min-w-0 ${
                isActive
                  ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                  : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Badge do índice da camada */}
                <div
                  className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-amber-400 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  Z{layer.z + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-xs text-zinc-100 truncate">
                      {layer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                    <span>{layer.heightMm}mm</span>
                    <span>•</span>
                    <span className={layer.beadCount > 0 ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
                      {layer.beadCount} beads
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações da Camada */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Visibilidade */}
                <button
                  onClick={() => toggleLayerVisibility(layer.z)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    layer.isVisible
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-zinc-600 hover:text-zinc-400 bg-zinc-900'
                  }`}
                  title={layer.isVisible ? 'Ocultar camada' : 'Exibir camada'}
                >
                  {layer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Trava */}
                <button
                  onClick={() => toggleLayerLock(layer.z)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    layer.isLocked
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={layer.isLocked ? 'Destravar edição' : 'Travar camada contra edições'}
                >
                  {layer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                {/* Duplicar */}
                <button
                  onClick={() => duplicateLayer3D(layer.z)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Duplicar esta camada"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Excluir (se houver mais de 1) */}
                {grid3D.layers.length > 1 && (
                  <button
                    onClick={() => deleteLayer3D(layer.z)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Excluir camada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
