'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { MultipartLoader, MultipartItem } from '@/core/voxel/multipart-loader';
import type { BeadColor } from '@/core/schemas/palette';
import type { FillMode } from '@/core/voxel/voxel-types';
import {
  Layers,
  X,
  Sparkles,
  Eye,
  EyeOff,
  Palette,
  Sliders,
  CheckCircle,
  FileArchive,
  Flame,
  ChevronDown,
} from 'lucide-react';

export function MultipartColorManager() {
  const {
    multipartItems,
    isMultipartModalOpen,
    setIsMultipartModalOpen,
    updatePartColor,
    togglePartVisibility,
    activePalette,
    setGrid3D,
    model3DFileName,
  } = useEditorStore();

  const [targetWidth, setTargetWidth] = useState<number>(36);
  const [targetHeight, setTargetHeight] = useState<number>(36);
  const [targetDepth, setTargetDepth] = useState<number>(30);
  const [fillMode, setFillMode] = useState<FillMode>('hollow');
  const [wallThickness, setWallThickness] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activePickerPartId, setActivePickerPartId] = useState<string | null>(null);

  if (!isMultipartModalOpen || multipartItems.length === 0) return null;

  const handleVoxelize = () => {
    setIsProcessing(true);
    try {
      const loader = new MultipartLoader(activePalette);
      const voxelGrid = loader.mergeAndVoxelize(multipartItems, {
        width: targetWidth,
        height: targetHeight,
        depth: targetDepth,
        fillMode,
        wallThickness,
        pitchMm: 2.6,
      });

      setGrid3D(voxelGrid);
      setIsMultipartModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao mesclar e voxelizar partes:', err);
      alert('Erro ao voxelizar partes: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Header do Gerenciador de Partes */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-400/20 ring-1 ring-amber-300 shrink-0">
              <FileArchive className="w-4 h-4 text-zinc-950 font-bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 font-sans flex items-center gap-2">
                <span>Gerenciador de Partes & Cores</span>
                <span className="text-[10px] font-mono bg-amber-400/15 text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded">
                  {multipartItems.length} Peças Detectadas
                </span>
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                {model3DFileName || 'Modelo Multipartes'} • Atribua as cores de beads para cada peça
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMultipartModalOpen(false)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Principal: Lista de Partes com Seletor de Cores */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instrução */}
          <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between gap-2">
            <span>
              💡 <strong>Dica:</strong> Cada arquivo STL é uma parte do modelo na mesma posição global. Defina a cor de cada parte abaixo.
            </span>
          </div>

          {/* Grid de Partes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {multipartItems.map((part) => {
              const isPickerOpen = activePickerPartId === part.id;

              return (
                <div
                  key={part.id}
                  className={`p-3 rounded-xl border transition-all ${
                    part.isVisible
                      ? 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                      : 'bg-zinc-950/30 border-zinc-800/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Botão de Visibilidade */}
                      <button
                        type="button"
                        onClick={() => togglePartVisibility(part.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          part.isVisible
                            ? 'text-zinc-300 hover:text-white bg-zinc-800'
                            : 'text-zinc-600 hover:text-zinc-400 bg-zinc-900'
                        }`}
                        title={part.isVisible ? 'Ocultar parte' : 'Exibir parte'}
                      >
                        {part.isVisible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <span className="font-bold text-xs text-zinc-100 block truncate">
                          {part.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono truncate block">
                          {part.fileName} ({part.triangleCount} triângulos)
                        </span>
                      </div>
                    </div>

                    {/* Botão Seletor de Cor da Parte */}
                    <button
                      type="button"
                      onClick={() =>
                        setActivePickerPartId(isPickerOpen ? null : part.id)
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-400 flex items-center gap-2 transition-all shadow-sm shrink-0"
                    >
                      <div
                        className="w-4 h-4 rounded-md border border-black/40 shadow-inner shrink-0"
                        style={{ backgroundColor: part.assignedBead.hex }}
                      />
                      <div className="text-left font-mono">
                        <span className="text-xs font-bold text-amber-400">
                          [{part.assignedBead.code}]
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>

                  {/* Popover de Swatches de Cores (Abre se clicado) */}
                  {isPickerOpen && (
                    <div className="mt-2.5 p-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl space-y-2 animate-scale-in">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-medium">Escolher Cor para {part.name}:</span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {activePalette.length} cores
                        </span>
                      </div>

                      <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto pr-1">
                        {activePalette.map((bead) => (
                          <button
                            key={bead.code}
                            type="button"
                            onClick={() => {
                              updatePartColor(part.id, bead);
                              setActivePickerPartId(null);
                            }}
                            title={`[${bead.code}] ${bead.name}`}
                            className={`w-full aspect-square rounded-md border flex items-center justify-center transition-all ${
                              part.assignedBead.code === bead.code
                                ? 'border-amber-400 ring-2 ring-amber-400 scale-110 z-10'
                                : 'border-zinc-800 hover:border-zinc-500 hover:scale-105'
                            }`}
                            style={{ backgroundColor: bead.hex }}
                          >
                            <span
                              className="text-[7px] font-bold font-mono drop-shadow-sm"
                              style={{
                                color:
                                  bead.rgb.r * 0.3 + bead.rgb.g * 0.6 + bead.rgb.b * 0.1 > 140
                                    ? '#000'
                                    : '#fff',
                              }}
                            >
                              {bead.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Configurações de Resolução e Preenchimento */}
          <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Configurações da Escultura Final</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Largura (X)</span>
                <input
                  type="number"
                  min="15"
                  max="100"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Profundidade (Y)</span>
                <input
                  type="number"
                  min="15"
                  max="100"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Camadas (Z)</span>
                <input
                  type="number"
                  min="5"
                  max="80"
                  value={targetDepth}
                  onChange={(e) => setTargetDepth(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-2 text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Estrutura</span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setFillMode('solid')}
                    className={`py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      fillMode === 'solid'
                        ? 'bg-amber-400 text-zinc-950 border-amber-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    Sólido
                  </button>
                  <button
                    type="button"
                    onClick={() => setFillMode('hollow')}
                    className={`py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      fillMode === 'hollow'
                        ? 'bg-amber-400 text-zinc-950 border-amber-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    Oco
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Botão de Voxelização Unificada */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMultipartModalOpen(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-xs transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleVoxelize}
            disabled={isProcessing}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xl transition-all active:scale-95 text-xs ring-2 ring-amber-400/30 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Mesclando e Voxelizando Partes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Voxelizar Escultura Completa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
