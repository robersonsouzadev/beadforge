/**
 * MagicaVoxel .VOX Binary Parser
 * Extrai voxels (X, Y, Z, Color) e paleta embutida diretamente de arquivos .vox
 */

export interface ParsedVoxData {
  size: { x: number; y: number; z: number };
  voxels: Array<{ x: number; y: number; z: number; colorIndex: number; rgba: { r: number; g: number; b: number; a: number } }>;
  palette: Array<{ r: number; g: number; b: number; a: number }>;
}

// Paleta padrão MagicaVoxel caso o arquivo não contenha o chunk RGBA
const DEFAULT_PALETTE: Array<{ r: number; g: number; b: number; a: number }> = new Array(256).fill(null).map((_, i) => ({
  r: (i * 37) % 256,
  g: (i * 59) % 256,
  b: (i * 83) % 256,
  a: 255,
}));

export function parseVoxBinary(buffer: ArrayBuffer | Uint8Array): ParsedVoxData {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // 1. Validar Header 'VOX '
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== 'VOX ') {
    throw new Error('Arquivo inválido: Header VOX não encontrado.');
  }

  const version = dataView.getInt32(4, true);
  let offset = 8;

  let size = { x: 16, y: 16, z: 16 };
  let rawVoxels: Array<{ x: number; y: number; z: number; colorIndex: number }> = [];
  let palette = [...DEFAULT_PALETTE];

  // Leitor de chunks
  while (offset < bytes.byteLength) {
    if (offset + 12 > bytes.byteLength) break;

    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkContentSize = dataView.getInt32(offset + 4, true);
    const chunkChildrenSize = dataView.getInt32(offset + 8, true);
    offset += 12;

    const chunkEnd = offset + chunkContentSize;

    if (chunkId === 'SIZE') {
      size = {
        x: dataView.getInt32(offset, true),
        y: dataView.getInt32(offset + 4, true),
        z: dataView.getInt32(offset + 8, true),
      };
    } else if (chunkId === 'XYZI') {
      const numVoxels = dataView.getInt32(offset, true);
      let vOffset = offset + 4;
      rawVoxels = [];
      for (let i = 0; i < numVoxels; i++) {
        if (vOffset + 4 > chunkEnd) break;
        const vx = bytes[vOffset];
        const vy = bytes[vOffset + 1];
        const vz = bytes[vOffset + 2];
        const colorIndex = bytes[vOffset + 3];
        rawVoxels.push({ x: vx, y: vy, z: vz, colorIndex });
        vOffset += 4;
      }
    } else if (chunkId === 'RGBA') {
      palette = [];
      let pOffset = offset;
      for (let i = 0; i < 256; i++) {
        if (pOffset + 4 > chunkEnd) break;
        palette.push({
          r: bytes[pOffset],
          g: bytes[pOffset + 1],
          b: bytes[pOffset + 2],
          a: bytes[pOffset + 3],
        });
        pOffset += 4;
      }
    }

    offset = chunkEnd;
  }

  // MagicaVoxel mapeia paleta 1-indexed (índice 0 é transparente / vazio)
  const voxels = rawVoxels.map((v) => {
    const palIdx = Math.max(0, Math.min(255, v.colorIndex - 1));
    const rgba = palette[palIdx] || { r: 200, g: 200, b: 200, a: 255 };
    return {
      x: v.x,
      y: v.y,
      z: v.z,
      colorIndex: v.colorIndex,
      rgba,
    };
  });

  return { size, voxels, palette };
}
