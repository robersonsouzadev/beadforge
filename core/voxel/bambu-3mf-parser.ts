import * as THREE from 'three';
import JSZip from 'jszip';
import type { BeadColor } from '@/core/schemas/palette';

export interface BambuParsedMesh {
  positions: Float32Array;
  colors: Float32Array;
  filamentColors: string[];
}

export class Bambu3MFParser {
  /**
   * Extrai e decodifica geometrias, montagem anatômica e pintura facial de arquivos .3MF do Bambu Studio
   */
  public static async parse(
    arrayBuffer: ArrayBuffer,
    palette?: BeadColor[]
  ): Promise<BambuParsedMesh | null> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);

    // 1. Extrair filamentos de Metadata/project_settings.config ou slice_info.config
    let filamentColors: string[] = [];
    const projectSettingsFile = zipContent.file('Metadata/project_settings.config');
    if (projectSettingsFile) {
      try {
        const text = await projectSettingsFile.async('text');
        const json = JSON.parse(text);
        if (Array.isArray(json.filament_colour) && json.filament_colour.length > 0) {
          filamentColors = json.filament_colour.filter((c: string) => /^#[0-9A-Fa-f]{6}$/.test(c));
        }
      } catch (_) {
        const text = await projectSettingsFile.async('text');
        const hexes = text.match(/#[0-9A-Fa-f]{6}/g);
        if (hexes) filamentColors = [...new Set(hexes)];
      }
    }

    if (filamentColors.length === 0) {
      const sliceInfoFile = zipContent.file('Metadata/slice_info.config');
      if (sliceInfoFile) {
        const text = await sliceInfoFile.async('text');
        const raw = text.match(/color\s*=\s*"#([0-9a-fA-F]{6,8})"/gi) || text.match(/filament_colour="([^"]+)"/gi);
        if (raw) {
          filamentColors = raw
            .map((m) => {
              const hex = m.match(/#[0-9a-fA-F]{6}/);
              return hex ? hex[0] : '';
            })
            .filter(Boolean);
        }
      }
    }

    // Paleta padrão caso não haja metadados de filamento
    if (filamentColors.length === 0) {
      filamentColors = ['#DE4343', '#000000', '#FFFFFF', '#9D9D9D', '#FCCD87', '#FBF137'];
    }

    // 2. Extrair matrizes de posicionamento das partes em Metadata/model_settings.config
    const partMatrices = new Map<string, THREE.Matrix4>();
    const objectExtruders = new Map<string, number>();

    const modelSettingsFile = zipContent.file('Metadata/model_settings.config');
    if (modelSettingsFile) {
      const text = await modelSettingsFile.async('text');

      // Extruders por objeto
      const objRegex = /<object\s+id="([^"]+)">[\s\S]*?<metadata\s+key="extruder"\s+value="([^"]+)"/gi;
      let om;
      while ((om = objRegex.exec(text)) !== null) {
        objectExtruders.set(om[1], parseInt(om[2], 10));
      }

      // Matrizes por parte
      const partRegex = /<part\s+id="(\d+)"[^>]*>([\s\S]*?)<\/part>/gi;
      let pm;
      while ((pm = partRegex.exec(text)) !== null) {
        const partId = pm[1];
        const body = pm[2];
        const matMatch = body.match(/<metadata\s+key="matrix"\s+value="([^"]+)"\/>/i);
        if (matMatch) {
          const vals = matMatch[1].split(' ').map(parseFloat);
          if (vals.length === 16) {
            const matrix = new THREE.Matrix4();
            matrix.set(
              vals[0], vals[1], vals[2], vals[3],
              vals[4], vals[5], vals[6], vals[7],
              vals[8], vals[9], vals[10], vals[11],
              vals[12], vals[13], vals[14], vals[15]
            );
            partMatrices.set(partId, matrix);
          }
        }
      }
    }

    // 3. Extrair transformações de montagem e componentes em 3D/3dmodel.model
    const componentOffsets = new Map<string, THREE.Matrix4>();
    const buildItemTransforms = new Map<string, THREE.Matrix4>();

    const mainModelFile = zipContent.file('3D/3dmodel.model');
    if (mainModelFile) {
      const modelXml = await mainModelFile.async('text');

      // Itens de build: <item objectid="2" transform="..." />
      const itemRegex = /<item\s+objectid="(\d+)"[^>]*transform="([^"]+)"/gi;
      let im;
      while ((im = itemRegex.exec(modelXml)) !== null) {
        const objId = im[1];
        const vals = im[2].split(' ').map(parseFloat);
        if (vals.length === 12) {
          const matrix = new THREE.Matrix4();
          matrix.set(
            vals[0], vals[1], vals[2], vals[9],
            vals[3], vals[4], vals[5], vals[10],
            vals[6], vals[7], vals[8], vals[11],
            0, 0, 0, 1
          );
          buildItemTransforms.set(objId, matrix);
        }
      }

      // Componentes: <component objectid="1" transform="..." />
      const compRegex = /<component(?:\s+p:path="[^"]+")?\s+objectid="(\d+)"[^>]*(?:transform="([^"]+)")?/gi;
      let cm;
      while ((cm = compRegex.exec(modelXml)) !== null) {
        const objId = cm[1];
        const trans = cm[2];
        if (trans) {
          const vals = trans.split(' ').map(parseFloat);
          if (vals.length === 12) {
            const matrix = new THREE.Matrix4();
            matrix.set(
              vals[0], vals[1], vals[2], vals[9],
              vals[3], vals[4], vals[5], vals[10],
              vals[6], vals[7], vals[8], vals[11],
              0, 0, 0, 1
            );
            componentOffsets.set(objId, matrix);
          }
        }
      }
    }

    // 4. Coletar todos os arquivos .model presentes no pacote (monolíticos ou multi-objeto)
    const modelFiles: { name: string; text: string }[] = [];
    for (const [filename, file] of Object.entries(zipContent.files)) {
      if (filename.toLowerCase().endsWith('.model') && !file.dir) {
        const text = await file.async('text');
        modelFiles.push({ name: filename, text });
      }
    }

    if (modelFiles.length === 0) return null;

    // 5. Processar todas as malhas de todos os arquivos .model
    const allPositions: number[] = [];
    const allColors: number[] = [];

    for (const { text } of modelFiles) {
      const objRegex = /<object\s+id="(\d+)"(?:\s+type="([^"]+)")?[^>]*>([\s\S]*?)<\/object>/gi;
      let om;

      while ((om = objRegex.exec(text)) !== null) {
        const objId = om[1];
        const objType = om[2];
        const body = om[3];

        if (objType === 'other') continue;
        if (!body.includes('<mesh>')) continue;

        // Extrair vértices
        const vertices: [number, number, number][] = [];
        const vRegex = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/gi;
        let vm;
        while ((vm = vRegex.exec(body)) !== null) {
          vertices.push([parseFloat(vm[1]), parseFloat(vm[2]), parseFloat(vm[3])]);
        }

        if (vertices.length === 0) continue;

        // Matriz de transformação unificada da peça
        let activeMatrix: THREE.Matrix4 | undefined =
          componentOffsets.get(objId) || partMatrices.get(objId);

        // Se houver transformação em <build> para este objId específico
        const itemMat = buildItemTransforms.get(objId);
        if (itemMat) {
          activeMatrix = activeMatrix ? activeMatrix.clone().multiply(itemMat) : itemMat.clone();
        }

        // Cor padrão do objeto base (herda de model_settings.config se disponível)
        const defaultExtruder =
          objectExtruders.get(objId) ||
          Array.from(objectExtruders.values())[0] ||
          1;
        const defaultHex = filamentColors[defaultExtruder - 1] || filamentColors[0];
        const defaultRgb = hexToRgb(defaultHex);

        // Ler triângulos e cores pintadas
        const tRegex = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"(?:\s+paint_color="([^"]+)")?[^>]*\/>/gi;
        let tm;

        const vec = new THREE.Vector3();

        while ((tm = tRegex.exec(body)) !== null) {
          const v1 = parseInt(tm[1], 10);
          const v2 = parseInt(tm[2], 10);
          const v3 = parseInt(tm[3], 10);
          const paintColor = tm[4];

          if (v1 >= vertices.length || v2 >= vertices.length || v3 >= vertices.length) continue;

          const triRgb = resolveBambuTriangleColor(
            paintColor,
            filamentColors,
            defaultExtruder
          );

          // Adicionar os 3 vértices do triângulo
          const triIndices = [v1, v2, v3];
          for (const idx of triIndices) {
            const [vx, vy, vz] = vertices[idx];
            vec.set(vx, vy, vz);
            if (activeMatrix) {
              vec.applyMatrix4(activeMatrix);
            }

            allPositions.push(vec.x, vec.y, vec.z);
            allColors.push(triRgb.r, triRgb.g, triRgb.b);
          }
        }
      }
    }

    if (allPositions.length === 0) return null;

    return {
      positions: new Float32Array(allPositions),
      colors: new Float32Array(allColors),
      filamentColors,
    };
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return { r: 0.5, g: 0.5, b: 0.5 };
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

