'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { useEditorStore } from '@/store/editor-store';
import { BeadRenderer3D } from './BeadRenderer3D';
import { SupportRods3D } from './SupportRods3D';
import { LayerCanvas2D } from './LayerCanvas2D';
import {
  Layers,
  Sparkles,
  Eye,
  Sliders,
  Paintbrush,
  Eraser,
  Box,
  LayoutGrid,
  PaintBucket,
  Pipette,
  ChevronDown,
} from 'lucide-react';

function PedestalStandHelper({
  width,
  height,
  depth,
  pitch,
  explodedSpacing,
}: {
  width: number;
  height: number;
  depth: number;
  pitch: number;
  explodedSpacing: number;
}) {
  const sizeX = width * pitch;
  const totalDepth = depth * (pitch + explodedSpacing);
  const radius = Math.max(sizeX, totalDepth) * 0.58;
  const posY = -(height * pitch) / 2 - pitch * 0.5;

  return (
    <group position={[0, posY, 0]}>
      {/* Pedestal Circular Translúcido com Acabamento Premium (Estilo Beads3D) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius + 3, 2.5, 48]} />
        <meshStandardMaterial
          color="#27272A"
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Anel de Realce Âmbar / Dourado */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.3, 0]}>
        <ringGeometry args={[radius - 1.5, radius, 48]} />
        <meshBasicMaterial color="#FACC15" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export function Viewport3D() {
  const {
    grid3D,
    activeLayerZ,
    showAllLayers3D,
    setShowAllLayers3D,
    explodedSpacing,
    setExplodedSpacing,
    onionSkinEnabled,
    setOnionSkinEnabled,
    active3DTool,
    set3DTool,
    setIsAssemblyGuideOpen,
    highlightBeadCode,
    activeTool,
    setActiveTool,
    selectedBead,
    setSelectedBead,
    activePalette,
  } = useEditorStore();

  const [centerViewMode, setCenterViewMode] = useState<'3d' | '2d_layer'>('3d');
  const [layer2dViewMode, setLayer2dViewMode] = useState<'pattern' | 'assembly'>('pattern');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const currentLayer = grid3D ? grid3D.layers[activeLayerZ] || grid3D.layers[0] : null;

  return (
    <div className="relative flex-1 h-full w-full bg-zinc-950 overflow-hidden select-none">
      {/* Visualização Central: Ou Viewport 3D ou Molde 2D da Camada */}
      {centerViewMode === '3d' ? (
        <Canvas
          shadows
          frameloop="demand"
          camera={{ position: [0, 8, 85], fov: 38 }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[40, 60, 80]} intensity={1.3} castShadow />
          <directionalLight position={[-40, -30, -50]} intensity={0.4} />
          <pointLight position={[0, 20, 60]} intensity={0.4} />

          <Suspense fallback={null}>
            <Center top={false}>
              {grid3D && (
                <>
                  <BeadRenderer3D grid3D={grid3D} />
                  <SupportRods3D grid3D={grid3D} explodedSpacing={explodedSpacing} />
                  <PedestalStandHelper
                    width={grid3D.width}
                    height={grid3D.height}
                    depth={grid3D.layers.length}
                    pitch={grid3D.pitchMm || 2.6}
                    explodedSpacing={explodedSpacing}
                  />
                </>
              )}
            </Center>
          </Suspense>

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={8}
            maxDistance={250}
          />
        </Canvas>
      ) : currentLayer ? (
        <div className="w-full h-full relative">
          <LayerCanvas2D
            grid={currentLayer.grid}
            highlightBeadCode={highlightBeadCode}
            viewMode={layer2dViewMode}
          />
        </div>
      ) : null}

      {/* Barra de Ferramentas Flutuante Superior */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-2xl z-10 text-xs">
        {/* Alternador de Modo: 3D Global vs Molde 2D da Camada */}
        <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 shrink-0">
          <button
            onClick={() => setCenterViewMode('3d')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
              centerViewMode === '3d'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Vista 3D</span>
          </button>

          <button
            onClick={() => setCenterViewMode('2d_layer')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
              centerViewMode === '2d_layer'
                ? 'bg-amber-400 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Molde 2D (Z{activeLayerZ + 1})</span>
          </button>
        </div>

        {centerViewMode === '3d' ? (
          <>
            {/* Ferramentas de Edição 3D */}
            <div className="flex items-center gap-1 px-2 border-x border-zinc-800">
              <button
                onClick={() => set3DTool('paint')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  active3DTool === 'paint'
                    ? 'bg-amber-400 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Pincel 3D - Pintar bead com a cor selecionada"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pintar</span>
              </button>

              <button
                onClick={() => set3DTool('remove')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  active3DTool === 'remove'
                    ? 'bg-amber-400 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Borracha 3D - Apagar bead clicado"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Apagar</span>
              </button>
            </div>

            {/* Controles de Visualização 3D */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAllLayers3D(!showAllLayers3D)}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                  showAllLayers3D
                    ? 'bg-zinc-800 text-amber-400 border border-amber-400/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title={showAllLayers3D ? 'Mostrando todas as camadas' : 'Isolando camada ativa'}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {showAllLayers3D ? 'Todas Camadas' : `Camada ${activeLayerZ + 1}`}
                </span>
              </button>

              <button
                onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                  onionSkinEnabled
                    ? 'bg-zinc-800 text-cyan-400 border border-cyan-400/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Onion Skinning - Mostrar ghost azul/verde das camadas adjacentes"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Onion Skin</span>
              </button>
            </div>

            {/* Slider de Exploded View */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
              <span className="text-[11px] text-zinc-400 hidden lg:inline">Explosão:</span>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={explodedSpacing}
                onChange={(e) => setExplodedSpacing(Number(e.target.value))}
                className="w-16 sm:w-20 accent-amber-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                title="Separar camadas verticalmente em milímetros"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                {explodedSpacing}mm
              </span>
            </div>

            {/* Modo Tela Cheia / Zen Mode */}
            <div className="pl-1 border-l border-zinc-800">
              <button
                type="button"
                onClick={useEditorStore.getState().toggleZenMode}
                title={useEditorStore.getState().isZenMode ? "Restaurar Painéis (F)" : "Modo 3D em Tela Cheia (F)"}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition ${
                  useEditorStore.getState().isZenMode
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-sm'
                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-700/60'
                }`}
              >
                <span className="text-[11px]">
                  {useEditorStore.getState().isZenMode ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Controles e Ferramentas Completas de Pintura 2D da Camada */
          <>
            {/* Ferramentas de Pintura 2D */}
            <div className="flex items-center gap-1 px-2 border-x border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTool('brush')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTool === 'brush'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Pincel (B) — Pintar célula com a cor selecionada"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pincel</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('bucket')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTool === 'bucket'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Balde de Tinta (G) — Preencher área conectada"
              >
                <PaintBucket className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Balde</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('dropper')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTool === 'dropper'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Conta-Gotas (I) — Copiar cor da célula clicada"
              >
                <Pipette className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Conta-Gotas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTool === 'eraser'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title="Borracha (E) — Apagar bead da camada"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Borracha</span>
              </button>
            </div>

            {/* Amostra e Seletor de Cor Ativa com Popover */}
            {selectedBead && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 border border-zinc-700/80 transition-colors"
                  title="Clique para escolher outra cor da paleta"
                >
                  <div
                    className="w-4 h-4 rounded-sm border border-zinc-600 shadow-sm shrink-0"
                    style={{ backgroundColor: selectedBead.hex }}
                  />
                  <span className="font-mono font-bold text-amber-400 text-[11px]">
                    {selectedBead.code}
                  </span>
                  <span className="text-zinc-300 text-[11px] max-w-[80px] sm:max-w-[110px] truncate hidden md:inline">
                    {selectedBead.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
                </button>

                {/* Popover da Paleta de Cores Completa */}
                {isPaletteOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 max-h-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 z-50 overflow-y-auto animate-scale-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                        Paleta de Cores ({activePalette.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPaletteOpen(false)}
                        className="text-zinc-400 hover:text-white p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {activePalette.map((b) => {
                        const isSelected = selectedBead?.code === b.code;
                        return (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => {
                              setSelectedBead(b);
                              setIsPaletteOpen(false);
                            }}
                            className={`group relative aspect-square rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 z-10'
                                : 'border-zinc-700/80 hover:border-zinc-400 hover:scale-105'
                            }`}
                            style={{ backgroundColor: b.hex }}
                            title={`${b.name} [${b.code}]`}
                          >
                            <span
                              className="text-[8px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                color:
                                  (b.rgb.r * 299 + b.rgb.g * 587 + b.rgb.b * 114) / 1000 >= 140
                                    ? '#000000'
                                    : '#ffffff',
                              }}
                            >
                              {b.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alternador de Modo de Visualização 2D */}
            <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
              <button
                type="button"
                onClick={() => setLayer2dViewMode('pattern')}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                  layer2dViewMode === 'pattern'
                    ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Modo Molde — Exibir códigos de letras/números nos beads"
              >
                Códigos
              </button>
              <button
                type="button"
                onClick={() => setLayer2dViewMode('assembly')}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                  layer2dViewMode === 'assembly'
                    ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Modo Arte — Exibir cores sólidas com relevo cilíndrico"
              >
                Pixel Art
              </button>
            </div>

            {/* Modo Tela Cheia / Zen Mode */}
            <div className="pl-1 border-l border-zinc-800">
              <button
                type="button"
                onClick={useEditorStore.getState().toggleZenMode}
                title={useEditorStore.getState().isZenMode ? "Restaurar Painéis (F)" : "Modo em Tela Cheia (F)"}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition ${
                  useEditorStore.getState().isZenMode
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-sm'
                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-700/60'
                }`}
              >
                <span className="text-[11px]">
                  {useEditorStore.getState().isZenMode ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Barra Flutuante Inferior: Expansão de Camadas (Estilo Beads3D) */}
      {centerViewMode === '3d' && grid3D && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-zinc-300">Expansão de Camadas:</span>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={explodedSpacing}
              onChange={(e) => setExplodedSpacing(Number(e.target.value))}
              className="w-32 sm:w-48 accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              title="Afastar camadas para visualização explodida / lateral"
            />
            <span className="font-mono font-bold text-amber-400 text-xs w-8 text-right">
              {explodedSpacing}mm
            </span>
          </div>
        </div>
      )}

      {/* Botão de Iniciar Montagem Passo-a-Passo */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => setIsAssemblyGuideOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xl transition-all active:scale-95 text-xs ring-2 ring-amber-400/30"
        >
          <Layers className="w-4 h-4" />
          <span>Guia de Montagem 3D</span>
        </button>
      </div>

      {/* Mensagem informativa de estado vazio */}
      {(!grid3D || grid3D.totalBeads === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl max-w-md shadow-2xl">
            <Layers className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-bold text-zinc-100 mb-1">
              BeadForge Ultra — Estúdio 3D
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Importe um modelo 3D (<strong>.VOX</strong>, <strong>.3MF</strong>, <strong>.ZIP</strong>, <strong>.STL</strong>, <strong>.GLB</strong>) no painel esquerdo para gerar moldes de montagem camada por camada.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
