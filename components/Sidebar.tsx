'use client';

import React, { useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { PEGBOARD_TEMPLATES } from '@/core/pegboards/manager';
import { CustomSelect, SelectGroup } from '@/components/ui/CustomSelect';
import {
  Upload,
  Sliders,
  Palette as PaletteIcon,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Ruler,
  ZoomIn,
  Square,
  Layers,
  Eye,
  FileText,
  Info,
  Circle,
  Star,
  Grid3X3,
  RotateCcw,
  Sparkle,
  X,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  isDrawer?: boolean;
}

export function Sidebar({ onClose, isDrawer = false }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    imagePreviewUrl,
    setImage,
    gridWidth,
    gridHeight,
    selectedPegboardTemplateId,
    setPegboardTemplate,
    boardsHorizontal,
    boardsVertical,
    setBoardsMultipliers,
    multiBoardConfig,
    viewMode,
    setViewMode,
    showPlateDivisions,
    setShowPlateDivisions,
    showGridNumbers,
    setShowGridNumbers,
    paletteId,
    setPaletteId,
    ditherMode,
    setDitherMode,
    contrast,
    saturation,
    brightness,
    setAdjustments,
    scale,
    setScale,
    offsetX,
    offsetY,
    setOffset,
    bgTolerance,
    setBgTolerance,
    removeBackground,
    setRemoveBackground,
    isProcessing,
    setIsProcessing,
    setGrid,
    closeDrawers,
  } = useEditorStore();

  const handleClose = onClose || closeDrawers;

  const isMini = paletteId === 'mini-26mm-120' || paletteId === 'hama-mini';
  const beadDiameterMm = isMini ? 2.6 : 5.0;

  // Filtra as placas compatíveis com o tipo de bead ativo (2.6mm ou 5.0mm)
  const currentBeadTypeId = isMini ? 'hama-mini-26' : 'hama-midi-50';
  const compatiblePegboards = PEGBOARD_TEMPLATES.filter(
    (tpl) => tpl.beadTypeId === currentBeadTypeId
  );
  const otherPegboards = PEGBOARD_TEMPLATES.filter(
    (tpl) => tpl.beadTypeId !== currentBeadTypeId
  );

  // Grupos para CustomSelect de Paletas
  const paletteGroups: SelectGroup[] = [
    {
      label: 'Beads Mini 2,6mm (Alta Definição)',
      icon: <Circle className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />,
      options: [
        {
          value: 'mini-26mm-120',
          label: 'Mini Beads 2.6mm (Estojo 120 Cores)',
          subLabel: 'Séries A, B, C, D, E, F, G, H, M',
          badge: '120 cores',
          icon: <Star className="w-3.5 h-3.5 text-amber-400" />,
        },
        {
          value: 'hama-mini',
          label: 'Hama Mini 2.6mm',
          subLabel: 'Paleta Oficial Hama Mini',
          badge: '48 cores',
          icon: <Sparkle className="w-3.5 h-3.5 text-amber-400" />,
        },
      ],
    },
    {
      label: 'Beads Midi 5,0mm (Padrão Clássico)',
      icon: <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400" />,
      options: [
        {
          value: 'pindoo-standard',
          label: 'Pindoo Standard 5.0mm',
          subLabel: 'Paleta Padrão de Fábrica',
          badge: '48 cores',
          icon: <Sparkles className="w-3.5 h-3.5 text-yellow-400" />,
        },
        {
          value: 'hama-midi',
          label: 'Hama Midi 5.0mm',
          subLabel: 'Paleta Oficial Hama Midi',
          badge: '58 cores',
          icon: <Sparkle className="w-3.5 h-3.5 text-yellow-400" />,
        },
      ],
    },
  ];

  // Grupos para CustomSelect de Placas Pegboard
  const pegboardGroups: SelectGroup[] = [
    {
      label: `Placas Compatíveis com Beads ${beadDiameterMm}mm`,
      icon: <Grid3X3 className="w-3 h-3 text-amber-400" />,
      options: compatiblePegboards.map((tpl) => ({
        value: tpl.id,
        label: tpl.name,
        subLabel: `${tpl.pinsHorizontal}×${tpl.pinsVertical} pinos`,
        badge: `${tpl.totalBeads.toLocaleString()} beads`,
        icon: <Square className="w-3 h-3 text-amber-400" />,
      })),
    },
    ...(otherPegboards.length > 0
      ? [
          {
            label: 'Placas para Beads Midi 5,0mm (5mm)',
            icon: <Grid3X3 className="w-3 h-3 text-zinc-500" />,
            options: otherPegboards.map((tpl) => ({
              value: tpl.id,
              label: tpl.name,
              subLabel: `${tpl.pinsHorizontal}×${tpl.pinsVertical} pinos`,
              badge: `${tpl.totalBeads.toLocaleString()} beads`,
              icon: <Square className="w-3 h-3 text-zinc-500" />,
            })),
          },
        ]
      : []),
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImage(file, previewUrl, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    const { imageFile, imageBase64 } = useEditorStore.getState();
    if (!imageFile && !imageBase64) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageBase64) {
        formData.append('imageBase64', imageBase64);
      }

      formData.append('gridWidth', String(gridWidth));
      formData.append('gridHeight', String(gridHeight));
      formData.append('paletteId', paletteId);
      formData.append('ditherMode', ditherMode);
      formData.append('scale', String(scale));
      formData.append('offsetX', String(offsetX));
      formData.append('offsetY', String(offsetY));
      formData.append('bgTolerance', String(bgTolerance));
      formData.append('contrast', String(contrast));
      formData.append('saturation', String(saturation));
      formData.append('brightness', String(brightness));
      formData.append('removeBackground', String(removeBackground));

      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao processar.');

      setGrid(data.grid);
      if (isDrawer) {
        handleClose();
      }
    } catch (err: any) {
      console.error('Erro ao processar:', err);
      alert('Erro: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <aside className="w-full sm:w-80 min-w-0 sm:min-w-[320px] max-w-full bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-y-auto text-zinc-200 text-xs select-none shadow-2xl xl:shadow-none">
      {/* Header do Drawer (Visível em modo mobile/drawer) */}
      {isDrawer && (
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold tracking-wide uppercase text-zinc-100 font-sans">
              Configurações do Molde
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-3.5 space-y-4">
        {/* 1. Upload de Imagem */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Imagem de Origem</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-700 hover:border-amber-400/80 bg-zinc-950/70 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-zinc-950 group"
          >
            {imagePreviewUrl ? (
              <div className="relative w-full aspect-square max-h-32 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-900 border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-medium">
                  Trocar Imagem
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-2.5 text-zinc-400">
                <ImageIcon className="w-7 h-7 text-zinc-500 mb-1.5 group-hover:text-amber-400 transition-colors" />
                <span className="font-medium text-zinc-300 text-xs">
                  Clique ou arraste uma imagem
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  PNG, JPG ou WebP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Modo de Visualização (Montagem vs Impressão) */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo de Visualização</span>
          </label>

          <div className="grid grid-cols-2 gap-1.5 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('pattern')}
              className={`py-1.5 px-2 rounded-md text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'pattern'
                  ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm ring-1 ring-amber-300'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Modo Molde (Códigos)</span>
            </button>
            <button
              onClick={() => setViewMode('assembly')}
              className={`py-1.5 px-2 rounded-md text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'assembly'
                  ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm ring-1 ring-amber-300'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Arte (Pixel Art)</span>
            </button>
          </div>
        </div>

        {/* 3. Tamanho & Paleta de Beads */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
              <PaletteIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Tamanho & Paleta de Beads</span>
            </label>
            <span className="text-[10px] font-mono bg-amber-400/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30 font-bold">
              {beadDiameterMm}mm
            </span>
          </div>

          <CustomSelect
            groups={paletteGroups}
            value={paletteId}
            onChange={(newPaletteId) => {
              setPaletteId(newPaletteId);
              const newIsMini = newPaletteId === 'mini-26mm-120' || newPaletteId === 'hama-mini';
              if (newIsMini && !selectedPegboardTemplateId.startsWith('hama-mini')) {
                setPegboardTemplate('hama-mini-145');
              } else if (!newIsMini && selectedPegboardTemplateId.startsWith('hama-mini')) {
                setPegboardTemplate('hama-midi-145');
              }
            }}
          />
        </div>

        {/* 4. Configurador de Placas Pegboard & Multiplicação */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
              <Square className="w-3.5 h-3.5 text-amber-400" />
              <span>Placa Pegboard ({beadDiameterMm}mm)</span>
            </label>
            <div className="flex items-center gap-1 text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-amber-400 font-mono font-semibold">
              <Ruler className="w-3 h-3 text-zinc-400" />
              <span>{multiBoardConfig.totalWidthCm} × {multiBoardConfig.totalHeightCm} cm</span>
            </div>
          </div>

          <CustomSelect
            groups={pegboardGroups}
            value={selectedPegboardTemplateId}
            onChange={(templateId) => setPegboardTemplate(templateId)}
          />

          {/* Explicação Didática sobre a densidade física de beads */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-2.5 flex items-start gap-2 text-[10px] text-zinc-300 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-300">Diferença de Escala:</strong> Peças <strong className="text-zinc-100">Mini (2,6mm)</strong> têm metade do diâmetro das <strong className="text-zinc-100">Midi (5,0mm)</strong>. Por isso, a placa mini de 7,4cm acomoda a mesma quantidade de pinos (841) que a placa midi de 14,5cm!
            </span>
          </div>

          {/* Sistema de Multiplicação de Placas */}
          <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 text-[11px] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Multiplicação de Placas</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {multiBoardConfig.totalBoards} {multiBoardConfig.totalBoards === 1 ? 'placa' : 'placas'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Horizontais (X)</span>
                <select
                  value={boardsHorizontal}
                  onChange={(e) => setBoardsMultipliers(parseInt(e.target.value), boardsVertical)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono font-semibold focus:outline-none focus:border-amber-400 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'placa' : 'placas'} ({n * multiBoardConfig.pinsHorizontalPerBoard}p)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Verticais (Y)</span>
                <select
                  value={boardsVertical}
                  onChange={(e) => setBoardsMultipliers(boardsHorizontal, parseInt(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono font-semibold focus:outline-none focus:border-amber-400 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'placa' : 'placas'} ({n * multiBoardConfig.pinsVerticalPerBoard}p)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Presets Rápidos de Montagem */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: '1×1', title: '1 Placa', h: 1, v: 1 },
                { label: '2×1', title: '2 Lado', h: 2, v: 1 },
                { label: '2×2', title: '4 Placas', h: 2, v: 2 },
                { label: '3×3', title: '9 Placas', h: 3, v: 3 },
              ].map((p) => {
                const isActive = boardsHorizontal === p.h && boardsVertical === p.v;
                return (
                  <button
                    key={p.label}
                    onClick={() => setBoardsMultipliers(p.h, p.v)}
                    className={`py-1 rounded border text-[10px] font-medium transition-all active:scale-[0.97] ${
                      isActive
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Resumo do Molde Calculado */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Total do Molde:</span>
              <span className="font-mono font-bold text-amber-400">
                {gridWidth} × {gridHeight} pinos ({multiBoardConfig.totalCapacityBeads.toLocaleString()} beads)
              </span>
            </div>

            {/* Toggles de Visualização de Placas */}
            <div className="pt-1.5 border-t border-zinc-800/60 flex flex-col gap-1.5">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[10px] text-zinc-300 group-hover:text-zinc-100">Divisão visual das placas físicas</span>
                <input
                  type="checkbox"
                  checked={showPlateDivisions}
                  onChange={(e) => setShowPlateDivisions(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-400 bg-zinc-900 border-zinc-700 focus:ring-0 accent-amber-400"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[10px] text-zinc-300 group-hover:text-zinc-100">Numeração de coordenadas (R:C)</span>
                <input
                  type="checkbox"
                  checked={showGridNumbers}
                  onChange={(e) => setShowGridNumbers(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-400 bg-zinc-900 border-zinc-700 focus:ring-0 accent-amber-400"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 5. Escala & Enquadramento do Desenho na Prancha */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Escala do Desenho ({Math.round(scale * 100)}%)</span>
            </label>
            <button
              onClick={() => {
                setScale(1.0);
                setOffset(0, 0);
              }}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-medium"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Resetar</span>
            </button>
          </div>

          <div className="space-y-2 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 shadow-inner">
            {/* Slider de Escala */}
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Tamanho no Molde</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.2}
                step={0.05}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-zinc-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Presets Rápidos de Escala */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              {[
                { label: 'Margem (80%)', val: 0.8 },
                { label: 'Ajustar (100%)', val: 1.0 },
                { label: 'Preencher (135%)', val: 1.35 },
              ].map((p) => {
                const isActive = Math.abs(scale - p.val) < 0.01;
                return (
                  <button
                    key={p.val}
                    onClick={() => setScale(p.val)}
                    className={`py-1 rounded border text-[10px] font-medium transition-all active:scale-[0.97] ${
                      isActive
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Ajustes de Deslocamento X e Y */}
            <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Posição X</span>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={1}
                  value={offsetX}
                  onChange={(e) => setOffset(parseInt(e.target.value), offsetY)}
                  className="w-full accent-amber-400 bg-zinc-800 h-1 rounded cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Posição Y</span>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={1}
                  value={offsetY}
                  onChange={(e) => setOffset(offsetX, parseInt(e.target.value))}
                  className="w-full accent-amber-400 bg-zinc-800 h-1 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. Dithering & Remoção de Fundo */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800">
          <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Algoritmo & Fundo</span>
          </label>

          <div>
            <span className="text-[10px] text-zinc-400 block mb-1">Dithering (Difusão Linear)</span>
            <div className="grid grid-cols-3 gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
              {(['none', 'floyd-steinberg', 'atkinson'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDitherMode(mode)}
                  className={`py-1 rounded text-[10px] transition-all ${
                    ditherMode === mode
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm ring-1 ring-amber-300'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 font-medium'
                  }`}
                >
                  {mode === 'none' ? 'None (Sólido)' : mode === 'floyd-steinberg' ? 'Floyd-S.' : 'Atkinson'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 shadow-inner">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="font-medium text-zinc-200 block text-xs group-hover:text-zinc-100">Remover Fundo</span>
                <span className="text-[10px] text-zinc-500">Deixa células de fundo vazias</span>
              </div>
              <input
                type="checkbox"
                checked={removeBackground}
                onChange={(e) => setRemoveBackground(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 focus:ring-0 bg-zinc-900 border-zinc-700 accent-amber-400"
              />
            </label>

            {removeBackground && (
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Tolerância do Fundo</span>
                  <span className="font-mono text-amber-400 font-bold">ΔE {bgTolerance}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.5}
                  value={bgTolerance}
                  onChange={(e) => setBgTolerance(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-zinc-800 h-1 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* 7. Ajustes Finos de Imagem */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-800">
          <label className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px] tracking-wide uppercase">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajustes de Imagem</span>
          </label>

          <div className="space-y-2 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800 shadow-inner">
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Contraste</span>
                <span className="font-mono text-zinc-300">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={contrast}
                onChange={(e) => setAdjustments(parseInt(e.target.value), saturation, brightness)}
                className="w-full accent-amber-400 bg-zinc-800 h-1 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Saturação</span>
                <span className="font-mono text-zinc-300">{saturation > 0 ? `+${saturation}` : saturation}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={saturation}
                onChange={(e) => setAdjustments(contrast, parseInt(e.target.value), brightness)}
                className="w-full accent-amber-400 bg-zinc-800 h-1 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Brilho</span>
                <span className="font-mono text-zinc-300">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={brightness}
                onChange={(e) => setAdjustments(contrast, saturation, parseInt(e.target.value))}
                className="w-full accent-amber-400 bg-zinc-800 h-1 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Botão de Processamento Principal com Amarelo Arcade / Pac-Man */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || (!imagePreviewUrl && !useEditorStore.getState().imageBase64)}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ring-1 ring-amber-300 text-xs disabled:opacity-40 disabled:pointer-events-none"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Convertendo Imagem para Molde...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>Gerar Molde Pegboard</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
