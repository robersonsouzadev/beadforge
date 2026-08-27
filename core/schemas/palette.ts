import { z } from 'zod';

export const BeadFinishSchema = z.enum([
  'solid',
  'transparent',
  'translucent',
  'neon',
  'glow',
  'glitter',
  'metallic',
  'pastel',
  'striped',
]);

export const BeadColorSchema = z.object({
  code: z.string(), // e.g. "H05", "A4", "G8", "F21", "D23"
  name: z.string(), // e.g. "Red", "Yellow", "Brown"
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  rgb: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  }),
  lab: z
    .object({
      l: z.number(),
      a: z.number(),
      b: z.number(),
    })
    .optional(),
  finish: BeadFinishSchema.default('solid'),
  inStock: z.boolean().default(true),
});

export const PaletteSchema = z.object({
  id: z.string(),
  brand: z.enum(['Hama', 'Perler', 'Artkal', 'Pindoo', 'Custom']),
  series: z.string(), // "Midi", "Mini", "S-Series", "Standard"
  beadSize: z.enum(['2.6mm', '5.0mm', '10.0mm']),
  version: z.string(), // "2025-v1"
  colors: z.array(BeadColorSchema),
});

export type BeadFinish = z.infer<typeof BeadFinishSchema>;
export type BeadColor = z.infer<typeof BeadColorSchema>;
export type Palette = z.infer<typeof PaletteSchema>;
