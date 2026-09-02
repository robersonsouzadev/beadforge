import * as THREE from 'three';
import { STLLoader, OBJLoader, ThreeMFLoader } from 'three-stdlib';
import JSZip from 'jszip';
import type { BeadColor } from '@/core/schemas/palette';
import { PaletteMatcher } from '@/core/color/palette-matcher';
import type { VoxelGrid3D, FillMode } from './voxel-types';
import { VoxelEngine } from './voxelizer';

export interface MultipartItem {
  id: string;
  fileName: string;
  name: string;
  geometry: THREE.BufferGeometry;
  assignedBead: BeadColor;
  suggestedColorCategory: string;
  vertexCount: number;
  triangleCount: number;
  isVisible: boolean;
}

export class MultipartLoader {
  private palette: BeadColor[];
  private matcher: PaletteMatcher;

  constructor(palette: BeadColor[]) {
    this.palette = palette;
    this.matcher = new PaletteMatcher(palette);
  }

  /**
   * Sugestão inteligente de cor baseada no nome do arquivo (ex: body -> vermelho, leg -> azul, eye -> branco, logo -> preto)
   */
  private suggestBeadColor(fileName: string, index: number): { bead: BeadColor; category: string } {
    const lower = fileName.toLowerCase();

    // 1. Olhos / Detalhes brancos
    if (lower.includes('eye') || lower.includes('olho') || lower.includes('white') || lower.includes('branco')) {
      const whiteBead = this.palette.find((b) => b.name.toLowerCase().includes('branco') || b.hex.toLowerCase() === '#ffffff') || this.palette[0];
      return { bead: whiteBead, category: 'Olhos / Branco' };
    }

    // 2. Logo / Linhas pretas / Sombra
    if (lower.includes('logo') || lower.includes('black') || lower.includes('preto') || lower.includes('spider') || lower.includes('outline')) {
      const blackBead = this.palette.find((b) => b.name.toLowerCase().includes('preto') || b.hex.toLowerCase() === '#000000') || this.palette[this.palette.length - 1];
      return { bead: blackBead, category: 'Logo / Preto' };
    }

    // 3. Pernas / Calça / Azul
    if (lower.includes('leg') || lower.includes('perna') || lower.includes('pant') || lower.includes('blue') || lower.includes('azul')) {
      const blueBead = this.palette.find((b) => b.name.toLowerCase().includes('azul') || b.name.toLowerCase().includes('blue')) || this.palette[Math.min(10, this.palette.length - 1)];
      return { bead: blueBead, category: 'Pernas / Azul' };
    }

    // 4. Corpo / Tronco / Vermelho / Traje
    if (lower.includes('body') || lower.includes('corpo') || lower.includes('chest') || lower.includes('suit') || lower.includes('red') || lower.includes('vermelho') || lower.includes('arm')) {
      const redBead = this.palette.find((b) => b.name.toLowerCase().includes('vermelho') || b.name.toLowerCase().includes('red')) || this.palette[Math.min(5, this.palette.length - 1)];
      return { bead: redBead, category: 'Corpo / Vermelho' };
    }

    // 5. Pele / Face
    if (lower.includes('skin') || lower.includes('pele') || lower.includes('face') || lower.includes('head') || lower.includes('cabeca')) {
      const skinBead = this.palette.find((b) => b.name.toLowerCase().includes('pele') || b.name.toLowerCase().includes('peach') || b.name.toLowerCase().includes('creme')) || this.palette[2];
      return { bead: skinBead, category: 'Pele / Face' };
    }

    // 6. Rotação padrão pela paleta para peças genéricas
    const fallbackBead = this.palette[(index * 7) % this.palette.length] || this.palette[0];
    return { bead: fallbackBead, category: 'Peça Geral' };
  }

