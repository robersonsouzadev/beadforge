import { create } from 'zustand';
import type { GridMatrix, GridCell } from '@/core/schemas/grid';
import type { BeadColor } from '@/core/schemas/palette';
import type { BeadSummary } from '@/core/schemas/project';
import type { VoxelGrid3D, VoxelLayer, VoxelToolMode, FillMode } from '@/core/voxel/voxel-types';
import type { MultipartItem } from '@/core/voxel/multipart-loader';
import { PALETTES } from '@/data/palettes';
import {
  calculateMultiBoardConfig,
  MultiBoardCalculation,
} from '@/core/pegboards/manager';
import {
  setCellBead,
  eraseCell,
  floodFill,
  batchReplaceBead,
  flipGridHorizontal,
  flipGridVertical,
  rotateGrid90,
  clearAllGrid,
} from '@/core/grid/grid-editor';
import { buildBeadSummary } from '@/core/grid/summary-builder';
import { VoxelEngine } from '@/core/voxel/voxelizer';

export type ToolType = 'brush' | 'bucket' | 'dropper' | 'eraser';
export type ViewMode = 'assembly' | 'pattern'; // Modo Montagem (Pixel Art) vs Modo Impressão (Molde com Códigos)
export type SystemMode = '2d' | 'ultra'; // BeadForge Classic 2D vs BeadForge Ultra 3D

interface EditorState {
  // Modo de Operação do Sistema
  systemMode: SystemMode;
  setSystemMode: (mode: SystemMode) => void;

  // Imagem (Modo 2D)
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageBase64: string | null;

  // Projeto & Grid 2D
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  projectName: string;
  grid: GridMatrix | null;
  summary: BeadSummary[];
  gridWidth: number;
  gridHeight: number;

  // Sistema de Placas & Multiplicação
  selectedPegboardTemplateId: string;
  boardsHorizontal: number;
  boardsVertical: number;
  multiBoardConfig: MultiBoardCalculation;

  // Modo de Visualização & Auxiliares
  viewMode: ViewMode;
  showPlateDivisions: boolean;
  showGridNumbers: boolean;

  // Paleta & Ferramentas
  paletteId: string;
  activePalette: BeadColor[];
  selectedBead: BeadColor | null;
  highlightBeadCode: string | null;
  activeTool: ToolType;

  // Ajustes de Enquadramento e Escala 2D
  scale: number;
  offsetX: number;
  offsetY: number;
  bgTolerance: number;

  // Ajustes de Cor e Processamento 2D
  conversionPreset: 'custom' | 'pixel-art' | 'portrait' | 'easy-build' | 'high-fidelity';
  applyConversionPreset: (preset: 'pixel-art' | 'portrait' | 'easy-build' | 'high-fidelity') => void;
  ditherMode: 'none' | 'floyd-steinberg' | 'atkinson';
  contrast: number;
  saturation: number;
  brightness: number;
  removeBackground: boolean;
  isProcessing: boolean;

  // Filtro de Cores Possuídas / Minhas Cores da Gaveta
  enabledBeadCodes: Record<string, boolean> | null;
  isPaletteFilterModalOpen: boolean;
  setIsPaletteFilterModalOpen: (open: boolean) => void;
  toggleBeadCodeEnabled: (code: string) => void;
  enableAllBeadCodes: () => void;
  disableAllBeadCodes: () => void;
  setEnabledBeadCodes: (codes: string[]) => void;

  // Imagem de Referência / Modo Calque (Overlay Tracing)
  referenceImageUrl: string | null;
  referenceOpacity: number;
  isReferenceOverlayActive: boolean;
  isReferenceModalOpen: boolean;
  setIsReferenceModalOpen: (open: boolean) => void;
  setReferenceImage: (file: File | null, url: string | null) => void;
  setReferenceOpacity: (opacity: number) => void;
  toggleReferenceOverlay: () => void;

  // Ferramentas de Transformação da Grade
  flipHorizontal: () => void;
  flipVertical: () => void;
  rotate90: () => void;
  clearGrid: () => void;

