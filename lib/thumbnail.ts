import type { GridMatrix } from '@/core/schemas/grid';
import type { VoxelGrid3D } from '@/core/voxel/voxel-types';

/**
 * Resizes an image (base64 or blob URL) to a compact thumbnail data URL.
 * Keeps file size small (~20-40KB) for fast dashboard loading.
 */
export async function generateThumbnailFromImage(
  src: string,
  maxWidth = 400,
  maxHeight = 300
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(src);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with good quality
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => {
      resolve(src);
    };
    img.src = src;
  });
}

/**
 * Generates a thumbnail image directly from a 2D bead grid.
 */
export function generateThumbnailFromGrid(grid: GridMatrix, maxDim = 320): string {
  if (typeof window === 'undefined') return '';
  if (!grid || !grid.cells || grid.cells.length === 0) return '';

  const rows = grid.height;
  const cols = grid.width;
  if (rows === 0 || cols === 0) return '';

  const cellSize = Math.max(2, Math.floor(maxDim / Math.max(rows, cols)));
  const width = cols * cellSize;
  const height = rows * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid.cells[r]?.[c];
      if (cell && !cell.isEmpty && cell.hex) {
        ctx.fillStyle = cell.hex;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generates a thumbnail for a project, prioritizing the original source image,
 * falling back to the rendered bead grid or 3D layer.
 */
export async function createProjectThumbnail(options: {
  originalImage?: string | null;
  grid?: GridMatrix | null;
  grid3D?: VoxelGrid3D | null;
  activeLayerZ?: number;
}): Promise<string | undefined> {
  // 1. If original uploaded image is present, use it as thumbnail
  if (options.originalImage && typeof options.originalImage === 'string' && options.originalImage.trim().length > 0) {
    try {
      return await generateThumbnailFromImage(options.originalImage);
    } catch (err) {
      console.warn('Failed to generate thumbnail from original image:', err);
    }
  }

  // 2. Fallback to 2D grid render if beads exist
  if (options.grid && options.grid.totalBeads > 0) {
    return generateThumbnailFromGrid(options.grid);
  }

  // 3. Fallback to 3D grid voxel layer
  if (options.grid3D && options.grid3D.layers?.length > 0) {
    const layerIdx = options.activeLayerZ ?? 0;
    const targetLayer =
      options.grid3D.layers.find((l) => l.beadCount > 0) ||
      options.grid3D.layers[layerIdx] ||
      options.grid3D.layers[0];

    if (targetLayer?.grid && targetLayer.grid.totalBeads > 0) {
      return generateThumbnailFromGrid(targetLayer.grid);
    }
  }

  return undefined;
}
