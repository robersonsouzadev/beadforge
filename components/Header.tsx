'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Save,
  ChevronDown,
  SlidersHorizontal,
  Box,
  LayoutGrid,
  Globe,
} from 'lucide-react';
import { PublishPatternModal } from '@/components/gallery/PublishPatternModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { getUserAiCredits } from '@/app/actions/billing';

interface HeaderProps {
  onSave?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saved' | 'error';
  currentId?: string;
}

export function Header({ onSave, isSaving = false, saveStatus = 'idle', currentId }: HeaderProps = {}) {
  const {
    projectName,
    setProjectName,
    grid,
    summary,
    paletteId,
    multiBoardConfig,
    systemMode,
    setSystemMode,
    grid3D,
    activeLayerZ,
    toggleLeftDrawer,
    toggleRightDrawer,
    isLeftDrawerOpen,
    isRightDrawerOpen,
  } = useEditorStore();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  React.useEffect(() => {
    getUserAiCredits().then((c) => setUserCredits(c)).catch(() => setUserCredits(5));
  }, []);

  // 1. Exportar PDF Vetorial para Impressão (2D ou 3D Multi-Camadas)
  const handleExportPdf = async () => {
    if (systemMode === 'ultra' && !grid3D) {
      alert('Voxelize ou crie um modelo 3D antes de exportar.');
      return;
    }
    if (systemMode === '2d' && !grid) {
      alert('Gere uma prancha de beads antes de exportar o PDF.');
      return;
    }

    setIsExportingPdf(true);

    try {
      if (systemMode === 'ultra' && grid3D) {
        const targetGrid = grid3D.layers[activeLayerZ]?.grid || grid;
        if (!targetGrid) throw new Error('Camada 3D não encontrada.');

        const payload = {
          projectName: `${projectName} - Camada ${activeLayerZ + 1}`,
          title: `${projectName} - Camada ${activeLayerZ + 1}`,
          grid: targetGrid,
          summary,
          paletteId,
          metadata: {
            scaleMode: 'fit',
            pegboardConfig: `Ultra 3D - Camada ${activeLayerZ + 1} de ${grid3D.layers.length} (${grid3D.layers[activeLayerZ]?.heightMm}mm)`,
            physicalSizeCm: `${(grid3D.width * 0.26).toFixed(1)} x ${(grid3D.height * 0.26).toFixed(1)} cm`,
          },
        };

        const res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao gerar arquivo PDF da camada.');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_camada_${activeLayerZ + 1}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (grid) {
        const payload = {
          projectName,
          title: projectName,
          grid,
          summary,
          paletteId,
          metadata: {
            scaleMode: 'fit',
            pegboardConfig: `${multiBoardConfig.template.name} (${multiBoardConfig.boardsHorizontal}x${multiBoardConfig.boardsVertical} placas)`,
            physicalSizeCm: `${multiBoardConfig.totalWidthCm} x ${multiBoardConfig.totalHeightCm} cm`,
          },
        };

        const res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao gerar arquivo PDF.');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_molde.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } catch (err: any) {
      console.error('Erro na exportação de PDF:', err);
      alert(err.message || 'Erro ao exportar PDF.');
    } finally {
      setIsExportingPdf(false);
      setShowExportMenu(false);
    }
  };

  // 2. Exportar Imagem PNG em Alta Resolução (via Canvas Blob)
  const handleExportPng = () => {
    const activeTargetGrid =
      systemMode === 'ultra' && grid3D
        ? grid3D.layers[activeLayerZ]?.grid
        : grid;

    if (!activeTargetGrid) {
      alert('Nenhum molde de beads carregado para exportar imagem.');
      return;
    }

    try {
      const cellSize = 32;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = activeTargetGrid.width * cellSize;
      offCanvas.height = activeTargetGrid.height * cellSize;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível inicializar contexto 2D para renderização.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

      for (let r = 0; r < activeTargetGrid.height; r++) {
        for (let c = 0; c < activeTargetGrid.width; c++) {
          const cell = activeTargetGrid.cells[r][c];
          const x = c * cellSize;
          const y = r * cellSize;

          if (cell.isEmpty) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            ctx.fillStyle = cell.hex;
            ctx.fillRect(x, y, cellSize, cellSize);

            ctx.fillStyle = cell.textColor || '#000000';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.beadCode, x + cellSize / 2, y + cellSize / 2);
          }

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      offCanvas.toBlob((blob) => {
        if (!blob) {
          alert('Erro ao gerar arquivo de imagem PNG.');
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const suffix = systemMode === 'ultra' ? `_camada_${activeLayerZ + 1}` : '';
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}${suffix}_hd.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    } catch (err: any) {
      console.error('Erro ao gerar imagem PNG:', err);
      alert('Erro ao exportar imagem PNG: ' + err.message);
    } finally {
      setShowExportMenu(false);
    }
  };

  // 3. Exportar Lista de Materiais em CSV
  const handleExportCsv = () => {
    const activeTargetGrid =
      systemMode === 'ultra' && grid3D
        ? grid3D.layers[activeLayerZ]?.grid
        : grid;

    if (!activeTargetGrid) {
      alert('Nenhum projeto ativo para exportar lista de materiais.');
      return;
    }

    // Calcula sumário caso não exista no estado
    const currentSummary =
      summary && summary.length > 0
        ? summary
        : Array.from(
            activeTargetGrid.cells
              .flat()
              .filter((c) => !c.isEmpty && c.beadCode)
              .reduce((map, cell) => {
                const item = map.get(cell.beadCode) || {
                  code: cell.beadCode,
                  name: cell.beadName,
                  hex: cell.hex,
                  count: 0,
                };
                item.count++;
                map.set(cell.beadCode, item);
                return map;
              }, new Map<string, { code: string; name: string; hex: string; count: number }>())
              .values()
          );

    if (currentSummary.length === 0) {
      alert('Nenhum bead colorido encontrado no projeto.');
      return;
    }

    let csvContent = 'Codigo,Nome_Cor,Hex,Quantidade,Porcentagem\n';
    const total = activeTargetGrid.totalBeads || 1;

    currentSummary.forEach((item) => {
      const pct = ((item.count / total) * 100).toFixed(1);
      csvContent += `"${item.code}","${item.name}","${item.hex}",${item.count},${pct}%\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_materiais.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    setShowExportMenu(false);
  };

  return (
    <header className="h-13 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-4 py-2 flex items-center justify-between text-zinc-200 select-none z-30 shrink-0">
      {/* Lado Esquerdo: Toggle de Gaveta, Logo & Switcher de Modo 2D/3D */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleLeftDrawer}
          className={`xl:hidden p-1.5 rounded-lg border transition-colors ${
            isLeftDrawerOpen
              ? 'bg-amber-400 text-zinc-950 border-amber-300'
              : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
          }`}
          title="Abrir/Fechar Configurações"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-400/20 ring-1 ring-amber-300 shrink-0">
            <Sparkles className="w-4 h-4 text-zinc-950 font-bold" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xs font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 font-sans">
              <span className="truncate">BeadForge Studio</span>
            </h1>
          </div>
        </div>

        {/* --- SELETOR DE MODO: 2D CLASSIC VS ULTRA 3D --- */}
        <div className="flex items-center bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800 shrink-0">
          <button
            onClick={() => setSystemMode('2d')}
            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              systemMode === '2d'
                ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">2D Classic</span>
          </button>

          <button
            onClick={() => setSystemMode('ultra')}
            className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
              systemMode === 'ultra'
                ? 'bg-amber-400 text-zinc-950 shadow-md ring-1 ring-amber-300'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Ultra 3D</span>
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 hidden md:block" />

        {/* Input do título do projeto */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent border border-transparent hover:border-zinc-700/80 focus:border-amber-400 rounded px-1.5 py-1 text-xs text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800/40 focus:outline-none transition-colors max-w-[110px] sm:max-w-xs truncate hidden sm:block"
          title="Clique para renomear o projeto"
        />
      </div>

      {/* Centro: Informações de Placas / Camadas */}
      {systemMode === 'ultra' && grid3D ? (
        <div className="hidden lg:flex items-center gap-2.5 text-xs bg-zinc-800/70 px-3 py-1 rounded-lg border border-zinc-700/60 font-mono shadow-sm shrink-0">
          <div className="flex items-center gap-1 text-zinc-400">
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-200 font-bold">Ultra 3D</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="text-zinc-400">
            Camada <span className="text-amber-400 font-bold">{activeLayerZ + 1}</span> / {grid3D.layers.length}
          </div>
          <span className="text-zinc-600">|</span>
          <div className="text-zinc-400">
            <span className="text-amber-400 font-bold">{grid3D.totalBeads.toLocaleString()}</span> total beads
          </div>
        </div>
      ) : grid ? (
        <div className="hidden lg:flex items-center gap-2.5 text-xs bg-zinc-800/70 px-3 py-1 rounded-lg border border-zinc-700/60 font-mono shadow-sm shrink-0">
          <div className="flex items-center gap-1 text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-200">
              {multiBoardConfig.boardsHorizontal}×{multiBoardConfig.boardsVertical} Placas
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="text-zinc-400">
            <span className="text-zinc-100 font-semibold">{grid.width}×{grid.height}</span> pinos
          </div>
          <span className="text-zinc-600">|</span>
          <div className="text-zinc-400">
            <span className="text-amber-400 font-bold">{grid.totalBeads.toLocaleString()}</span> beads
          </div>
        </div>
      ) : null}

      {/* Lado Direito: Drawer Toggle & Exportação */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleRightDrawer}
          className={`xl:hidden p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs ${
            isRightDrawerOpen
              ? 'bg-amber-400 text-zinc-950 border-amber-300 font-bold'
              : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
          }`}
          title={systemMode === 'ultra' ? 'Ver Camadas 3D' : 'Ver Resumo de Cores'}
        >
          {systemMode === 'ultra' ? <Box className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          <span className="hidden md:inline font-mono text-[11px] text-amber-400">
            {systemMode === 'ultra' ? (grid3D?.totalBeads ?? 0) : (grid?.totalBeads ?? 0)}
          </span>
        </button>

        {/* Botão de Salvar Projeto na Nuvem */}
        {onSave && (
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 hidden sm:flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Salvo!
              </span>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">{currentId ? 'Salvar' : 'Salvar na Nuvem'}</span>
            </button>
          </div>
        )}

        {/* Botão de Publicar na Galeria Pública */}
        {currentId && (
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-750 text-amber-400 hover:text-amber-300 border border-zinc-700 font-bold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-md transition-all active:scale-95"
            title="Publicar na Galeria Pública"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Publicar</span>
          </button>
        )}

        {/* Pílula de Créditos de IA 3D */}
        <button
          type="button"
          onClick={() => setIsCreditsModalOpen(true)}
          className="bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
          title="Clique para recarregar créditos de IA 3D"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{userCredits !== null ? `${userCredits}` : 'IA'}</span>
          <span className="hidden md:inline text-[11px] font-normal text-amber-200/80">créditos</span>
          <span className="hidden sm:inline text-[9px] bg-amber-400 text-zinc-950 px-1 py-0.2 rounded font-extrabold">+</span>
        </button>

        {/* Seletor de Idioma */}
        <LanguageSwitcher />

        {/* Menu Dropdown de Exportação */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExportingPdf}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Molde</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1.5 w-60 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 animate-scale-in text-xs font-sans">
              <button
                onClick={handleExportPdf}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="font-semibold block">PDF Vetorial de Impressão</span>
                  <span className="text-[10px] text-zinc-400">Escala 1:1 pronta para montagem</span>
                </div>
              </button>

              <button
                onClick={handleExportPng}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 text-left transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="font-semibold block">Imagem PNG em Alta Resolução</span>
                  <span className="text-[10px] text-zinc-400">Com grade e códigos das cores</span>
                </div>
              </button>

              <button
                onClick={handleExportCsv}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 text-left transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold block">Lista de Materiais (CSV)</span>
                  <span className="text-[10px] text-zinc-400">Contagem de peças para compras</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {currentId && (
        <PublishPatternModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          projectId={currentId}
          defaultTitle={projectName}
          beadCount={grid?.totalBeads}
          colorCount={summary?.length}
        />
      )}

      {/* Modal de Recarga de Créditos de IA 3D */}
      <CreditPurchaseModal
        isOpen={isCreditsModalOpen}
        onClose={() => {
          setIsCreditsModalOpen(false);
          getUserAiCredits().then((c) => setUserCredits(c)).catch(() => {});
        }}
        currentCredits={userCredits ?? 0}
      />
    </header>
  );
}
