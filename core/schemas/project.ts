import { z } from 'zod';

export const BeadSummarySchema = z.object({
  code: z.string(),
  name: z.string(),
  hex: z.string(),
  count: z.number().int().min(0),
});

export const ExportConfigSchema = z.object({
  format: z.enum(['pdf', 'png', 'both']).default('pdf'),
  pageSize: z.enum(['A4', 'A3', 'Letter']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  cellSize: z.number().min(6).max(30).default(16),
  showCodes: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  showSummary: z.boolean().default(true),
  dpi: z.number().min(72).max(600).default(300),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().default('Untitled Project'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Grid dimensions & properties
  gridWidth: z.number().int().min(1).max(200),
  gridHeight: z.number().int().min(1).max(200),
  pegboardSize: z.number().int().default(29),

  // Active palette
  paletteId: z.string(),
  activeBrand: z.string(),
  activeSeries: z.string(),

  // Image Processing adjustments
  originalImageHash: z.string().optional(),
  ditherMode: z.enum(['none', 'floyd-steinberg', 'atkinson']).default('floyd-steinberg'),
  contrastAdjust: z.number().min(-100).max(100).default(0),
  saturationAdjust: z.number().min(-100).max(100).default(0),
  brightnessAdjust: z.number().min(-100).max(100).default(0),
  removeBackground: z.boolean().default(false),

  // Summary & Totals
  summary: z.array(BeadSummarySchema),
  totalBeads: z.number().int().min(0),

  // Export settings
  exportConfig: ExportConfigSchema,
});

export type BeadSummary = z.infer<typeof BeadSummarySchema>;
export type ExportConfig = z.infer<typeof ExportConfigSchema>;
export type Project = z.infer<typeof ProjectSchema>;