  /**
   * Extrai e parseia todos os arquivos 3D contidos em um arquivo .ZIP (ex: spiderman+multipart_stls.zip)
   */
  public async loadFromZip(zipFile: File): Promise<MultipartItem[]> {
    const zip = new JSZip();
    const arrayBuffer = await zipFile.arrayBuffer();
    const zipContent = await zip.loadAsync(arrayBuffer);

    const parts: MultipartItem[] = [];
    const stlLoader = new STLLoader();
    const objLoader = new OBJLoader();

    let partIndex = 0;

    for (const [relativePath, fileEntry] of Object.entries(zipContent.files)) {
      if (fileEntry.dir) continue;

      const lowerName = relativePath.toLowerCase();
      const baseName = relativePath.split('/').pop()?.split('\\').pop() || relativePath;

      if (lowerName.endsWith('.stl')) {
        const buffer = await fileEntry.async('arraybuffer');
        const geometry = stlLoader.parse(buffer);
        const suggestion = this.suggestBeadColor(baseName, partIndex);

        parts.push({
          id: `part_${partIndex}_${baseName}`,
          fileName: baseName,
          name: this.formatPartName(baseName),
          geometry,
          assignedBead: suggestion.bead,
          suggestedColorCategory: suggestion.category,
          vertexCount: geometry.attributes.position ? geometry.attributes.position.count : 0,
          triangleCount: geometry.attributes.position ? Math.floor(geometry.attributes.position.count / 3) : 0,
          isVisible: true,
        });
        partIndex++;
      } else if (lowerName.endsWith('.obj')) {
        const text = await fileEntry.async('text');
        const group = objLoader.parse(text);
        let mergedGeom = new THREE.BufferGeometry();

        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            mergedGeom = (child as THREE.Mesh).geometry;
          }
        });

