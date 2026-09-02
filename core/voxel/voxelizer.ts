import type { BeadColor } from '@/core/schemas/palette';
import type { GridCell, GridMatrix } from '@/core/schemas/grid';
import { PaletteMatcher } from '@/core/color/palette-matcher';
import type {
  Voxel3D,
  VoxelGrid3D,
  VoxelLayer,
  VoxelizationOptions,
  FillMode,
} from '@/core/voxel/voxel-types';

import { getContrastTextColor } from '@/core/color/contrast';
import { calculateSupportRods } from '@/core/voxel/rod-calculator';

/**
 * Motor de Voxelização e Fatiamento 3D para Hama/Perler Beads
 */
export class VoxelEngine {
  private matcher: PaletteMatcher;
  private palette: BeadColor[];

  constructor(palette: BeadColor[]) {
    this.palette = palette;
    this.matcher = new PaletteMatcher(palette);
  }

  /**
   * Cria um VoxelGrid3D vazio nas dimensões especificadas
   */
  public static createEmptyGrid(
    width: number,
    height: number,
    depth: number,
    pitchMm: number = 2.6
  ): VoxelGrid3D {
    const layers: VoxelLayer[] = [];

    for (let z = 0; z < depth; z++) {
      const cells: GridCell[][] = [];
      for (let r = 0; r < height; r++) {
        const row: GridCell[] = [];
        for (let c = 0; c < width; c++) {
          row.push({
            row: r,
            col: c,
            beadCode: '',
            beadName: '',
            hex: '#FFFFFF',
            rgb: { r: 255, g: 255, b: 255 },
            textColor: '#000000',
            isEmpty: true,
          });
        }
        cells.push(row);
      }

      const gridMatrix: GridMatrix = {
        width,
        height,
        cells,
        pegboardSize: Math.max(width, height),
        totalBeads: 0,
      };

      layers.push({
        z,
        name: `Camada ${z + 1}`,
        heightMm: Number(((z + 1) * pitchMm).toFixed(1)),
        grid: gridMatrix,
        beadCount: 0,
        isEmpty: true,
        isVisible: true,
        isLocked: false,
      });
    }

    return {
      width,
      height,
      depth,
      layers,
      totalBeads: 0,
      totalLayers: depth,
      pitchMm,
    };
  }

