'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { UltraSidebar } from '@/components/ultra/UltraSidebar';
import { LayerNavigator } from '@/components/ultra/LayerNavigator';
import { AssemblyGuide } from '@/components/ultra/AssemblyGuide';
import { MultipartColorManager } from '@/components/ultra/MultipartColorManager';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useEditorStore } from '@/store/editor-store';
import { PALETTES } from '@/data/palettes';
import { VoxelEngine } from '@/core/voxel/voxelizer';
import { getProjectById, saveProjectAction } from '@/app/actions/projects';
import { Save, Loader2, CheckCircle2, Box } from 'lucide-react';

const Viewport3D = dynamic(
  () => import('@/components/ultra/Viewport3D').then((mod) => mod.Viewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 h-full w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-zinc-400">Carregando Estúdio 3D Ultra...</span>
      </div>
    ),
  }
);

function Ultra3DContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const {
    setGrid3D,
    setProjectName,
    projectName,
    grid3D,
    paletteId,
    setSystemMode,
    isLeftDrawerOpen,
    isRightDrawerOpen,
    isLeftSidebarCollapsed,
    isRightSidebarCollapsed,
    toggleLeftSidebar,
    toggleRightSidebar,
    closeDrawers,
  } = useEditorStore();

  const [isSaving, startSave] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [currentId, setCurrentId] = useState<string | undefined>(projectId || undefined);

  useEffect(() => {
    setSystemMode('ultra');
  }, [setSystemMode]);

  // Load project if present
  useEffect(() => {
    if (!projectId) return;

    getProjectById(projectId)
      .then((proj) => {
        if (proj && proj.data) {
          setProjectName(proj.name);
          const data = proj.data as any;
          if (data.grid3D) setGrid3D(data.grid3D);
          setCurrentId(proj.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load 3D project:', err);
      });
  }, [projectId, setGrid3D, setProjectName]);

  // Default demo 3D model initialization
  useEffect(() => {
    if (grid3D || projectId) return;

    setProjectName('Escultura 3D Voxel');

    const palette = PALETTES['mini-26mm-120'].colors;
    const engine = new VoxelEngine(palette);
    const raw3D: Array<{ x: number; y: number; z: number; rgb: { r: number; g: number; b: number } }> = [];

    for (let z = 0; z < 8; z++) {
      const layerScale = 1 - Math.abs(z - 3.5) * 0.12;
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          const nx = (x - 12) / (6 * layerScale);
          const ny = (y - 12 + 1) / (6 * layerScale);
          const a = nx * nx + ny * ny - 1;
          const heart = a * a * a - nx * nx * ny * ny * ny;

          if (heart <= 0) {
            raw3D.push({
              x,
              y,
              z,
              rgb: heart <= -0.2 ? { r: 230, g: 30, b: 50 } : { r: 25, g: 25, b: 30 },
            });
          }
        }
      }
    }

    const grid = engine.buildFromRawVoxels(raw3D, 24, 24, 8, {
      fillMode: 'solid',
      wallThickness: 1,
      pitchMm: 2.6,
    });
    setGrid3D(grid);
  }, [grid3D, projectId, setGrid3D, setProjectName]);

  const handleSave = () => {
    if (!grid3D) return;

    startSave(async () => {
      try {
        const res = await saveProjectAction({
          id: currentId,
          name: projectName,
          mode: 'ultra',
          projectData: { grid3D, paletteId },
        });
        if (res.id) setCurrentId(res.id);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar projeto 3D.');
        setSaveStatus('error');
      }
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full overflow-hidden bg-zinc-950 font-sans select-none">
      <Header onSave={handleSave} isSaving={isSaving} saveStatus={saveStatus} currentId={currentId} />

      {/* Área Central de Trabalho 3D com Expansão de Tela */}
      <div className="relative flex flex-1 overflow-hidden w-full max-w-full">
        {/* Painel Esquerdo com Suporte a Colapso Suave */}
        <div
          className={`hidden xl:flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative ${
            isLeftSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-80 max-w-80'
          }`}
        >
          <UltraSidebar />
        </div>

        {/* Botão Flutuante de Toggle do Painel Esquerdo */}
        <button
          type="button"
          onClick={toggleLeftSidebar}
          title={isLeftSidebarCollapsed ? 'Expandir Painel do Modelo 3D' : 'Recolher Painel do Modelo 3D'}
          className={`hidden xl:flex absolute top-1/2 -translate-y-1/2 z-30 w-5 h-12 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 border border-zinc-700/80 rounded-r-md items-center justify-center shadow-lg transition-all duration-300 ${
            isLeftSidebarCollapsed ? 'left-0' : 'left-80'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isLeftSidebarCollapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Gaveta Esquerda Mobile */}
        {isLeftDrawerOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeDrawers}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-zinc-900 z-10 shadow-2xl animate-scale-in flex flex-col">
              <UltraSidebar isDrawer onClose={closeDrawers} />
            </div>
          </div>
        )}

        {/* Viewport 3D (Expande para 100% da tela) */}
        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0 max-w-full pb-14 xl:pb-0 relative">
          <Viewport3D />
        </div>

        {/* Botão Flutuante de Toggle do Painel Direito */}
        <button
          type="button"
          onClick={toggleRightSidebar}
          title={isRightSidebarCollapsed ? 'Expandir Camadas 3D' : 'Recolher Camadas 3D'}
          className={`hidden xl:flex absolute top-1/2 -translate-y-1/2 z-30 w-5 h-12 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 border border-zinc-700/80 rounded-l-md items-center justify-center shadow-lg transition-all duration-300 ${
            isRightSidebarCollapsed ? 'right-0' : 'right-80'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isRightSidebarCollapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Painel Direito com Suporte a Colapso Suave */}
        <div
          className={`hidden xl:flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative ${
            isRightSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-80 max-w-80'
          }`}
        >
          <LayerNavigator />
        </div>

        {/* Gaveta Direita Mobile */}
        {isRightDrawerOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeDrawers}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-zinc-900 z-10 shadow-2xl animate-scale-in flex flex-col">
              <LayerNavigator isDrawer onClose={closeDrawers} />
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
      <AssemblyGuide />
      <MultipartColorManager />
    </div>
  );
}

export default function Ultra3DPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 h-full w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Carregando Estúdio Ultra 3D...</span>
        </div>
      }
    >
      <Ultra3DContent />
    </Suspense>
  );
}

