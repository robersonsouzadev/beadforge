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
        const json = JSON.parse(await projectSettingsFile.async('text'));
        if (Array.isArray(json.filament_colour) && json.filament_colour.length > 0) {
          filamentColors = json.filament_colour;
        }
      } catch (_) {}
    }

    if (filamentColors.length === 0) {
      const sliceInfoFile = zipContent.file('Metadata/slice_info.config');
      if (sliceInfoFile) {
        const text = await sliceInfoFile.async('text');
        const raw = text.match(/color\s*=\s*"#([0-9a-fA-F]{6,8})"/gi);
        if (raw) {
          filamentColors = raw.map((m) => {
            const hex = m.match(/#[0-9a-fA-F]{6,8}/);
            return hex ? hex[0] : '';
          }).filter(Boolean);
        }
      }
    }

    // Paleta padrão caso não haja metadados de filamento
    if (filamentColors.length === 0) {
      filamentColors = ['#9D9D9D', '#000000', '#FCCD87', '#FFFFFF', '#FBF137'];
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

    // 3. Ler XML 3D/3dmodel.model
    const modelFile = zipContent.file('3D/3dmodel.model');
    if (!modelFile) return null;
    const modelXml = await modelFile.async('text');

    // Parsear componentes (montagem)
    const componentOffsets = new Map<string, THREE.Matrix4>();
    const compRegex = /<component\s+objectid="(\d+)"\s+transform="([^"]+)"/gi;
    let cm;
    while ((cm = compRegex.exec(modelXml)) !== null) {
      const objId = cm[1];
      const vals = cm[2].split(' ').map(parseFloat);
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

    // Parsear objetos de malha
    const allPositions: number[] = [];
    const allColors: number[] = [];

    const objRegex = /<object\s+id="(\d+)"(?:\s+type="([^"]+)")?[^>]*>([\s\S]*?)<\/object>/gi;
    let om;

    while ((om = objRegex.exec(modelXml)) !== null) {
      const objId = om[1];
      const objType = om[2];
      const body = om[3];

      // Ignorar objetos não-modelo ou auxiliares de encaixe plástico interno se não forem visíveis
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

      // Matriz de transformação da peça
      const compMatrix = componentOffsets.get(objId);
      const partMatrix = partMatrices.get(objId);
      const activeMatrix = compMatrix || partMatrix;

      // Cor padrão do objeto base
      const defaultExtruder = objectExtruders.get(objId) || 1;
      const defaultHex = filamentColors[defaultExtruder - 1] || filamentColors[0];

      // Converter Hex para RGB normalizado 0..1
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

        let triRgb = defaultRgb;

        if (paintColor) {
          // Decodificar índice do filamento no Bambu Studio
          if (paintColor.endsWith('C')) {
            const hexDigit = parseInt(paintColor.slice(0, -1), 16);
            const filamentIdx = hexDigit + 1; // 0C -> 1, 1C -> 2, etc.
            if (filamentIdx >= 1 && filamentIdx <= filamentColors.length) {
              triRgb = hexToRgb(filamentColors[filamentIdx - 1]);
            }
          } else if (paintColor === '8') {
            // Unpainted: herda cor base do objeto
            triRgb = defaultRgb;
          } else {
            // Dígito de filamento direto
            const idx = parseInt(paintColor[0], 16) || parseInt(paintColor[0], 10);
            if (idx >= 1 && idx <= filamentColors.length) {
              triRgb = hexToRgb(filamentColors[idx - 1]);
            }
          }
        }

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