  /**
   * Converte uma lista de pontos voxels 3D brutos com cor RGB para VoxelGrid3D estruturado
   */
  public buildFromRawVoxels(
    rawVoxels: Array<{ x: number; y: number; z: number; rgb: { r: number; g: number; b: number } }>,
    targetWidth: number,
    targetHeight: number,
    targetDepth: number,
    options:
      | number
      | {
          fillMode?: FillMode;
          wallThickness?: number;
          pitchMm?: number;
        } = {}
  ): VoxelGrid3D {
    const opts = typeof options === 'number' ? { pitchMm: options } : options;
    const fillMode = opts.fillMode || 'solid';
    const wallThickness = opts.wallThickness || 1;
    const pitchMm = opts.pitchMm || 2.6;

    if (rawVoxels.length === 0) {
      return VoxelEngine.createEmptyGrid(targetWidth, targetHeight, targetDepth, pitchMm);
    }

    // 1. Encontrar limites (Bounding Box) dos voxels originais
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    for (const v of rawVoxels) {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
      if (v.z < minZ) minZ = v.z;
      if (v.z > maxZ) maxZ = v.z;
    }

    const origW = Math.max(1, maxX - minX + 1);
    const origH = Math.max(1, maxY - minY + 1);
    const origD = Math.max(1, maxZ - minZ + 1);

    // Fator de escala uniforme para caber no grid alvo
    const scaleFactor = Math.min(
      (targetWidth - 2) / origW,
      (targetHeight - 2) / origH,
      (targetDepth - 1) / origD
    );

    const scaledW = Math.round(origW * scaleFactor);
    const scaledH = Math.round(origH * scaleFactor);
    const scaledD = Math.round(origD * scaleFactor);

    // Offsets de centralização no grid alvo
    const offsetX = Math.floor((targetWidth - scaledW) / 2);
    const offsetY = Math.floor((targetHeight - scaledH) / 2);
    const offsetZ = 0; // Base apoiada na primeira camada (Z = 0)

    // Mapa 3D esparso temporário [z][y][x] com fusão por prioridade de peso visual
    const voxelMap = new Map<string, { rgb: { r: number; g: number; b: number }; weight: number }>();

    for (const v of rawVoxels) {
      const nx = Math.floor((v.x - minX) * scaleFactor) + offsetX;
      const ny = Math.floor((v.y - minY) * scaleFactor) + offsetY;
      const nz = Math.floor((v.z - minZ) * scaleFactor) + offsetZ;

      if (nx >= 0 && nx < targetWidth && ny >= 0 && ny < targetHeight && nz >= 0 && nz < targetDepth) {
        const key = `${nx},${ny},${nz}`;
        const weight = getVoxelVisualWeight(v.rgb);
        const existing = voxelMap.get(key);
        if (!existing || weight > existing.weight) {
          voxelMap.set(key, { rgb: v.rgb, weight });
        }
      }
    }

    // 2. Processar Modo Oco (Hollow) se solicitado: remove voxels internos
    const finalVoxelMap = new Map<string, { r: number; g: number; b: number }>();

    if (fillMode === 'hollow') {
      for (const [key, item] of voxelMap.entries()) {
        const [x, y, z] = key.split(',').map(Number);
        const isExposed = this.isVoxelExposed(x, y, z, voxelMap, targetWidth, targetHeight, targetDepth, wallThickness);
        if (isExposed) {
          finalVoxelMap.set(key, item.rgb);
        }
      }
    } else {
      for (const [key, item] of voxelMap.entries()) {
        finalVoxelMap.set(key, item.rgb);
      }
    }

    // 3. Calcular a altura real (Z máximo ocupado) para auto-trim de camadas vazias
    let highestOccupiedZ = 0;
    for (const key of finalVoxelMap.keys()) {
      const z = Number(key.split(',')[2]);
      if (z > highestOccupiedZ) highestOccupiedZ = z;
    }
    const actualDepth = Math.max(1, highestOccupiedZ + 1);

    // Montar VoxelGrid3D estruturado apenas com as camadas que possuem beads
    const grid3D = VoxelEngine.createEmptyGrid(targetWidth, targetHeight, actualDepth, pitchMm);
    let grandTotalBeads = 0;

    for (const [key, rgb] of finalVoxelMap.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      if (z >= 0 && z < actualDepth && y >= 0 && y < targetHeight && x >= 0 && x < targetWidth) {
        const matchedBead = this.matcher.findNearest(rgb.r, rgb.g, rgb.b);
        const layer = grid3D.layers[z];

        layer.grid.cells[y][x] = {
          row: y,
          col: x,
          beadCode: matchedBead.code,
          beadName: matchedBead.name,
          hex: matchedBead.hex,
          rgb: matchedBead.rgb,
          textColor: getContrastTextColor(matchedBead.rgb.r, matchedBead.rgb.g, matchedBead.rgb.b),
          isEmpty: false,
        };

        layer.beadCount++;
        layer.isEmpty = false;
        grandTotalBeads++;
      }
    }

    // Atualizar totais das matrizes por camada
    for (const layer of grid3D.layers) {
      layer.grid.totalBeads = layer.beadCount;
    }
    grid3D.totalBeads = grandTotalBeads;

    // Calcula automaticamente hastes acrílicas de sustentação se a peça for 3D multicamadas
    if (grid3D.totalLayers >= 4) {
      const { grid3D: gridWithRods } = calculateSupportRods(grid3D);
      return gridWithRods;
    }

    return grid3D;
  }

  /**
   * Verifica se um voxel tem contato com o exterior (modo oco)
   */
  private isVoxelExposed(
    x: number,
    y: number,
    z: number,
    map: Map<string, any>,
    maxW: number,
    maxH: number,
    maxD: number,
    thickness: number = 1
  ): boolean {
    // Voxel na borda externa do grid é sempre exposto
    if (x <= 0 || x >= maxW - 1 || y <= 0 || y >= maxH - 1 || z <= 0 || z >= maxD - 1) {
      return true;
    }

    // Checar vizinhos em 6 direções
    const directions = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];

    for (const [dx, dy, dz] of directions) {
      for (let step = 1; step <= thickness; step++) {
        const nx = x + dx * step;
        const ny = y + dy * step;
        const nz = z + dz * step;
        const neighborKey = `${nx},${ny},${nz}`;
        if (!map.has(neighborKey)) {
          return true; // Há ar adjacente -> é superfície externa
        }
      }
    }