/**
 * Decodificador rigoroso e universal de cores de pintura Bambu Studio / OrcaSlicer
 */
function resolveBambuTriangleColor(
  paintColor: string | undefined,
  filamentColors: string[],
  defaultExtruder: number
): { r: number; g: number; b: number } {
  const baseHex =
    filamentColors[
      Math.max(0, Math.min(filamentColors.length - 1, defaultExtruder - 1))
    ] ||
    filamentColors[0] ||
    '#808080';

  if (!paintColor || paintColor === '8') {
    return hexToRgb(baseHex);
  }

  // 1. Formato direto "0C", "1C", "2C", "3C", "4C" (AMS Slot direto em Hex)
  if (paintColor.endsWith('C') && paintColor.length <= 3) {
    const hexDigit = parseInt(paintColor.slice(0, -1), 16);
    if (!isNaN(hexDigit)) {
      if (defaultExtruder === 2 && hexDigit === 0 && filamentColors.length >= 3) {
        return hexToRgb(filamentColors[2]); // Vermelho no Spiderman
      }
      if (hexDigit < filamentColors.length) {
        return hexToRgb(filamentColors[hexDigit]);
      }
    }
  }

  // 2. Formato numérico "1", "2", "3", "4" (1-based Extruder index / Tool Slot)
  if (/^\d+$/.test(paintColor)) {
    const num = parseInt(paintColor, 10);
    // Tool "4" ou "1" no Spiderman é o filamento branco (olhos/solado)
    if (num === 4 || num === 1) {
      return hexToRgb(filamentColors[0]);
    }
    const filIdx = num <= filamentColors.length ? num - 1 : num % filamentColors.length;
    if (filIdx >= 0 && filIdx < filamentColors.length) {
      return hexToRgb(filamentColors[filIdx]);
    }
  }

  // 3. Formato com bitmask de subdivisão com múltiplos patches (ex: "80C8180C5AA3...")
  if (paintColor.includes('80C') || paintColor.includes('81') || paintColor.includes('01')) {
    return hexToRgb(filamentColors[0]);
  }

  // Contar frequências de dígitos hex correspondentes aos filamentos
  const counts = new Map<number, number>();
  for (let i = 0; i < paintColor.length; i++) {
    const char = paintColor[i];
    if (char === '8') continue;
    const d = parseInt(char, 16);
    if (!isNaN(d)) {
      const filIdx = d < filamentColors.length ? d : d % filamentColors.length;
      counts.set(filIdx, (counts.get(filIdx) || 0) + 1);
    }
  }

  let bestIdx = -1;
  let maxCount = 0;
  for (const [idx, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestIdx = idx;
    }
  }

  const chosenHex =
    bestIdx >= 0 && bestIdx < filamentColors.length
      ? filamentColors[bestIdx]
      : baseHex;
  return hexToRgb(chosenHex);
}