  // Visualização Canvas 2D
  zoom: number;
  pan: { x: number; y: number };
  hoveredCell: { row: number; col: number; cell: GridCell } | null;

  // Histórico 2D
  history: GridMatrix[];
  historyIndex: number;

  // Responsividade, Gavetas & Colapso de Painéis (Workspace Expandido)
  isLeftDrawerOpen: boolean;
  isRightDrawerOpen: boolean;
  isLeftSidebarCollapsed: boolean;
  isRightSidebarCollapsed: boolean;
  isZenMode: boolean;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  closeDrawers: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleZenMode: () => void;
  // Crafting Tracker (Assistente de Montagem Bead-a-Bead)
  isCraftingMode: boolean;
  placedBeads: Record<string, boolean>;
  toggleCraftingMode: () => void;
  togglePlacedBead: (row: number, col: number) => void;
  resetPlacedBeads: () => void;

  // --- MÓDULO BEADFORGE ULTRA 3D (Camadas & Voxels) ---
  grid3D: VoxelGrid3D | null;
  activeLayerZ: number;
  active3DTool: VoxelToolMode;
  fillMode: FillMode;
  wallThickness: number;
  explodedSpacing: number; // Separação vertical entre camadas (0 a 30 mm)
  onionSkinEnabled: boolean;
  showAllLayers3D: boolean;
  model3DFileName: string | null;
  isAssemblyGuideOpen: boolean;
  isImageTo3DModalOpen: boolean;

  // Suporte a Modelos Multipartes (.ZIP / Múltiplos STLs)
  multipartItems: MultipartItem[];
  isMultipartModalOpen: boolean;

  // Ações do Módulo 3D
  setGrid3D: (grid3D: VoxelGrid3D) => void;
  setActiveLayerZ: (z: number) => void;
  toggleLayerVisibility: (z: number) => void;
  toggleLayerLock: (z: number) => void;
  setExplodedSpacing: (spacing: number) => void;
  setOnionSkinEnabled: (val: boolean) => void;
  setShowAllLayers3D: (val: boolean) => void;
  setFillMode: (mode: FillMode) => void;
  setWallThickness: (val: number) => void;
  set3DTool: (tool: VoxelToolMode) => void;
  setModel3DFileName: (name: string | null) => void;
  setIsAssemblyGuideOpen: (open: boolean) => void;
  setIsImageTo3DModalOpen: (open: boolean) => void;
  setMultipartItems: (items: MultipartItem[]) => void;
  updatePartColor: (partId: string, bead: BeadColor) => void;
  togglePartVisibility: (partId: string) => void;
  setIsMultipartModalOpen: (open: boolean) => void;

  // Edição 3D
  paintVoxel3D: (x: number, y: number, z: number) => void;
  eraseVoxel3D: (x: number, y: number, z: number) => void;
  addLayer3D: () => void;
  duplicateLayer3D: (z: number) => void;
  deleteLayer3D: (z: number) => void;
  remap3DColor: (oldCodeOrHex: string, newBead: BeadColor) => void;

