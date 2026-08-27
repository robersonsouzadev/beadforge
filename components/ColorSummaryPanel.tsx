'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { BeadColor } from '@/core/schemas/palette';
import type { BeadSummary } from '@/core/schemas/project';
import { Layers, Replace, Check, EyeOff, X } from 'lucide-react';

interface ColorSummaryPanelProps {
  onClose?: () => void;
  isDrawer?: boolean;
}

export function ColorSummaryPanel({ onClose, isDrawer = false }: ColorSummaryPanelProps) {
  const {
    summary,
    grid,
    selectedBead,
    setSelectedBead,
    activePalette,
    replaceColorInGrid,
    highlightBeadCode,
    setHighlightBeadCode,
    closeDrawers,
  } = useEditorStore();

  const handleClose = onClose || closeDrawers;

  const [replacingCode, setReplacingCode] = useState<string | null>(null);
  const [targetBead, setTargetBead] = useState<BeadColor | null>(null);

  const handleReplaceSubmit = () => {
    if (replacingCode && targetBead) {
      replaceColorInGrid(replacingCode, targetBead);
      setReplacingCode(null);
      setTargetBead(null);
    }
  };

  const toggleHighlight = (code: string) => {
    if (highlightBeadCode === code) {
      setHighlightBeadCode(null);
    } else {
      setHighlightBeadCode(code);
    }
  };

  return (
    <aside className="w-full sm:w-80 min-w-0 sm:min-w-[320px] max-w-full bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden text-zinc-200 select-none shadow-2xl xl:shadow-none">
      {/* Header do Painel */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 sticky top-0 z-20 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold tracking-wide uppercase text-zinc-100 font-sans">
            Resumo de Cores
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {highlightBeadCode && (
            <button
              onClick={() => setHighlightBeadCode(null)}
              title="Remover foco de cor"
              className="text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-amber-400/25 transition-colors font-semibold"
            >
              <EyeOff className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
          <div className="bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-700/60 text-xs font-mono shadow-inner">
            <span className="text-zinc-400">Total: </span>
            <span className="font-bold text-amber-400">{grid?.totalBeads ?? 0}</span>
          </div>

          {/* Botão Fechar em modo Drawer */}
          {isDrawer && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Cores Utilizadas (Grid de Swatches Pindoo/Photoshop) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-w-0">
        {summary.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs text-center p-4">
            <Layers className="w-8 h-8 text-zinc-600 mb-2 opacity-60" />
            <span>Nenhum bead adicionado ainda.</span>
            <span className="mt-1 text-zinc-600 text-[11px]">
              Gere um molde no painel de configurações para ver o resumo.
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-medium text-zinc-300">Cores no Projeto ({summary.length})</span>
              <span className="text-[10px] text-zinc-500">Clique para focar/pintar</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 w-full min-w-0">
              {summary.map((item: BeadSummary) => {
                const isSelected = selectedBead?.code === item.code;
                const isHighlighted = highlightBeadCode === item.code;

                return (
                  <div
                    key={item.code}
                    onClick={() => {
                      const found = activePalette.find((b: BeadColor) => b.code === item.code);
                      if (found) {
                        setSelectedBead(found);
                        toggleHighlight(item.code);
                      }
                    }}
                    title={`[${item.code}] ${item.name} (${item.count} peças)`}
                    className={`relative flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-all duration-150 active:scale-[0.96] min-w-0 ${
                      isHighlighted
                        ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-105 z-10'
                        : isSelected
                        ? 'bg-zinc-800 border-amber-400/60 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                    }`}
                  >
                    {/* Código da cor */}
                    <span className="text-[10px] font-mono font-bold text-zinc-300 truncate w-full text-center">
                      {item.code}
                    </span>

                    {/* Ícone Cilíndrico 3D do Bead */}
                    <div className="relative my-1 flex items-center justify-center shrink-0">
                      <div
                        className="w-5 h-6 rounded-[3px] border border-black/40 shadow-inner flex items-center justify-center ring-1 ring-white/10"
                        style={{ backgroundColor: item.hex }}
                      >
                        {/* Furo central do bead */}
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-950/70 border border-white/20" />
                      </div>
                    </div>

                    {/* Quantidade */}
                    <span className="text-[11px] font-mono font-semibold text-zinc-200">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal/Seção de Substituição em Lote - Layout Vertical sem estourar largura */}
        {summary.length > 0 && (
          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800 text-xs space-y-2.5 shadow-inner min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Replace className="w-3.5 h-3.5 text-amber-400" />
              <span>Substituir Cor em Lote</span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-zinc-400 w-8 shrink-0">De:</span>
                <select
                  value={replacingCode || ''}
                  onChange={(e) => setReplacingCode(e.target.value || null)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 w-full min-w-0 max-w-full focus:outline-none focus:border-amber-400 font-mono truncate"
                >
                  <option value="">Selecione cor atual...</option>
                  {summary.map((s: BeadSummary) => (
                    <option key={s.code} value={s.code}>
                      [{s.code}] {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-zinc-400 w-8 shrink-0">Para:</span>
                <select
                  value={targetBead?.code || ''}
                  onChange={(e) => {
                    const b = activePalette.find((p: BeadColor) => p.code === e.target.value);
                    setTargetBead(b || null);
                  }}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 w-full min-w-0 max-w-full focus:outline-none focus:border-amber-400 font-mono truncate"
                >
                  <option value="">Selecione nova cor...</option>
                  {activePalette.map((b: BeadColor) => (
                    <option key={b.code} value={b.code}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleReplaceSubmit}
                  disabled={!replacingCode || !targetBead}
                  className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold disabled:opacity-30 p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center shadow-sm"
                  title="Executar substituição"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catálogo Completo da Paleta Ativa */}
        <div className="pt-2 border-t border-zinc-800 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-300 font-medium">
              Catálogo da Paleta
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {activePalette.length} cores
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1 min-w-0">
            {activePalette.map((bead: BeadColor) => {
              const isSelected = selectedBead?.code === bead.code;
              return (
                <button
                  key={bead.code}
                  onClick={() => {
                    setSelectedBead(bead);
                    toggleHighlight(bead.code);
                  }}
                  title={`[${bead.code}] ${bead.name}`}
                  className={`w-full aspect-square rounded-md border flex items-center justify-center transition-all duration-100 min-w-0 ${
                    isSelected
                      ? 'border-white ring-2 ring-amber-400 scale-110 shadow-lg z-10'
                      : 'border-zinc-800 hover:border-zinc-500 hover:scale-105'
                  }`}
                  style={{ backgroundColor: bead.hex }}
                >
                  <span
                    className="text-[8px] font-bold font-mono drop-shadow-sm truncate"
                    style={{
                      color:
                        bead.rgb.r * 0.3 + bead.rgb.g * 0.6 + bead.rgb.b * 0.1 > 140
                          ? '#09090B'
                          : '#FFFFFF',
                    }}
                  >
                    {bead.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
