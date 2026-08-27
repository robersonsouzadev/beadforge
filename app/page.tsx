'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/Canvas';
import { ColorSummaryPanel } from '@/components/ColorSummaryPanel';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { UltraSidebar } from '@/components/ultra/UltraSidebar';
import { LayerNavigator } from '@/components/ultra/LayerNavigator';
import { AssemblyGuide } from '@/components/ultra/AssemblyGuide';
import { MultipartColorManager } from '@/components/ultra/MultipartColorManager';
import { useEditorStore } from '@/store/editor-store';
import { PALETTES } from '@/data/palettes';
import { PaletteMatcher } from '@/core/color/palette-matcher';
import { applyDithering } from '@/core/color/dithering';
import { buildGridMatrix } from '@/core/grid/grid-builder';
import { VoxelEngine } from '@/core/voxel/voxelizer';

// Lazy loading do Viewport 3D para otimização do bundle WebGL
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

export default function EditorPage() {
  const {
    setGrid,
    setProjectName,
    grid,
    systemMode,
    grid3D,
    setGrid3D,
    isLeftDrawerOpen,
    isRightDrawerOpen,
    closeDrawers,
  } = useEditorStore();

  useEffect(() => {
    if (grid) return;

    setProjectName('Novo Projeto Bead Art');

    // Inicializa uma matriz 2D de demonstração 50x50 (Placa 14.5x14.5cm 2.6mm)
    const palette = PALETTES['mini-26mm-120'].colors;
    const matcher = new PaletteMatcher(palette);

    const mockW = 50;
    const mockH = 50;
    const pixels = Buffer.alloc(mockW * mockH * 3, 255); // branco

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

    // Inicializa modelo de demonstração 3D empilhado (Coração Voxel 3D com 8 camadas)
    if (!grid3D) {
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
    }
  }, [grid, grid3D, setGrid, setGrid3D, setProjectName]);

  return (
    <div className="flex flex-col h-dvh min-h-dvh w-full overflow-hidden bg-zinc-950 font-sans select-none">
      {/* Header Superior com Seletor 2D / Ultra 3D */}
      <Header />

      {/* Área Central de Trabalho */}
      <div className="relative flex flex-1 overflow-hidden w-full max-w-full">
        {/* Painel Esquerdo Fixo no Desktop (>= 1280px / xl) */}
        <div className="hidden xl:block h-full shrink-0 w-80 max-w-80 overflow-hidden">
          {systemMode === 'ultra' ? <UltraSidebar /> : <Sidebar />}
        </div>

        {/* Gaveta Esquerda (Slide-over Drawer) para Tablet e Mobile (< 1280px) */}
        {isLeftDrawerOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeDrawers}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-zinc-900 z-10 shadow-2xl animate-scale-in flex flex-col">
              {systemMode === 'ultra' ? (
                <UltraSidebar isDrawer onClose={closeDrawers} />
              ) : (
                <Sidebar isDrawer onClose={closeDrawers} />
              )}
            </div>
          </div>
        )}

        {/* Área Central de Visualização (Canvas 2D ou Viewport 3D) */}
        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0 max-w-full pb-14 xl:pb-0">
          {systemMode === 'ultra' ? (
            <Viewport3D />
          ) : (
            <>
              <Toolbar />
              <Canvas />
            </>
          )}
        </div>

        {/* Painel Direito Fixo no Desktop (>= 1280px / xl) */}
        <div className="hidden xl:block h-full shrink-0 w-80 max-w-80 overflow-hidden">
          {systemMode === 'ultra' ? <LayerNavigator /> : <ColorSummaryPanel />}
        </div>

        {/* Gaveta Direita (Slide-over Drawer) para Tablet e Mobile (< 1280px) */}
        {isRightDrawerOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeDrawers}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-zinc-900 z-10 shadow-2xl animate-scale-in flex flex-col">
              {systemMode === 'ultra' ? (
                <LayerNavigator isDrawer onClose={closeDrawers} />
              ) : (
                <ColorSummaryPanel isDrawer onClose={closeDrawers} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Navegação Inferior para Mobile e Tablet (< 1280px) */}
      <MobileBottomNav />

      {/* Modal Interativo do Guia de Montagem Step-by-Step */}
      <AssemblyGuide />

      {/* Modal do Gerenciador de Partes & Cores para Modelos Multipartes (.ZIP / Múltiplos STLs) */}
      <MultipartColorManager />
    </div>
  );
}