  // Ações 2D
  setProjectName: (name: string) => void;
  setImage: (file: File, previewUrl: string, base64: string) => void;
  setGrid: (grid: GridMatrix) => void;
  setDimensions: (width: number, height: number) => void;
  setPegboardTemplate: (templateId: string) => void;
  setBoardsMultipliers: (horizontal: number, vertical: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowPlateDivisions: (val: boolean) => void;
  setShowGridNumbers: (val: boolean) => void;
  setPaletteId: (id: string) => void;
  setSelectedBead: (bead: BeadColor | null) => void;
  setHighlightBeadCode: (code: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setScale: (scale: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  setBgTolerance: (tolerance: number) => void;
  setDitherMode: (mode: 'none' | 'floyd-steinberg' | 'atkinson') => void;
  setAdjustments: (contrast: number, saturation: number, brightness: number) => void;
  setRemoveBackground: (val: boolean) => void;
  setIsProcessing: (val: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setHoveredCell: (cellInfo: { row: number; col: number; cell: GridCell } | null) => void;

  // Ações de Edição Interativa 2D
  paintCell: (row: number, col: number) => void;
  eraseCellAt: (row: number, col: number) => void;
  bucketFillAt: (row: number, col: number) => void;
  replaceColorInGrid: (fromCode: string, toBead: BeadColor) => void;
  undo: () => void;
  redo: () => void;
}

const initialPaletteId = 'mini-26mm-120';
const initialPalette = PALETTES[initialPaletteId].colors;
const initialTemplateId = 'hama-mini-145'; // 14.5x14.5cm (57x57 pinos)
const initialConfig = calculateMultiBoardConfig(initialTemplateId, 1, 1);

export const useEditorStore = create<EditorState>((set, get) => ({
  systemMode: '2d',
  setSystemMode: (mode) => set({ systemMode: mode }),

  imageFile: null,
  imagePreviewUrl: null,
  imageBase64: null,

  isLeftDrawerOpen: false,
  isRightDrawerOpen: false,
  isLeftSidebarCollapsed: false,
  isRightSidebarCollapsed: false,
  isZenMode: false,
  toggleLeftDrawer: () => set((state) => ({ isLeftDrawerOpen: !state.isLeftDrawerOpen, isRightDrawerOpen: false })),
  toggleRightDrawer: () => set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen, isLeftDrawerOpen: false })),
  closeDrawers: () => set({ isLeftDrawerOpen: false, isRightDrawerOpen: false }),
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarCollapsed: !state.isLeftSidebarCollapsed })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarCollapsed: !state.isRightSidebarCollapsed })),
  toggleZenMode: () => set((state) => {
    const nextZen = !state.isZenMode;
    return {
      isZenMode: nextZen,
      isLeftSidebarCollapsed: nextZen,
      isRightSidebarCollapsed: nextZen,
    };
  }),

  // Crafting Tracker (Assistente de Montagem)
  isCraftingMode: false,
  placedBeads: {},
  toggleCraftingMode: () => set((state) => ({ isCraftingMode: !state.isCraftingMode })),
  togglePlacedBead: (row, col) =>
    set((state) => {
      const key = `${row},${col}`;
      const next = { ...state.placedBeads };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { placedBeads: next };
    }),
  resetPlacedBeads: () => set({ placedBeads: {} }),

  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  projectName: 'Novo Projeto Hama Beads',
  grid: null,
  summary: [],
  gridWidth: initialConfig.totalPinsHorizontal,
  gridHeight: initialConfig.totalPinsVertical,

  selectedPegboardTemplateId: initialTemplateId,
  boardsHorizontal: 1,
  boardsVertical: 1,
  multiBoardConfig: initialConfig,

  viewMode: 'pattern',
  showPlateDivisions: true,
  showGridNumbers: true,

  paletteId: initialPaletteId,
  activePalette: initialPalette,
  selectedBead: initialPalette[0] ?? null,
  highlightBeadCode: null,
  activeTool: 'brush',

  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  bgTolerance: 5.0,

  ditherMode: 'none',
  contrast: 0,
  saturation: 0,
  brightness: 0,
  removeBackground: true,
  isProcessing: false,

  zoom: 1.0,
  pan: { x: 0, y: 0 },
  hoveredCell: null,

  history: [],
  historyIndex: -1,

  // --- ESTADO INICIAL ULTRA 3D ---
  grid3D: null,
  activeLayerZ: 0,
  active3DTool: 'paint',
  fillMode: 'solid',
  wallThickness: 1,
  explodedSpacing: 0,
  onionSkinEnabled: false,
  showAllLayers3D: true,
  model3DFileName: null,
  isAssemblyGuideOpen: false,
  isImageTo3DModalOpen: false,

  // Multipart initial state
  multipartItems: [],
  isMultipartModalOpen: false,

  setIsImageTo3DModalOpen: (open) => set({ isImageTo3DModalOpen: open }),
  setMultipartItems: (items) => set({ multipartItems: items, isMultipartModalOpen: items.length > 0 }),
  updatePartColor: (partId, bead) =>
    set((state) => ({
      multipartItems: state.multipartItems.map((p) =>
        p.id === partId ? { ...p, assignedBead: bead } : p
      ),
    })),
  togglePartVisibility: (partId) =>
    set((state) => ({
      multipartItems: state.multipartItems.map((p) =>
        p.id === partId ? { ...p, isVisible: !p.isVisible } : p
      ),
    })),
  setIsMultipartModalOpen: (open) => set({ isMultipartModalOpen: open }),

  setGrid3D: (grid3D) => {
    set({
      grid3D,
      activeLayerZ: 0,
      gridWidth: grid3D.width,
      gridHeight: grid3D.height,
      // Sincroniza a camada 0 com o grid 2D atual para visualização imediata
      grid: grid3D.layers[0]?.grid || null,
      summary: grid3D.layers[0] ? buildBeadSummary(grid3D.layers[0].grid, 'count') : [],
    });
  },

  setActiveLayerZ: (z) => {
    const { grid3D } = get();
    if (!grid3D || z < 0 || z >= grid3D.layers.length) return;

    const layer = grid3D.layers[z];
    set({
      activeLayerZ: z,
      grid: layer.grid,
      summary: buildBeadSummary(layer.grid, 'count'),
    });
  },

  toggleLayerVisibility: (z) => {
    const { grid3D } = get();
    if (!grid3D || z < 0 || z >= grid3D.layers.length) return;

    const newLayers = [...grid3D.layers];
    newLayers[z] = {
      ...newLayers[z],
      isVisible: !newLayers[z].isVisible,
    };

    set({ grid3D: { ...grid3D, layers: newLayers } });
  },

  toggleLayerLock: (z) => {
    const { grid3D } = get();
    if (!grid3D || z < 0 || z >= grid3D.layers.length) return;

    const newLayers = [...grid3D.layers];
    newLayers[z] = {
      ...newLayers[z],
      isLocked: !newLayers[z].isLocked,
    };

    set({ grid3D: { ...grid3D, layers: newLayers } });
  },

  setExplodedSpacing: (spacing) => set({ explodedSpacing: Math.max(0, Math.min(30, spacing)) }),
  setOnionSkinEnabled: (val) => set({ onionSkinEnabled: val }),
  setShowAllLayers3D: (val) => set({ showAllLayers3D: val }),
  setFillMode: (fillMode) => set({ fillMode }),
  setWallThickness: (wallThickness) => set({ wallThickness }),
  set3DTool: (tool) => set({ active3DTool: tool }),
  setModel3DFileName: (name) => set({ model3DFileName: name }),
  setIsAssemblyGuideOpen: (open) => set({ isAssemblyGuideOpen: open }),

  paintVoxel3D: (x, y, z) => {
    const { grid3D, selectedBead, activeLayerZ } = get();
    if (!grid3D || !selectedBead) return;
    const targetZ = z !== undefined ? z : activeLayerZ;
    if (targetZ < 0 || targetZ >= grid3D.layers.length) return;

    const layer = grid3D.layers[targetZ];
    if (layer.isLocked) return;

    const newGrid = setCellBead(layer.grid, y, x, selectedBead);
    const newLayers = [...grid3D.layers];
    newLayers[targetZ] = {
      ...layer,
      grid: newGrid,
      beadCount: newGrid.totalBeads,
      isEmpty: newGrid.totalBeads === 0,
    };

    let grandTotal = 0;
    for (const l of newLayers) grandTotal += l.beadCount;

    const updatedGrid3D = { ...grid3D, layers: newLayers, totalBeads: grandTotal };

    set({
      grid3D: updatedGrid3D,
      grid: targetZ === activeLayerZ ? newGrid : get().grid,
      summary: targetZ === activeLayerZ ? buildBeadSummary(newGrid, 'count') : get().summary,
    });
  },

  eraseVoxel3D: (x, y, z) => {
    const { grid3D, activeLayerZ } = get();
    if (!grid3D) return;
    const targetZ = z !== undefined ? z : activeLayerZ;
    if (targetZ < 0 || targetZ >= grid3D.layers.length) return;

    const layer = grid3D.layers[targetZ];
    if (layer.isLocked) return;

    const newGrid = eraseCell(layer.grid, y, x);
    const newLayers = [...grid3D.layers];
    newLayers[targetZ] = {
      ...layer,
      grid: newGrid,
      beadCount: newGrid.totalBeads,
      isEmpty: newGrid.totalBeads === 0,
    };

    let grandTotal = 0;
    for (const l of newLayers) grandTotal += l.beadCount;

    const updatedGrid3D = { ...grid3D, layers: newLayers, totalBeads: grandTotal };

    set({
      grid3D: updatedGrid3D,
      grid: targetZ === activeLayerZ ? newGrid : get().grid,
      summary: targetZ === activeLayerZ ? buildBeadSummary(newGrid, 'count') : get().summary,
    });
  },

  addLayer3D: () => {
    const { grid3D } = get();
    if (!grid3D) return;

    const newZ = grid3D.layers.length;
    const pitchMm = grid3D.pitchMm || 2.6;
    const emptyGrid = VoxelEngine.createEmptyGrid(grid3D.width, grid3D.height, 1, pitchMm);
    const newLayer: VoxelLayer = {
      z: newZ,
      name: `Camada ${newZ + 1}`,
      heightMm: Number(((newZ + 1) * pitchMm).toFixed(1)),
      grid: emptyGrid.layers[0].grid,
      beadCount: 0,
      isEmpty: true,
      isVisible: true,
      isLocked: false,
    };

    const newLayers = [...grid3D.layers, newLayer];
    set({
      grid3D: {
        ...grid3D,
        depth: newLayers.length,
        totalLayers: newLayers.length,
        layers: newLayers,
      },
      activeLayerZ: newZ,
      grid: newLayer.grid,
      summary: [],
    });
  },

  duplicateLayer3D: (z) => {
    const { grid3D } = get();
    if (!grid3D || z < 0 || z >= grid3D.layers.length) return;

    const sourceLayer = grid3D.layers[z];
    const newZ = z + 1;
    const pitchMm = grid3D.pitchMm || 2.6;

    // Deep clone do grid da camada
    const clonedCells: GridCell[][] = sourceLayer.grid.cells.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
    const clonedGrid: GridMatrix = {
      ...sourceLayer.grid,
      cells: clonedCells,
    };

    const duplicatedLayer: VoxelLayer = {
      z: newZ,
      name: `Camada ${newZ + 1} (Cópia)`,
      heightMm: Number(((newZ + 1) * pitchMm).toFixed(1)),
      grid: clonedGrid,
      beadCount: sourceLayer.beadCount,
      isEmpty: sourceLayer.isEmpty,
      isVisible: true,
      isLocked: false,
    };

    const newLayers = [...grid3D.layers];
    newLayers.splice(newZ, 0, duplicatedLayer);

    // Reindexar camadas subsequentes
    for (let i = 0; i < newLayers.length; i++) {
      newLayers[i].z = i;
      newLayers[i].heightMm = Number(((i + 1) * pitchMm).toFixed(1));
    }

    let grandTotal = 0;
    for (const l of newLayers) grandTotal += l.beadCount;

    set({
      grid3D: {
        ...grid3D,
        depth: newLayers.length,
        totalLayers: newLayers.length,
        layers: newLayers,
        totalBeads: grandTotal,
      },
      activeLayerZ: newZ,
      grid: duplicatedLayer.grid,
      summary: buildBeadSummary(duplicatedLayer.grid, 'count'),
    });
  },

  deleteLayer3D: (z) => {
    const { grid3D, activeLayerZ } = get();
    if (!grid3D || grid3D.layers.length <= 1 || z < 0 || z >= grid3D.layers.length) return;

    const newLayers = grid3D.layers.filter((_, idx) => idx !== z);
    const pitchMm = grid3D.pitchMm || 2.6;

    // Reindexar camadas restantes
    for (let i = 0; i < newLayers.length; i++) {
      newLayers[i].z = i;
      newLayers[i].heightMm = Number(((i + 1) * pitchMm).toFixed(1));
    }

    let grandTotal = 0;
    for (const l of newLayers) grandTotal += l.beadCount;

    const nextActiveZ = Math.min(activeLayerZ, newLayers.length - 1);
    const activeLayer = newLayers[nextActiveZ];

    set({
      grid3D: {
        ...grid3D,
        depth: newLayers.length,
        totalLayers: newLayers.length,
        layers: newLayers,
        totalBeads: grandTotal,
      },
      activeLayerZ: nextActiveZ,
      grid: activeLayer.grid,
      summary: buildBeadSummary(activeLayer.grid, 'count'),
    });
  },

  remap3DColor: (oldCodeOrHex, newBead) => {
    const { grid3D, activeLayerZ } = get();
    if (!grid3D) return;

    const lowerTarget = oldCodeOrHex.toLowerCase();
    const newLayers = grid3D.layers.map((layer) => {
      let layerBeadCount = 0;
      const newCells = layer.grid.cells.map((row) =>
        row.map((cell) => {
          if (
            !cell.isEmpty &&
            (cell.beadCode?.toLowerCase() === lowerTarget ||
              cell.hex.toLowerCase() === lowerTarget)
          ) {
            layerBeadCount++;
            const lum = 0.299 * newBead.rgb.r + 0.587 * newBead.rgb.g + 0.114 * newBead.rgb.b;
            const textColor: '#000000' | '#FFFFFF' = lum > 140 ? '#000000' : '#FFFFFF';
            return {
              ...cell,
              beadCode: newBead.code,
              beadName: newBead.name,
              hex: newBead.hex,
              rgb: newBead.rgb,
              textColor,
            };
          }
          if (!cell.isEmpty && cell.beadCode) layerBeadCount++;
          return cell;
        })
      );

      return {
        ...layer,
        beadCount: layerBeadCount,
        grid: {
          ...layer.grid,
          cells: newCells,
        },
      };
    });

    let grandTotal = 0;
    for (const l of newLayers) grandTotal += l.beadCount;

    const currentLayer = newLayers[activeLayerZ] || newLayers[0];

    set({
      grid3D: {
        ...grid3D,
        layers: newLayers,
        totalBeads: grandTotal,
      },
      grid: currentLayer.grid,
      summary: buildBeadSummary(currentLayer.grid, 'count'),
    });
  },

  setProjectName: (name) => set({ projectName: name }),

  setImage: (file, previewUrl, base64) =>
    set({
      imageFile: file,
      imagePreviewUrl: previewUrl,
      imageBase64: base64,
    }),

  setGrid: (grid) => {
    const summary = buildBeadSummary(grid, 'count');
    set({
      grid,
      summary,
      gridWidth: grid.width,
      gridHeight: grid.height,
      history: [grid],
      historyIndex: 0,
    });
  },

  setDimensions: (width, height) =>
    set({ gridWidth: width, gridHeight: height }),

  setPegboardTemplate: (templateId) => {
    const { boardsHorizontal, boardsVertical } = get();
    const config = calculateMultiBoardConfig(templateId, boardsHorizontal, boardsVertical);
    set({
      selectedPegboardTemplateId: templateId,
      multiBoardConfig: config,
      gridWidth: config.totalPinsHorizontal,
      gridHeight: config.totalPinsVertical,
    });
  },

  setBoardsMultipliers: (horizontal, vertical) => {
    const { selectedPegboardTemplateId } = get();
    const config = calculateMultiBoardConfig(selectedPegboardTemplateId, horizontal, vertical);
    set({
      boardsHorizontal: config.boardsHorizontal,
      boardsVertical: config.boardsVertical,
      multiBoardConfig: config,
      gridWidth: config.totalPinsHorizontal,
      gridHeight: config.totalPinsVertical,
    });
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setShowPlateDivisions: (showPlateDivisions) => set({ showPlateDivisions }),
  setShowGridNumbers: (showGridNumbers) => set({ showGridNumbers }),

  setPaletteId: (id) => {
    const palette = PALETTES[id];
    if (palette) {
      set({
        paletteId: id,
        activePalette: palette.colors,
        selectedBead: palette.colors[0] ?? null,
      });
    }
  },

  setSelectedBead: (bead) => set({ selectedBead: bead }),
  setHighlightBeadCode: (code) => set({ highlightBeadCode: code }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setScale: (scale) => set({ scale: Math.max(0.3, Math.min(scale, 3.0)) }),
  setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),
  setBgTolerance: (bgTolerance) => set({ bgTolerance }),
  setDitherMode: (mode) => set({ ditherMode: mode }),
  setAdjustments: (contrast, saturation, brightness) =>
    set({ contrast, saturation, brightness }),
  setRemoveBackground: (val) => set({ removeBackground: val }),
  setIsProcessing: (val) => set({ isProcessing: val }),
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(zoom, 5.0)) }),
  setPan: (pan) => set({ pan }),
  setHoveredCell: (hoveredCell) => set({ hoveredCell }),

  paintCell: (row, col) => {
    const { grid, selectedBead, history, historyIndex, systemMode, activeLayerZ, paintVoxel3D } = get();
    if (!grid || !selectedBead) return;

    if (systemMode === 'ultra') {
      paintVoxel3D(col, row, activeLayerZ);
      return;
    }

    const newGrid = setCellBead(grid, row, col, selectedBead);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);

    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  eraseCellAt: (row, col) => {
    const { grid, history, historyIndex, systemMode, activeLayerZ, eraseVoxel3D } = get();
    if (!grid) return;

    if (systemMode === 'ultra') {
      eraseVoxel3D(col, row, activeLayerZ);
      return;
    }

    const newGrid = eraseCell(grid, row, col);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);

    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  bucketFillAt: (row, col) => {
    const { grid, selectedBead, history, historyIndex, systemMode, activeLayerZ, grid3D } = get();
    if (!grid || !selectedBead) return;

    if (systemMode === 'ultra' && grid3D) {
      const targetZ = activeLayerZ;
      if (targetZ < 0 || targetZ >= grid3D.layers.length) return;
      const layer = grid3D.layers[targetZ];
      if (layer.isLocked) return;

      const newGrid = floodFill(layer.grid, row, col, selectedBead);
      const newLayers = [...grid3D.layers];
      newLayers[targetZ] = {
        ...layer,
        grid: newGrid,
        beadCount: newGrid.totalBeads,
        isEmpty: newGrid.totalBeads === 0,
      };

      let grandTotal = 0;
      for (const l of newLayers) grandTotal += l.beadCount;
      const updatedGrid3D = { ...grid3D, layers: newLayers, totalBeads: grandTotal };

      set({
        grid3D: updatedGrid3D,
        grid: newGrid,
        summary: buildBeadSummary(newGrid, 'count'),
      });
      return;
    }

    const newGrid = floodFill(grid, row, col, selectedBead);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);

    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  replaceColorInGrid: (fromCode, toBead) => {
    const { grid, history, historyIndex } = get();
    if (!grid) return;

    const newGrid = batchReplaceBead(grid, fromCode, toBead);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);

    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevGrid = history[historyIndex - 1];
      const summary = buildBeadSummary(prevGrid, 'count');
      set({
        grid: prevGrid,
        summary,
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextGrid = history[historyIndex + 1];
      const summary = buildBeadSummary(nextGrid, 'count');
      set({
        grid: nextGrid,
        summary,
        historyIndex: historyIndex + 1,
      });
    }
  },

  // Presets de Estilo de Conversão
  conversionPreset: 'custom',
  applyConversionPreset: (preset) => {
    if (preset === 'pixel-art') {
      set({
        conversionPreset: 'pixel-art',
        contrast: 25,
        saturation: 20,
        brightness: 0,
        ditherMode: 'none',
        bgTolerance: 30,
      });
    } else if (preset === 'portrait') {
      set({
        conversionPreset: 'portrait',
        contrast: 5,
        saturation: 0,
        brightness: 0,
        ditherMode: 'floyd-steinberg',
        bgTolerance: 20,
      });
    } else if (preset === 'easy-build') {
      set({
        conversionPreset: 'easy-build',
        contrast: 30,
        saturation: -10,
        brightness: 5,
        ditherMode: 'none',
        bgTolerance: 35,
      });
    } else if (preset === 'high-fidelity') {
      set({
        conversionPreset: 'high-fidelity',
        contrast: 10,
        saturation: 10,
        brightness: 0,
        ditherMode: 'atkinson',
        bgTolerance: 15,
      });
    }
  },

  // Filtro de Cores Possuídas / Minhas Cores da Gaveta
  enabledBeadCodes: null,
  isPaletteFilterModalOpen: false,
  setIsPaletteFilterModalOpen: (open) => set({ isPaletteFilterModalOpen: open }),
  toggleBeadCodeEnabled: (code) =>
    set((state) => {
      const current = state.enabledBeadCodes
        ? { ...state.enabledBeadCodes }
        : state.activePalette.reduce((acc, c) => ({ ...acc, [c.code]: true }), {} as Record<string, boolean>);
      current[code] = !current[code];
      return { enabledBeadCodes: current };
    }),
  enableAllBeadCodes: () =>
    set((state) => {
      const all = state.activePalette.reduce((acc, c) => ({ ...acc, [c.code]: true }), {} as Record<string, boolean>);
      return { enabledBeadCodes: all };
    }),
  disableAllBeadCodes: () =>
    set((state) => {
      const none = state.activePalette.reduce((acc, c) => ({ ...acc, [c.code]: false }), {} as Record<string, boolean>);
      return { enabledBeadCodes: none };
    }),
  setEnabledBeadCodes: (codes) =>
    set((state) => {
      const codeSet = new Set(codes);
      const map = state.activePalette.reduce(
        (acc, c) => ({ ...acc, [c.code]: codeSet.has(c.code) }),
        {} as Record<string, boolean>
      );
      return { enabledBeadCodes: map };
    }),

  // Imagem de Referência / Modo Calque
  referenceImageUrl: null,
  referenceOpacity: 0.45,
  isReferenceOverlayActive: false,
  isReferenceModalOpen: false,
  setIsReferenceModalOpen: (open) => set({ isReferenceModalOpen: open }),
  setReferenceImage: (file, url) =>
    set({
      referenceImageUrl: url,
      isReferenceOverlayActive: !!url,
    }),
  setReferenceOpacity: (opacity) => set({ referenceOpacity: Math.max(0.05, Math.min(1.0, opacity)) }),
  toggleReferenceOverlay: () => set((state) => ({ isReferenceOverlayActive: !state.isReferenceOverlayActive })),

  // Ferramentas de Transformação da Grade
  flipHorizontal: () => {
    const { grid, history, historyIndex } = get();
    if (!grid) return;
    const newGrid = flipGridHorizontal(grid);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);
    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  flipVertical: () => {
    const { grid, history, historyIndex } = get();
    if (!grid) return;
    const newGrid = flipGridVertical(grid);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);
    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  rotate90: () => {
    const { grid, history, historyIndex } = get();
    if (!grid) return;
    const newGrid = rotateGrid90(grid);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);
    set({
      grid: newGrid,
      gridWidth: newGrid.width,
      gridHeight: newGrid.height,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  clearGrid: () => {
    const { grid, history, historyIndex } = get();
    if (!grid) return;
    const newGrid = clearAllGrid(grid);
    const newSummary = buildBeadSummary(newGrid, 'count');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGrid);
    set({
      grid: newGrid,
      summary: newSummary,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
}));