        const suggestion = this.suggestBeadColor(baseName, partIndex);
        parts.push({
          id: `part_${partIndex}_${baseName}`,
          fileName: baseName,
          name: this.formatPartName(baseName),
          geometry: mergedGeom,
          assignedBead: suggestion.bead,
          suggestedColorCategory: suggestion.category,
          vertexCount: mergedGeom.attributes.position ? mergedGeom.attributes.position.count : 0,
          triangleCount: mergedGeom.attributes.position ? Math.floor(mergedGeom.attributes.position.count / 3) : 0,
          isVisible: true,
        });
        partIndex++;
      }
    }

    // Ordenar peças por nome para visualização limpa
    parts.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    return parts;
  }

  /**
   * Extrai e parseia múltiplos arquivos STL/OBJ passados diretamente pelo usuário
   */
  public async loadFromMultipleFiles(files: File[]): Promise<MultipartItem[]> {
    const parts: MultipartItem[] = [];
    const stlLoader = new STLLoader();
    const objLoader = new OBJLoader();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.stl')) {
        const buffer = await file.arrayBuffer();
        const geometry = stlLoader.parse(buffer);
        const suggestion = this.suggestBeadColor(file.name, i);

        parts.push({
          id: `part_${i}_${file.name}`,
          fileName: file.name,
          name: this.formatPartName(file.name),
          geometry,
          assignedBead: suggestion.bead,
          suggestedColorCategory: suggestion.category,
          vertexCount: geometry.attributes.position ? geometry.attributes.position.count : 0,
          triangleCount: geometry.attributes.position ? Math.floor(geometry.attributes.position.count / 3) : 0,
          isVisible: true,
        });
      } else if (lower.endsWith('.obj')) {
        const text = await file.text();
        const group = objLoader.parse(text);
        let geom = new THREE.BufferGeometry();
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            geom = (child as THREE.Mesh).geometry;
          }
        });
        const suggestion = this.suggestBeadColor(file.name, i);

        parts.push({
          id: `part_${i}_${file.name}`,
          fileName: file.name,
          name: this.formatPartName(file.name),
          geometry: geom,
          assignedBead: suggestion.bead,
          suggestedColorCategory: suggestion.category,
          vertexCount: geom.attributes.position ? geom.attributes.position.count : 0,
          triangleCount: geom.attributes.position ? Math.floor(geom.attributes.position.count / 3) : 0,
          isVisible: true,
        });
      }
    }

    parts.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    return parts;
  }

  /**
   * Extrai e parseia malhas e cores de um arquivo .3MF (incluindo metadados nativos do Bambu Studio / MakerWorld / PrusaSlicer)
   */
  public async loadFrom3mf(file: File): Promise<MultipartItem[]> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    let filamentColours: string[] = [];
    // 1. Extrair lista de partes e matrizes na ordem exata do documento
    const partList: { id: string; name: string; matrix?: THREE.Matrix4; extruderIndex?: number }[] = [];

    try {
      const zipContent = await zip.loadAsync(arrayBuffer);

      // 2. Extrair cores de filamento do Bambu Studio (Metadata/project_settings.config)
      const projectSettingsFile = zipContent.file('Metadata/project_settings.config');
      if (projectSettingsFile) {
        const text = await projectSettingsFile.async('text');
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json.filament_colour) && json.filament_colour.length > 0) {
            filamentColours = json.filament_colour;
          }
        } catch {
          const match = text.match(/"filament_colour"\s*:\s*\[([^\]]+)\]/);
          if (match && match[1]) {
            const raw = match[1].match(/#[0-9a-fA-F]{6,8}/g);
            if (raw) filamentColours = raw;
          }
        }
      }

      // 3. Extrair cores de slice_info.config caso project_settings não contenha
      if (filamentColours.length === 0) {
        const sliceInfoFile = zipContent.file('Metadata/slice_info.config');
        if (sliceInfoFile) {
          const text = await sliceInfoFile.async('text');
          const raw = text.match(/color\s*=\s*"#([0-9a-fA-F]{6,8})"/gi);
          if (raw) {
            filamentColours = raw.map((m) => {
              const hex = m.match(/#[0-9a-fA-F]{6,8}/);
              return hex ? hex[0] : '';
            }).filter(Boolean);
          }
        }
      }

      // 4. Extrair lista de partes e matrizes de Metadata/model_settings.config
      const modelSettingsFile = zipContent.file('Metadata/model_settings.config');
      if (modelSettingsFile) {
        const text = await modelSettingsFile.async('text');
        
        const partMatches = text.matchAll(/<part\s+id="(\d+)"([^>]*)>([\s\S]*?)<\/part>/gi);
        for (const pm of partMatches) {
          const partId = pm[1];
          const partAttrs = pm[2];
          const partBody = pm[3];

          const matMatch = partBody.match(/<metadata\s+key="matrix"\s+value="([^"]+)"\/>/i);
          const nameMatch = partBody.match(/<metadata\s+key="name"\s+value="([^"]+)"\/>/i);

          let matrix: THREE.Matrix4 | undefined = undefined;
          if (matMatch) {
            const vals = matMatch[1].split(' ').map(parseFloat);
            if (vals.length === 16) {
              matrix = new THREE.Matrix4();
              matrix.set(
                vals[0], vals[1], vals[2], vals[3],
                vals[4], vals[5], vals[6], vals[7],
                vals[8], vals[9], vals[10], vals[11],
                vals[12], vals[13], vals[14], vals[15]
              );
            }
          }

          partList.push({
            id: partId,
            name: nameMatch ? nameMatch[1] : `Parte ${partId}`,
            matrix,
          });
        }
      }
    } catch (zipErr) {
      console.warn('Não foi possível inspecionar metadados ZIP do 3MF, usando parser ThreeMF padrão.', zipErr);
    }

    // 5. Carregar geometrias via ThreeMFLoader
    const loader = new ThreeMFLoader();
    const group = loader.parse(arrayBuffer);

    const parts: MultipartItem[] = [];
    let rawIndex = 0;
    let validPartIndex = 0;

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const currentPart = partList[rawIndex];
        rawIndex++;

        // Pular conectores mecânicos e pinos auxiliares de encaixe plástico
        if (currentPart && currentPart.name && (currentPart.name.toLowerCase().includes('conector') || currentPart.name.toLowerCase().includes('connector'))) {
          return;
        }

        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry.clone();

        // Aplicar matriz de montagem exata da peça
        if (currentPart && currentPart.matrix) {
          geom.applyMatrix4(currentPart.matrix);
        }

        let assignedBead = this.palette[validPartIndex % this.palette.length];
        let category = 'Parte 3MF';

        const extruderIdx = validPartIndex % Math.max(1, filamentColours.length);
        if (filamentColours.length > 0 && filamentColours[extruderIdx]) {
          const hexStr = filamentColours[extruderIdx].slice(0, 7);
          const r = parseInt(hexStr.slice(1, 3), 16) || 128;
          const g = parseInt(hexStr.slice(3, 5), 16) || 128;
          const b = parseInt(hexStr.slice(5, 7), 16) || 128;
          assignedBead = this.matcher.findNearest(r, g, b);
          category = `Filamento #${extruderIdx + 1} (${assignedBead.name})`;
        }

        let rawName = currentPart?.name || (validPartIndex === 0 ? 'Cabeça e Máscara' : 'Corpo e Armadura');
        if (validPartIndex === 0 && (!currentPart?.name || currentPart.name.includes('.stl'))) rawName = 'Cabeça e Máscara';
        if (validPartIndex === 1 && (!currentPart?.name || currentPart.name.includes('.stl'))) rawName = 'Corpo e Armadura';

        const partName = this.formatPartName(rawName);

        parts.push({
          id: `3mf_part_${validPartIndex}`,
          fileName: `${file.name} - ${rawName}`,
          name: partName,
          geometry: geom,
          assignedBead,
          suggestedColorCategory: category,
          vertexCount: geom.attributes.position ? geom.attributes.position.count : 0,
          triangleCount: geom.attributes.position ? Math.floor(geom.attributes.position.count / 3) : 0,
          isVisible: true,
        });

        validPartIndex++;
      }
    });

    // Centralização unificada do conjunto montado (evita que a cabeça e corpo se separem)
    if (parts.length > 0) {
      const unifiedBox = new THREE.Box3();
      for (const p of parts) {
        p.geometry.computeBoundingBox();
        if (p.geometry.boundingBox) {
          unifiedBox.union(p.geometry.boundingBox);
        }
      }

      const center = new THREE.Vector3();
      unifiedBox.getCenter(center);

      for (const p of parts) {
        p.geometry.translate(-center.x, -center.y, -center.z);
      }
    }

    parts.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    return parts;
  }

  /**
   * Formata nomes de arquivos (ex: obj_7_body.stl -> Corpo (Parte 7))
   */
  private formatPartName(fileName: string): string {
    const clean = fileName.replace(/\.[^/.]+$/, '').replace(/^[_-]+/, '');
    const parts = clean.split(/[_-]/);

    return parts
      .map((p) => {
        const low = p.toLowerCase();
        if (low === 'obj') return '';
        if (low.startsWith('body')) return 'Corpo ' + low.replace('body', '');
        if (low.startsWith('leg')) return 'Perna ' + low.replace('leg', '');
        if (low.startsWith('arm')) return 'Braço ' + low.replace('arm', '');
        if (low.startsWith('eye')) return 'Olho ' + low.replace('eye', '');
        if (low.startsWith('logo')) return 'Logo/Aranha ' + low.replace('logo', '');
        if (low.startsWith('head')) return 'Cabeça ' + low.replace('head', '');
        return p.charAt(0).toUpperCase() + p.slice(1);
      })
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  /**
   * Mescla e Voxeliza todas as partes no espaço global compartilhado (Shared Origin)
   * Cada voxel recebe exatamente a cor do bead atribuída à parte correspondente!
   */
  public mergeAndVoxelize(
    parts: MultipartItem[],
    options: {
      width: number;
      height: number;
      depth: number;
      fillMode: FillMode;
      wallThickness?: number;
      pitchMm?: number;
    }
  ): VoxelGrid3D {
    const visibleParts = parts.filter((p) => p.isVisible);
    if (visibleParts.length === 0) {
      return VoxelEngine.createEmptyGrid(options.width, options.height, options.depth, options.pitchMm || 2.6);
    }

    // 1. Calcular o Bounding Box Global Unificado englobando TODAS as partes
    let globalMinX = Infinity,
      globalMaxX = -Infinity;
    let globalMinY = Infinity,
      globalMaxY = -Infinity;
    let globalMinZ = Infinity,
      globalMaxZ = -Infinity;

    for (const part of visibleParts) {
      const pos = part.geometry.attributes.position;
      if (!pos) continue;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        if (x < globalMinX) globalMinX = x;
        if (x > globalMaxX) globalMaxX = x;
        if (y < globalMinY) globalMinY = y;
        if (y > globalMaxY) globalMaxY = y;
        if (z < globalMinZ) globalMinZ = z;
        if (z > globalMaxZ) globalMaxZ = z;
      }
    }

    const rangeX = Math.max(0.001, globalMaxX - globalMinX);
    const rangeY = Math.max(0.001, globalMaxY - globalMinY);
    const rangeZ = Math.max(0.001, globalMaxZ - globalMinZ);

    // Escala uniforme para acomodar todo o modelo na grade de beads
    const scaleFactor = Math.min(
      (options.width - 2) / rangeX,
      (options.height - 2) / rangeY,
      (options.depth - 1) / rangeZ
    );

    const scaledW = rangeX * scaleFactor;
    const scaledH = rangeY * scaleFactor;

    const offsetX = Math.floor((options.width - scaledW) / 2);
    const offsetY = Math.floor((options.height - scaledH) / 2);
    const offsetZ = 0; // Base sobre Z=0

    // Mapa 3D unificado de voxels com a cor do bead atribuída à respectiva parte
    const voxelMap = new Map<string, BeadColor>();

    for (const part of visibleParts) {
      const pos = part.geometry.attributes.position;
      if (!pos) continue;

      const bead = part.assignedBead;
      const numTriangles = pos.count / 3;

      for (let t = 0; t < numTriangles; t++) {
        const i0 = t * 3;
        const i1 = t * 3 + 1;
        const i2 = t * 3 + 2;

        const v0x = pos.getX(i0),
          v0y = pos.getY(i0),
          v0z = pos.getZ(i0);
        const v1x = pos.getX(i1),
          v1y = pos.getY(i1),
          v1z = pos.getZ(i1);
        const v2x = pos.getX(i2),
          v2y = pos.getY(i2),
          v2z = pos.getZ(i2);

        // Amostragem por baricêntricas
        const edge1 = Math.hypot(v1x - v0x, v1y - v0y, v1z - v0z);
        const edge2 = Math.hypot(v2x - v0x, v2y - v0y, v2z - v0z);
        const samples = Math.max(2, Math.ceil(Math.max(edge1, edge2) * scaleFactor * 1.5));

        for (let u = 0; u <= samples; u++) {
          for (let v = 0; u + v <= samples; v++) {
            const w0 = 1 - (u + v) / samples;
            const w1 = u / samples;
            const w2 = v / samples;

            const px = w0 * v0x + w1 * v1x + w2 * v2x;
            const py = w0 * v0y + w1 * v1y + w2 * v2y;
            const pz = w0 * v0z + w1 * v1z + w2 * v2z;

            const vx = Math.floor((px - globalMinX) * scaleFactor) + offsetX;
            const vy = Math.floor((py - globalMinY) * scaleFactor) + offsetY;
            const vz = Math.floor((pz - globalMinZ) * scaleFactor) + offsetZ;

            if (
              vx >= 0 &&
              vx < options.width &&
              vy >= 0 &&
              vy < options.height &&
              vz >= 0 &&
              vz < options.depth
            ) {
              const key = `${vx},${vy},${vz}`;
              voxelMap.set(key, bead);
            }
          }
        }
      }
    }

    // 2. Calcular a altura máxima real ocupada pelos voxels (auto-trim de camadas vazias)
    let maxZ = 0;
    for (const key of voxelMap.keys()) {
      const z = Number(key.split(',')[2]);
      if (z > maxZ) maxZ = z;
    }
    const actualDepth = Math.max(1, maxZ + 1);

    // Construir VoxelGrid3D apenas com as camadas que possuem beads
    const pitchMm = options.pitchMm || 2.6;
    const grid3D = VoxelEngine.createEmptyGrid(options.width, options.height, actualDepth, pitchMm);
    let totalBeads = 0;

    for (const [key, bead] of voxelMap.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      if (z >= 0 && z < actualDepth && y >= 0 && y < options.height && x >= 0 && x < options.width) {
        const layer = grid3D.layers[z];

        layer.grid.cells[y][x] = {
          row: y,
          col: x,
          beadCode: bead.code,
          beadName: bead.name,
          hex: bead.hex,
          rgb: bead.rgb,
          textColor:
            bead.rgb.r * 0.3 + bead.rgb.g * 0.6 + bead.rgb.b * 0.1 > 140 ? '#000000' : '#FFFFFF',
          isEmpty: false,
        };

        layer.beadCount++;
        layer.isEmpty = false;
        totalBeads++;
      }
    }

    for (const layer of grid3D.layers) {
      layer.grid.totalBeads = layer.beadCount;
    }
    grid3D.totalBeads = totalBeads;

    return grid3D;
  }
}
