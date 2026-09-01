import type { GridMatrix } from '@/core/schemas/grid';
import type { VoxelGrid3D } from '@/core/voxel/voxel-types';

/**
 * Converts an SVG string into a valid, standard Base64 data URI supported by all browsers and Next.js.
 */
export function svgToDataUri(svg: string): string {
  if (typeof Buffer !== 'undefined') {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resizes an image (base64 or blob URL) to a compact thumbnail data URL in the browser.
 * Keeps file size small (~20-40KB) for fast dashboard loading.
 */
export async function generateThumbnailFromImage(
  src: string,
  maxWidth = 400,
  maxHeight = 300
): Promise<string> {
  if (typeof window === 'undefined') {
    return src;
  }

  return new Promise((resolve) => {
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

      ctx.drawImage(img, 0, 0, width, height);

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
 * Generates a clean, ultra-lightweight vector SVG thumbnail from a 2D bead grid.
 * Works seamlessly in both Node.js (Server / SSR) and Browser environments.
 */
export function generateThumbnailFromGrid(grid: GridMatrix): string {
  if (!grid || !grid.cells || grid.cells.length === 0) return '';
  const { width, height, cells } = grid;
  if (width <= 0 || height <= 0) return '';

  let beadsSvg = '';
  for (let r = 0; r < height; r++) {
    const row = cells[r];
    if (!row) continue;
    for (let c = 0; c < width; c++) {
      const cell = row[c];
      if (cell && !cell.isEmpty && cell.hex) {
        const x = (c + 0.06).toFixed(2);
        const y = (r + 0.06).toFixed(2);
        beadsSvg += `<rect x="${x}" y="${y}" width="0.88" height="0.88" rx="0.22" fill="${cell.hex}"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" style="background:#09090b">${beadsSvg}</svg>`;
  return svgToDataUri(svg);
}

/**
 * Generates an SVG thumbnail from a 3D layered sculpture (top-down composite).
 */
export function generateThumbnailFromGrid3D(grid3D: VoxelGrid3D): string {
  if (!grid3D || !grid3D.layers || grid3D.layers.length === 0) return '';
  const { width, height, layers } = grid3D;
  if (width <= 0 || height <= 0) return '';

  const composite: Array<Array<string | null>> = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );

  for (let z = 0; z < layers.length; z++) {
    const layer = layers[z];
    if (!layer || !layer.grid || !layer.grid.cells) continue;
    for (let r = 0; r < height; r++) {
      const row = layer.grid.cells[r];
      if (!row) continue;
      for (let c = 0; c < width; c++) {
        const cell = row[c];
        if (cell && !cell.isEmpty && cell.hex) {
          composite[r][c] = cell.hex;
        }
      }
    }
  }

  let beadsSvg = '';
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const hex = composite[r][c];
      if (hex) {
        const x = (c + 0.06).toFixed(2);
        const y = (r + 0.06).toFixed(2);
        beadsSvg += `<rect x="${x}" y="${y}" width="0.88" height="0.88" rx="0.22" fill="${hex}"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" style="background:#09090b">${beadsSvg}</svg>`;
  return svgToDataUri(svg);
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
  // 1. If original uploaded image is present, resize and use it as thumbnail
  if (
    options.originalImage &&
    typeof options.originalImage === 'string' &&
    options.originalImage.trim().length > 0 &&
    options.originalImage.startsWith('data:image')
  ) {
    try {
      return await generateThumbnailFromImage(options.originalImage);
    } catch (err) {
      console.warn('Failed to generate thumbnail from original image:', err);
    }
  }

  // 2. Fallback to 2D grid render if beads exist
  if (options.grid && options.grid.cells && options.grid.cells.length > 0) {
    const thumb = generateThumbnailFromGrid(options.grid);
    if (thumb) return thumb;
  }

  // 3. Fallback to 3D grid voxel layer
  if (options.grid3D && options.grid3D.layers?.length > 0) {
    const thumb3D = generateThumbnailFromGrid3D(options.grid3D);
    if (thumb3D) return thumb3D;
  }

  return undefined;
}
