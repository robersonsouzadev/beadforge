import type { Palette } from '@/core/schemas/palette';
import mini120 from './mini-26mm-120.json';
import pindooStandard from './pindoo-standard.json';
import hamaMidi from './hama-midi.json';
import hamaMini from './hama-mini.json';

export const PALETTES: Record<string, Palette> = {
  'mini-26mm-120': mini120 as unknown as Palette,
  'pindoo-standard': pindooStandard as unknown as Palette,
  'hama-midi': hamaMidi as unknown as Palette,
  'hama-mini': hamaMini as unknown as Palette,
};

export function getPaletteById(id: string): Palette {
  const palette = PALETTES[id];
  if (!palette) {
    throw new Error(`Paleta '${id}' não encontrada. Paletas disponíveis: ${Object.keys(PALETTES).join(', ')}`);
  }
  return palette;
}

export function listAvailablePalettes(): Palette[] {
  return Object.values(PALETTES);
}
