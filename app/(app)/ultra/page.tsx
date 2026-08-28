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

    const initial3D = engine.buildFromRawVoxels(raw3D, 24, 24, 8, {
      fillMode: 'hollow',
      wallThickness: 1,
      pitchMm: 2.6,
    });
    setGrid3D(initial3D);
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
      {/* Sub Header */}
      <div className="h-10 bg-zinc-900/90 border-b border-zinc-800 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-zinc-300">Ultra 3D:</span>
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
            <span>{currentId ? 'Salvar Alterações' : 'Salvar Projeto 3D'}</span>
          </button>
        </div>
      </div>

      <Header />

      {/* Área Central de Trabalho */}
      <div className="relative flex flex-1 overflow-hidden w-full max-w-full">
        {/* Painel Esquerdo Fixo */}
        <div className="hidden xl:block h-full shrink-0 w-80 max-w-80 overflow-hidden">
          <UltraSidebar />
        </div>

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

        {/* Viewport 3D */}
        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0 max-w-full pb-14 xl:pb-0">
          <Viewport3D />
        </div>

        {/* Painel Direito Fixo */}
        <div className="hidden xl:block h-full shrink-0 w-80 max-w-80 overflow-hidden">
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

