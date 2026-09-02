'use client';

import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { Model3DLoader } from '@/core/voxel/model-loader';
import { MultipartLoader } from '@/core/voxel/multipart-loader';
import { generateBOMReport } from '@/core/export/bom-generator';
import { CustomSelect, SelectGroup } from '@/components/ui/CustomSelect';
import { PALETTES } from '@/data/palettes';
import { PEGBOARD_TEMPLATES } from '@/core/pegboards/manager';
import type { FillMode } from '@/core/voxel/voxel-types';
import {
  Upload,
  Box,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle,
  FileDown,
  Info,
  X,
  FileCode,
  Flame,
  Star,
  Loader2,
  Wand2,
  Palette,
  Square,
  Grid3X3,
  Circle,
  Sparkle,
} from 'lucide-react';

interface UltraSidebarProps {
  onClose?: () => void;
  isDrawer?: boolean;
}

export function UltraSidebar({ onClose, isDrawer = false }: UltraSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    grid3D,
    setGrid3D,
    activePalette,
    paletteId,
    setPaletteId,
    fillMode,
    setFillMode,
    wallThickness,
    setWallThickness,
    model3DFileName,
    setModel3DFileName,
    setMultipartItems,
    multipartItems,
    setIsMultipartModalOpen,
    closeDrawers,
  } = useEditorStore();

  const handleClose = onClose || closeDrawers;

  // Dimensões padrão otimizadas para escultura vertical de alta definição
  const [targetWidth, setTargetWidth] = useState<number>(38);
  const [targetHeight, setTargetHeight] = useState<number>(56);
  const [targetDepth, setTargetDepth] = useState<number>(28);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [remappingColor, setRemappingColor] = useState<{ code: string; hex: string; name: string } | null>(null);

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

  // Paletas disponíveis formatadas para o CustomSelect
  const paletteGroups: SelectGroup[] = [
    {
      label: 'Paletas Profissionais para 3D Stacking',
      icon: <Star className="w-3 h-3 text-amber-400" />,
      options: [
        {
          value: 'mini-26mm-120',
          label: 'Perler/Hama Mini 2.6mm',
          subLabel: 'Catálogo Completo Expandido',
          badge: '120 cores',
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
        },
        {
          value: 'hama-mini',
          label: 'Hama Mini 2.6mm Oficial',
          subLabel: 'Paleta Padrão de Fábrica',
          badge: '48 cores',
          icon: <Sparkles className="w-3.5 h-3.5 text-yellow-400" />,
        },
        {
          value: 'hama-midi',
          label: 'Hama Midi 5.0mm',
          subLabel: 'Paleta Oficial Hama Midi',
          badge: '58 cores',
          icon: <Sparkles className="w-3.5 h-3.5 text-yellow-400" />,
        },
      ],
    },
  ];

  // Placas Pegboard disponíveis para montagem
  const isMini = paletteId === 'mini-26mm-120' || paletteId === 'hama-mini';
  const beadDiameterMm = isMini ? 2.6 : 5.0;
  const currentBeadTypeId = isMini ? 'hama-mini-26' : 'hama-midi-50';

  const [selectedPegboardId, setSelectedPegboardId] = useState<string>(
    isMini ? 'hama-mini-74' : 'hama-midi-145'
  );

  const pegboardGroups: SelectGroup[] = [
    {
      label: `Placas Compatíveis (${beadDiameterMm}mm)`,
      icon: <Grid3X3 className="w-3 h-3 text-amber-400" />,
      options: [
        ...PEGBOARD_TEMPLATES.filter((tpl) => tpl.beadTypeId === currentBeadTypeId).map((tpl) => ({
          value: tpl.id,
          label: tpl.name,
          subLabel: `${tpl.pinsHorizontal}×${tpl.pinsVertical} pinos`,
          badge: `${tpl.totalBeads.toLocaleString()} beads`,
          icon: <Square className="w-3 h-3 text-amber-400" />,
        })),
        {
          value: 'custom',
          label: 'Dimensões Personalizadas',
          subLabel: 'Ajuste manual de pinos e camadas',
          badge: 'Livre',
          icon: <Sliders className="w-3 h-3 text-amber-400" />,
        },
      ],
    },
    {
      label: 'Outras Placas Pegboard',
      icon: <Grid3X3 className="w-3 h-3 text-zinc-500" />,
      options: PEGBOARD_TEMPLATES.filter((tpl) => tpl.beadTypeId !== currentBeadTypeId).map((tpl) => ({
        value: tpl.id,
        label: tpl.name,
        subLabel: `${tpl.pinsHorizontal}×${tpl.pinsVertical} pinos`,
        badge: `${tpl.totalBeads.toLocaleString()} beads`,
        icon: <Square className="w-3 h-3 text-zinc-500" />,
      })),
    },
  ];

  const handleSelectPegboard = (tplId: string) => {
    setSelectedPegboardId(tplId);
    if (tplId === 'custom') return;
    const tpl = PEGBOARD_TEMPLATES.find((p) => p.id === tplId);
    if (tpl) {
      setTargetWidth(tpl.pinsHorizontal);
      setTargetHeight(tpl.pinsVertical);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Caso 1: Múltiplos arquivos STL/OBJ selecionados juntos
    if (files.length > 1) {
      setIsLoading(true);
      try {
        const loader = new MultipartLoader(activePalette);
        const parts = await loader.loadFromMultipleFiles(Array.from(files));
        setModel3DFileName(`${files.length} arquivos STL`);
        setMultipartItems(parts);
        if (isDrawer) handleClose();
      } catch (err: any) {
        alert('Erro ao carregar múltiplos arquivos: ' + err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const file = files[0];
    const lowerName = file.name.toLowerCase();

    // Caso 2: Arquivo .3MF (Bambu Studio / OrcaSlicer / PrusaSlicer)
    if (lowerName.endsWith('.3mf')) {
      setSelectedFile(file);
      setModel3DFileName(file.name);
      setMultipartItems([]);
      setIsLoading(true);
      try {
        const loader = new Model3DLoader(activePalette);
        const voxelGrid = await loader.loadFromFile(file, {
          width: targetWidth,
          height: targetHeight,
          depth: targetDepth,
          fillMode,
          wallThickness,
          pitchMm: 2.6,
        });
        setGrid3D(voxelGrid);
        if (isDrawer) handleClose();
      } catch (err: any) {
        alert('Erro ao processar arquivo .3MF: ' + err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Caso 3: Arquivo .ZIP (ex: spiderman+multipart_stls.zip)
    if (lowerName.endsWith('.zip')) {
      setIsLoading(true);
      try {
        const loader = new MultipartLoader(activePalette);
        const parts = await loader.loadFromZip(file);
        if (parts.length === 0) {
          alert('Nenhum arquivo 3D (.stl, .obj) encontrado dentro do arquivo ZIP.');
          return;
        }
        setModel3DFileName(file.name);
        setMultipartItems(parts);
        if (isDrawer) handleClose();
      } catch (err: any) {
        alert('Erro ao descompactar arquivo ZIP: ' + err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Caso 4: Arquivo 3D único (.vox, .obj, .stl, .glb)
    setSelectedFile(file);
    setModel3DFileName(file.name);
  };

  const handleProcessModel = async () => {
    if (!selectedFile) {
      alert('Selecione um arquivo 3D (.vox, .obj, .stl, .glb) primeiro.');
      return;
    }

    setIsLoading(true);
    try {
      const loader = new Model3DLoader(activePalette);
      const voxelGrid = await loader.loadFromFile(selectedFile, {
        width: targetWidth,
        height: targetHeight,
        depth: targetDepth,
        fillMode,
        wallThickness,
        pitchMm: 2.6,
      });

      setGrid3D(voxelGrid);
      if (isDrawer) handleClose();
    } catch (err: any) {
      console.error('Erro ao voxelizar modelo 3D:', err);
      alert('Erro ao processar modelo: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const bom = grid3D ? generateBOMReport(grid3D, 'Projeto 3D Ultra') : null;

  return (
    <aside className="w-full sm:w-80 min-w-0 sm:min-w-[320px] max-w-full bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-y-auto text-zinc-200 text-xs select-none shadow-2xl xl:shadow-none">
      {/* Header do Painel */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold tracking-wide uppercase text-zinc-100 font-sans">
            Configurador 3D Ultra
          </h2>
        </div>

        {isDrawer && (
          <button
            onClick={handleClose}
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-4">
        {/* Botão de Geração 3D por IA a partir de Foto 2D */}
        <button
          type="button"
          onClick={() => useEditorStore.getState().setIsImageTo3DModalOpen(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 border border-amber-400/50 hover:border-amber-400 text-amber-300 hover:text-white flex items-center justify-between text-xs font-bold transition shadow-sm group"
        >
          <span className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Gerar 3D com IA (de Foto 2D)</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 text-[10px] font-bold">
            NOVO
          </span>
        </button>

        {/* Upload de Modelo 3D */}
        <div>
          <label className="block text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
            <span>Importar Arquivo 3D</span>
            <span className="text-[10px] text-amber-400 font-mono">.ZIP .3MF .STL .VOX</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".vox,.obj,.stl,.glb,.gltf,.zip,.3mf"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
              selectedFile || multipartItems.length > 0
                ? 'border-amber-400/60 bg-amber-950/20 text-amber-300'
                : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-850 text-zinc-400'
            }`}
          >
            <Upload className="w-6 h-6 mb-1.5 text-amber-400" />
            <span className="font-semibold text-xs text-zinc-200 text-center">
              {multipartItems.length > 0
                ? `${multipartItems.length} peças carregadas (Clique para gerenciar cores)`
                : selectedFile
                ? selectedFile.name
                : 'Carregar Arquivo 3D ou ZIP Multipartes'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5 text-center">
              ZIP com vários STLs (Homem-Aranha etc.), 3MF, VOX ou OBJ
            </span>
          </button>
        </div>

        {/* Placa Pegboard de Montagem (Igual ao 2D) */}
        <div>
          <label className="block text-zinc-400 font-medium mb-1">
            Placa Pegboard de Montagem
          </label>
          <CustomSelect
            groups={pegboardGroups}
            value={selectedPegboardId}
            onChange={handleSelectPegboard}
          />
        </div>

        {/* Resolução do Grid Voxel (X, Y, Z) */}
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between font-medium text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Dimensões de Beads (X × Y × Z)</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Largura (X)</span>
              <input
                type="number"
                min="10"
                max="100"
                value={targetWidth}
                onChange={(e) => setTargetWidth(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Profundidade (Y)</span>
              <input
                type="number"
                min="10"
                max="100"
                value={targetHeight}
                onChange={(e) => setTargetHeight(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Camadas (Z)</span>
              <input
                type="number"
                min="3"
                max="80"
                value={targetDepth}
                onChange={(e) => setTargetDepth(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1 px-1.5 text-center font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Atalhos Rápidos de Densidade / Resolução */}
          <div className="pt-1">
            <span className="text-[10px] text-zinc-500 font-medium block mb-1.5">Predefinições de Alta Definição:</span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Compacto', sub: '28×38', w: 28, h: 38, d: 20 },
                { label: 'Alta Def.', sub: '38×56', w: 38, h: 56, d: 28 },
                { label: 'Ultra HD', sub: '48×70', w: 48, h: 70, d: 36 },
                { label: 'Master', sub: '56×82', w: 56, h: 82, d: 42 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setTargetWidth(p.w);
                    setTargetHeight(p.h);
                    setTargetDepth(p.d);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-center transition border ${
                    targetWidth === p.w && targetHeight === p.h && targetDepth === p.d
                      ? 'bg-amber-400 border-amber-400 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[10px] font-bold block leading-tight">{p.label}</span>
                  <span className="text-[9px] opacity-75 font-mono block">{p.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tipo de Preenchimento: Sólido vs Oco */}
        <div className="space-y-1.5">
          <label className="block text-zinc-400 font-medium">Preenchimento Interno</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setFillMode('solid')}
              className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                fillMode === 'solid'
                  ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-md'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span>Sólido (100%)</span>
              <span className="block text-[9px] opacity-75 font-normal">Máxima rigidez</span>
            </button>

            <button
              type="button"
              onClick={() => setFillMode('hollow')}
              className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                fillMode === 'hollow'
                  ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-md'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span>Oco (Hollow)</span>
              <span className="block text-[9px] opacity-75 font-normal">Economiza até 80%</span>
            </button>
          </div>

          {fillMode === 'hollow' && (
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
              <span>Espessura da parede externa:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWallThickness(1)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    wallThickness === 1 ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  1 Bead
                </button>
                <button
                  type="button"
                  onClick={() => setWallThickness(2)}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    wallThickness === 2 ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  2 Beads
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Seleção de Paleta de Cores */}
        <div>
          <label className="block text-zinc-400 font-medium mb-1">Catálogo de Beads</label>
          <CustomSelect
            groups={paletteGroups}
            value={paletteId}
            onChange={(newId) => setPaletteId(newId)}
          />
        </div>

        {/* Botão de Ação Primária Arcade Yellow */}
        <button
          type="button"
          onClick={handleProcessModel}
          disabled={isLoading || !selectedFile}
          className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Voxelizando Modelo 3D...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Voxelizar e Gerar Molde 3D</span>
            </>
          )}
        </button>

        {/* Gerenciador de Cores da Escultura 3D (Substituir / Customizar Cores) */}
        {bom && bom.items.length > 0 && (
          <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between font-bold text-zinc-100 text-xs">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Cores da Escultura ({bom.items.length})</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Clique para trocar</span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {bom.items.map((item) => (
                <div key={item.code} className="space-y-1.5">
                  <div
                    onClick={() =>
                      setRemappingColor(
                        remappingColor?.code === item.code
                          ? null
                          : { code: item.code, hex: item.hex, name: item.name }
                      )
                    }
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                      remappingColor?.code === item.code
                        ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/40'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: item.hex }}
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-zinc-200 truncate block">
                          [{item.code}] {item.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {item.totalCount} beads
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 shrink-0">
                      {remappingColor?.code === item.code ? 'Fechar' : 'Trocar'}
                    </span>
                  </div>

                  {/* Seletor de Cores da Paleta */}
                  {remappingColor?.code === item.code && (
                    <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-700 space-y-2">
                      <span className="text-[10px] text-zinc-400 font-medium block">
                        Escolha o novo Bead para substituir <strong>{item.name}</strong> em toda a escultura:
                      </span>
                      <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-950 rounded-lg">
                        {activePalette.map((bead) => (
                          <button
                            key={bead.code}
                            type="button"
                            onClick={() => {
                              useEditorStore.getState().remap3DColor(item.code, bead);
                              setRemappingColor(null);
                            }}
                            className="w-6 h-6 rounded-md border border-white/20 hover:scale-110 transition shadow-sm relative group flex items-center justify-center"
                            style={{ backgroundColor: bead.hex }}
                            title={`[${bead.code}] ${bead.name}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Informativo de Materiais (BOM) */}
        {bom && (
          <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-zinc-100 text-xs">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Resumo da Escultura 3D</span>
              </span>
              <span className="font-mono text-amber-400">{bom.totalBeads} beads</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[9px]">ALTURA TOTAL</span>
                <span className="font-bold text-zinc-200">{bom.dimensions.depthCm} cm</span>
                <span className="text-[9px] text-zinc-500 block">({bom.totalLayers} camadas)</span>
              </div>

              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[9px]">LARGURA × PROF.</span>
                <span className="font-bold text-zinc-200">
                  {bom.dimensions.widthCm} × {bom.dimensions.heightCm} cm
                </span>
                <span className="text-[9px] text-zinc-500 block">({bom.dimensions.widthBeads}×{bom.dimensions.heightBeads} pinos)</span>
              </div>

              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[9px]">PESO ESTIMADO</span>
                <span className="font-bold text-zinc-200">{bom.estimatedWeightGrams} g</span>
              </div>

              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[9px]">CORES ÚNICAS</span>
                <span className="font-bold text-amber-400">{bom.items.length} cores</span>
              </div>

              {bom.rodsRequired && (
                <div className="bg-zinc-900/80 p-2 rounded-lg border border-amber-800/40 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-amber-400 block text-[9px] font-bold">HASTES ACRÍLICAS (+)</span>
                    <span className="text-[10px] text-zinc-200 font-semibold">
                      {bom.rodsRequired.count} hastes de Ø {bom.rodsRequired.diameterMm}mm
                    </span>
                  </div>
                  <span className="text-amber-400 text-xs font-mono font-bold">
                    {bom.rodsRequired.totalLengthCm} cm total
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExport3DPDF}
              disabled={isExportingPDF}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>Baixar Guia de Montagem 3D (PDF)</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
