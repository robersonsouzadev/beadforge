'use client';

import React, { useState } from 'react';
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
  X,
  FileText,
  Focus,
  Pin,
  Download,
  Loader2,
  HelpCircle,
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
    showAllLayers3D,
    setShowAllLayers3D,
    model3DFileName,
    closeDrawers,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'layers' | 'rods'>('layers');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleClose = onClose || closeDrawers;

  if (!grid3D) return null;

  const rods = grid3D.rods || [];

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const res = await fetch('/api/export/pdf-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grid3D,
          title: `Guia de Montagem 3D — ${model3DFileName || 'Escultura 3D'}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao gerar PDF.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guia-montagem-3d-camadas.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="w-full sm:w-80 min-w-0 sm:min-w-[320px] max-w-full bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden text-zinc-200 select-none shadow-2xl xl:shadow-none">
      {/* Header com Abas Estilo Beads3D (Camadas vs Hastes Acrílicas) */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 sticky top-0 z-20 backdrop-blur shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold tracking-wide uppercase text-zinc-100 font-sans">
              Painel de Montagem
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={addLayer3D}
              className="text-[11px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-lg flex items-center gap-1 hover:bg-amber-400/25 transition-colors font-bold"
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

        {/* Abas Alternadoras */}
        <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('layers')}
            className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'layers'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Camadas ({grid3D.layers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rods')}
            className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'rods'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Hastes ({rods.length})</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'layers' ? (
        <>
          {/* Scrubber Rápido de Navegação Vertical */}
          <div className="px-3.5 py-2 bg-zinc-950/40 border-b border-zinc-800 flex items-center justify-between text-xs shrink-0">
            <span className="text-zinc-400 text-[11px]">Navegar Z:</span>
            <div className="flex items-center gap-2 flex-1 max-w-[150px] mx-2">
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

          {/* Lista de Camadas */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-w-0">
            {[...grid3D.layers].reverse().map((layer) => {
              const isActive = layer.z === activeLayerZ;
              const isIsolated = !showAllLayers3D && isActive;

              return (
                <div
                  key={layer.z}
                  onClick={() => setActiveLayerZ(layer.z)}
                  className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer space-y-2 min-w-0 ${
                    isActive
                      ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                      : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Badge Z */}
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
                          <span className="font-semibold text-xs text-zinc-100 truncate">
                            {layer.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                          <span>{layer.heightMm}mm</span>
                          <span>•</span>
                          <span
                            className={
                              layer.beadCount > 0 ? 'text-amber-400 font-semibold' : 'text-zinc-500'
                            }
                          >
                            {layer.beadCount} beads
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações da Camada */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
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
                        title={layer.isLocked ? 'Destravar edição' : 'Travar camada'}
                      >
                        {layer.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      {/* Duplicar */}
                      <button
                        onClick={() => duplicateLayer3D(layer.z)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Duplicar camada"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
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

                  {/* Ações Rápidas de Foco e Blueprint (Estilo Beads3D) */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/60 text-[10px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLayerZ(layer.z);
                        setShowAllLayers3D(isIsolated);
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition ${
                        isIsolated
                          ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                      title="Isolar esta camada no 3D com as outras em modo raio-x fantasma"
                    >
                      <Focus className="w-3 h-3" />
                      <span>{isIsolated ? 'Isolada (Ghost On)' : 'Isolar no 3D'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Aba de Hastes Acrílicas (Support Rods) */
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span className="leading-relaxed">
              As hastes acrílicas passam através dos furos de reforço alinhados para travar a escultura 3D com rigidez física.
            </span>
          </div>

          {rods.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Nenhuma haste necessária para este número de camadas.
            </div>
          ) : (
            rods.map((rod, idx) => (
              <div
                key={rod.id}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-bold text-xs">
                    R{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <span>Haste Acrílica {rod.diameterMm}mm</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Camadas Z{rod.startZ + 1} ➔ Z{rod.endZ + 1} ({rod.lengthLayers} camadas)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 text-xs block">
                    {rod.lengthMm} mm
                  </span>
                  <span className="text-[10px] text-zinc-500">comprimento</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer com Botão de Download PDF Blueprint (Estilo Beads3D) */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 sticky bottom-0 z-20 backdrop-blur shrink-0">
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isExportingPDF}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-[0.99]"
        >
          {isExportingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Baixar Guia 3D (PDF Blueprint)</span>
        </button>
      </div>
    </div>
  );
}
