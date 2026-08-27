import { z } from 'zod';

export const GridCellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  beadCode: z.string(),
  beadName: z.string(),
  hex: z.string(),
  rgb: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  }),
  textColor: z.enum(['#000000', '#FFFFFF']),
  isEmpty: z.boolean().default(false),
});

export const GridMatrixSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  cells: z.array(z.array(GridCellSchema)),
  pegboardSize: z.number().int().default(29),
  totalBeads: z.number().int().min(0),
});

export type GridCell = z.infer<typeof GridCellSchema>;
export type GridMatrix = z.infer<typeof GridMatrixSchema>;