    return false; // Totalmente envolto por outros voxels
  }

  /**
   * Converte malha de triângulos de BufferGeometry (Three.js) para pontos voxels
   */
  public voxelizeTriangleMesh(
    positions: Float32Array,
    indices?: Uint16Array | Uint32Array,
    colors?: Float32Array,
    resolution: { width: number; height: number; depth: number } = { width: 30, height: 30, depth: 30 }
  ): Array<{ x: number; y: number; z: number; rgb: { r: number; g: number; b: number } }> {
    const rawVoxels: Array<{ x: number; y: number; z: number; rgb: { r: number; g: number; b: number } }> = [];

    // Obter bounding box da malha
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i];
      const py = positions[i + 1];
      const pz = positions[i + 2];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    }

    const rangeX = Math.max(0.0001, maxX - minX);
    const rangeY = Math.max(0.0001, maxY - minY);
    const rangeZ = Math.max(0.0001, maxZ - minZ);

    const stepX = rangeX / resolution.width;
    const stepY = rangeY / resolution.height;
    const stepZ = rangeZ / resolution.depth;

    const voxelMap = new Map<
      string,
      { x: number; y: number; z: number; rgb: { r: number; g: number; b: number }; weight: number }
    >();

    const numTriangles = indices ? indices.length / 3 : positions.length / 9;

    for (let t = 0; t < numTriangles; t++) {
      let i0 = t * 3,
        i1 = t * 3 + 1,
        i2 = t * 3 + 2;
      if (indices) {
        i0 = indices[t * 3];
        i1 = indices[t * 3 + 1];
        i2 = indices[t * 3 + 2];
      }

      const v0x = positions[i0 * 3],
        v0y = positions[i0 * 3 + 1],
        v0z = positions[i0 * 3 + 2];
      const v1x = positions[i1 * 3],
        v1y = positions[i1 * 3 + 1],
        v1z = positions[i1 * 3 + 2];
      const v2x = positions[i2 * 3],
        v2y = positions[i2 * 3 + 1],
        v2z = positions[i2 * 3 + 2];

      // Cor do vértice se disponível, ou cor padrão cinza-azulado
      let rgb = { r: 180, g: 190, b: 210 };
      if (colors && colors.length > i0 * 3 + 2) {
        rgb = {
          r: Math.round(colors[i0 * 3] * 255),
          g: Math.round(colors[i0 * 3 + 1] * 255),
          b: Math.round(colors[i0 * 3 + 2] * 255),
        };
      }

      // Amostragem por Baricêntricas sobre o triângulo com resolução fina
      const edge1Len = Math.hypot(v1x - v0x, v1y - v0y, v1z - v0z);
      const edge2Len = Math.hypot(v2x - v0x, v2y - v0y, v2z - v0z);
      const samples = Math.max(3, Math.ceil(Math.max(edge1Len / stepX, edge2Len / stepY) * 3));

      for (let u = 0; u <= samples; u++) {
        for (let v = 0; u + v <= samples; v++) {
          const w0 = 1 - (u + v) / samples;
          const w1 = u / samples;
          const w2 = v / samples;

          const px = w0 * v0x + w1 * v1x + w2 * v2x;
          const py = w0 * v0y + w1 * v1y + w2 * v2y;
          const pz = w0 * v0z + w1 * v1z + w2 * v2z;

          // Modelos CAD/STL/3MF onde Z é a altura vertical:
          // X = largura horizontal, Z = altura dos pés à cabeça, Y = camadas de frente para trás
          const isCadZUp = rangeZ >= rangeY;
          let vx: number, vy: number, vz: number;

          if (isCadZUp) {
            vx = Math.floor(((px - minX) / rangeX) * (resolution.width - 1));
            vy = Math.floor(((maxZ - pz) / rangeZ) * (resolution.height - 1)); // Topo da cabeça no topo da grade
            vz = Math.floor(((py - minY) / rangeY) * (resolution.depth - 1)); // Fatiamento de frente para trás
          } else {
            vx = Math.floor(((px - minX) / rangeX) * (resolution.width - 1));
            vy = Math.floor(((maxY - py) / rangeY) * (resolution.height - 1));
            vz = Math.floor(((pz - minZ) / rangeZ) * (resolution.depth - 1));
          }

          const key = `${vx},${vy},${vz}`;
          const weight = getVoxelVisualWeight(rgb);
          const existing = voxelMap.get(key);

          if (!existing || weight > existing.weight) {
            voxelMap.set(key, { x: vx, y: vy, z: vz, rgb, weight });
          }
        }
      }
    }

    for (const item of voxelMap.values()) {
      rawVoxels.push({ x: item.x, y: item.y, z: item.z, rgb: item.rgb });
    }

    return rawVoxels;
  }
}

/**
 * Calcula o peso visual do voxel para que detalhes intencionais da superfície (olhos brancos, máscara vermelha, pele, cinto)
 * prevaleçam com 100% de nitidez sobre o fundo escuro/preto não pintado.
 */
function getVoxelVisualWeight(rgb: { r: number; g: number; b: number }): number {
  const maxC = Math.max(rgb.r, rgb.g, rgb.b);
  const minC = Math.min(rgb.r, rgb.g, rgb.b);
  const saturation = maxC - minC;
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;

  // Branco Puro (olhos, detalhes luminosos): prioridade máxima
  if (rgb.r > 200 && rgb.g > 200 && rgb.b > 200) {
    return 1000;
  }

  // Cores vivas e saturadas (Vermelho da máscara, Amarelo do cinto, Pele/Pêssego):
  if (saturation > 35) {
    return 500 + saturation;
  }

  // Cores claras e tons médios:
  if (brightness > 60) {
    return 100 + brightness * 0.1;
  }

  // Fundo preto ou cinza escuro base:
  return 1;
}
