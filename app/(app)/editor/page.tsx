'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/Canvas';
import { ColorSummaryPanel } from '@/components/ColorSummaryPanel';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useEditorStore } from '@/store/editor-store';
import { PALETTES } from '@/data/palettes';
import { PaletteMatcher } from '@/core/color/palette-matcher';
import { applyDithering } from '@/core/color/dithering';
import { buildGridMatrix } from '@/core/grid/grid-builder';
import { getProjectById, saveProjectAction } from '@/app/actions/projects';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';

function Editor2DContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const {
    setGrid,
    setProjectName,
    projectName,
    grid,
    paletteId,
    setSystemMode,
    isLeftDrawerOpen,
    isRightDrawerOpen,
    closeDrawers,
  } = useEditorStore();

  const [isSaving, startSave] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [currentId, setCurrentId] = useState<string | undefined>(projectId || undefined);

  useEffect(() => {
    setSystemMode('2d');
  }, [setSystemMode]);

  // Load project if ID present in searchParams
  useEffect(() => {
    if (!projectId) return;

    getProjectById(projectId)
      .then((proj) => {
        if (proj && proj.data) {
          setProjectName(proj.name);
          const data = proj.data as any;
          if (data.grid) setGrid(data.grid);
          setCurrentId(proj.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load project:', err);
      });
  }, [projectId, setGrid, setProjectName]);

  // Default demo grid initialization
  useEffect(() => {
    if (grid || projectId) return;

    setProjectName('Novo Molde 2D');

    const palette = PALETTES['mini-26mm-120'].colors;
    const matcher = new PaletteMatcher(palette);

    const mockW = 50;
    const mockH = 50;
    const pixels = Buffer.alloc(mockW * mockH * 3, 255);

    for (let y = 0; y < mockH; y++) {
      for (let x = 0; x < mockW; x++) {
        const nx = (x - mockW / 2) / 12;
        const ny = (y - mockH / 2 + 2) / 12;
        const a = nx * nx + ny * ny - 1;
        const heart = a * a * a - nx * nx * ny * ny * ny;
        const idx = (y * mockW + x) * 3;

        if (heart <= -0.15) {
          pixels[idx] = 224;
          pixels[idx + 1] = 32;
          pixels[idx + 2] = 40;
        } else if (heart <= 0.05) {
          pixels[idx] = 18;
          pixels[idx + 1] = 20;
          pixels[idx + 2] = 23;
        }
      }
    }

    const beadGrid = applyDithering(pixels, mockW, mockH, matcher, 'none');
    const initialGrid = buildGridMatrix(beadGrid, mockW, mockH, { pegboardSize: 50 });
    setGrid(initialGrid);
  }, [grid, projectId, setGrid, setProjectName]);

  const handleSave = () => {
    if (!grid) return;

    startSave(async () => {
      try {
        const res = await saveProjectAction({
          id: currentId,
          name: projectName,
          mode: '2d',
          projectData: { grid, paletteId },
        });
        if (res.id) setCurrentId(res.id);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar projeto.');
        setSaveStatus('error');
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full overflow-hidden bg-zinc-950 font-sans select-none">
      {/* Sub Header com Ações de Salvamento */}
      <div className="h-10 bg-zinc-900/90 border-b border-zinc-800 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">Editor 2D:</span>
          <span className="text-zinc-400 truncate max-w-xs">{projectName}</span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo na Nuvem!
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition text-xs shadow disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{currentId ? 'Salvar Alterações' : 'Salvar Projeto'}</span>
          </button>
        </div>
      </div>

      <Header />

      {/* Área Central de Trabalho */}
      <div className="relative flex flex-1 overflow-hidden w-full max-w-full">
        {/* Painel Esquerdo Fixo no Desktop */}
        <div className="hidden xl:block h-full shrink-0 w-80 max-w-80 overflow-hidden">
          <Sidebar />
        </div>

        {/* Gaveta Esquerda Mobile */}
        {isLeftDrawerOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeDrawers}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-zinc-900 z-10 shadow-2xl animate-scale-in flex flex-col">
              <Sidebar isDrawer onClose={closeDrawers} />
            </div>
          </div>
        )}

        {/* Canvas 2D */}
        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0 max-w-full pb-14 xl:pb-0">
          <Toolbar />
          <Canvas />
        </div>

        {/* Painel Direito Fixo */}
        <div className="hidden xl:block h-full shrink-0 w-80 max-w-80 overflow-hidden">
          <ColorSummaryPanel />
        </div>

        {/* Gaveta Direita Mobile */}
        {isRightDrawerOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeDrawers}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-zinc-900 z-10 shadow-2xl animate-scale-in flex flex-col">
              <ColorSummaryPanel isDrawer onClose={closeDrawers} />
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default function Editor2DPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 h-full w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Carregando Editor 2D...</span>
        </div>
      }
    >
      <Editor2DContent />
    </Suspense>
  );
}

