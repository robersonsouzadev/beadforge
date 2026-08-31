'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { LayerCanvas2D } from './LayerCanvas2D';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  X,
  Sparkles,
  Flame,
  LayoutGrid,
  Eye,
  EyeOff,
  FileDown,
  Loader2,
} from 'lucide-react';

export function AssemblyGuide() {
  const {
    grid3D,
    activeLayerZ,
    setActiveLayerZ,
    isAssemblyGuideOpen,
    setIsAssemblyGuideOpen,
    highlightBeadCode,
    setHighlightBeadCode,
    model3DFileName,
  } = useEditorStore();

  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({});
  const [guideViewMode, setGuideViewMode] = useState<'pattern' | 'assembly'>('pattern');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExport3DPDF = async () => {
    if (!grid3D) return;
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

  if (!isAssemblyGuideOpen || !grid3D) return null;

  const currentLayer = grid3D.layers[activeLayerZ] || grid3D.layers[0];

  // Contagem de cores na camada atual
  const colorCountsMap = new Map<string, { code: string; name: string; hex: string; count: number }>();
  if (currentLayer) {
    for (let r = 0; r < currentLayer.grid.height; r++) {
      for (let c = 0; c < currentLayer.grid.width; c++) {
        const cell = currentLayer.grid.cells[r][c];
        if (cell.isEmpty || !cell.beadCode) continue;

        let entry = colorCountsMap.get(cell.beadCode);
        if (!entry) {
          entry = { code: cell.beadCode, name: cell.beadName, hex: cell.hex, count: 0 };
          colorCountsMap.set(cell.beadCode, entry);
        }
        entry.count++;
      }
    }
  }

  const layerColors = Array.from(colorCountsMap.values()).sort((a, b) => b.count - a.count);

  const toggleStep = (stepKey: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  };

  const progressPercent = Math.round(((activeLayerZ + 1) / Math.max(1, grid3D.layers.length)) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Header do Guia */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 font-mono font-bold flex items-center justify-center text-sm shadow-md">
              Z{activeLayerZ + 1}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 font-sans flex items-center gap-2">
                <span>Guia de Montagem — {currentLayer.name}</span>
                <span className="text-[10px] font-mono bg-amber-400/15 text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded">
                  {currentLayer.beadCount} peças nesta camada
                </span>
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                Altura acumulada: <strong>{currentLayer.heightMm} mm</strong> • Camada {activeLayerZ + 1} de {grid3D.layers.length}
              </span>
            </div>
          </div>

          {/* Seletor de Modo de Exibição do Molde (Códigos vs Cores) e Fechar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setGuideViewMode('pattern')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  guideViewMode === 'pattern'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Códigos</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideViewMode('assembly')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  guideViewMode === 'assembly'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Pixel Art</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleExport3DPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Baixar PDF 3D</span>
            </button>

            <button
              onClick={() => {
                setHighlightBeadCode(null);
                setIsAssemblyGuideOpen(false);
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="px-4 py-2 bg-zinc-950/40 border-b border-zinc-800 flex items-center justify-between text-xs font-mono shrink-0">
          <span className="text-zinc-400">Progresso da Escultura:</span>
          <div className="flex-1 mx-3 bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-bold text-amber-400">{progressPercent}%</span>
        </div>

        {/* Corpo Principal: Divisão 2 Colunas (Molde 2D à Esquerda + Checklist de Cores à Direita) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Lado Esquerdo: Canvas 2D Interativo do Molde da Camada */}
          <div className="flex-1 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-800 relative bg-zinc-950">
            <LayerCanvas2D
              grid={currentLayer.grid}
              highlightBeadCode={highlightBeadCode}
              viewMode={guideViewMode}
            />

            {/* Dica flutuante no topo do Canvas */}
            <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-300 font-mono shadow-lg pointer-events-none">
              <span>Molde Pegboard • {currentLayer.grid.width}×{currentLayer.grid.height} pinos</span>
            </div>
          </div>

          {/* Lado Direito: Checklist de Cores e Passo a Passo */}
          <div className="w-full lg:w-80 h-1/2 lg:h-full bg-zinc-900 flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 shrink-0">
              <span className="text-xs font-bold text-zinc-200">
                Peças da Camada Z{activeLayerZ + 1} ({layerColors.length} cores)
              </span>

              {highlightBeadCode && (
                <button
                  onClick={() => setHighlightBeadCode(null)}
                  className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-amber-400/25 transition-colors font-semibold"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Limpar Foco</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {currentLayer && currentLayer.grid.cells.flat().some((c) => c.isRodHole) && (
                <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-xl text-[11px] text-amber-300 flex items-center gap-2 shadow-inner">
                  <span className="text-sm font-bold">🔩</span>
                  <span>
                    <strong>Marcadores (+) ativos:</strong> Esta camada possui furos para passagem de <strong>hastes acrílicas</strong> de reforço estrutural.
                  </span>
                </div>
              )}

              {layerColors.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Esta camada está vazia.
                </div>
              ) : (
                layerColors.map((item) => {
                  const stepKey = `z${activeLayerZ}_${item.code}`;
                  const isChecked = !!completedSteps[stepKey];
                  const isHighlighted = highlightBeadCode === item.code;

                  return (
                    <div
                      key={item.code}
                      onClick={() => {
                        setHighlightBeadCode(isHighlighted ? null : item.code);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                          : isChecked
                          ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg border border-black/40 shadow-sm shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: item.hex }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-950/60 border border-white/20" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              [{item.code}]
                            </span>
                            <span className="font-medium text-xs text-zinc-200 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            Posicione <strong>{item.count}</strong> peças
                          </span>
                        </div>
                      </div>

                      {/* Botão de Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(stepKey);
                        }}
                        className="shrink-0 p-1 text-zinc-400 hover:text-white"
                        title={isChecked ? 'Marcar como não concluído' : 'Marcar cor como colocada'}
                      >
                        {isChecked ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}

              {/* Dica de Passagem de Ferro */}
              <div className="p-3 bg-amber-950/30 border border-amber-400/30 rounded-xl text-[11px] text-amber-300/90 flex items-center gap-2 mt-3">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Passe o ferro suavemente em ambos os lados desta camada, mantendo os furos centrais abertos.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Navegação entre Camadas */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              setHighlightBeadCode(null);
              setActiveLayerZ(Math.max(0, activeLayerZ - 1));
            }}
            disabled={activeLayerZ === 0}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-200 font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Camada Anterior</span>
            <span className="sm:hidden">Anterior</span>
          </button>

          <span className="font-mono text-xs font-bold text-amber-400">
            Camada {activeLayerZ + 1} de {grid3D.layers.length}
          </span>

          <button
            onClick={() => {
              setHighlightBeadCode(null);
              setActiveLayerZ(Math.min(grid3D.layers.length - 1, activeLayerZ + 1));
            }}
            disabled={activeLayerZ === grid3D.layers.length - 1}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <span className="hidden sm:inline">Próxima Camada</span>
            <span className="sm:hidden">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
