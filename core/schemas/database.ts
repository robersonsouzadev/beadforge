export interface BeadType {
  id: string;
  name: string;
  diameterMm: number;
  description: string;
  isDefault?: boolean;
}

export interface PegboardTemplate {
  id: string;
  name: string;
  beadTypeId: string;
  widthCm: number;
  heightCm: number;
  pinsHorizontal: number;
  pinsVertical: number;
  totalBeads: number;
  description?: string;
}

export interface ColorDefinition {
  code: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  symbol?: string;
  finish?: 'solid' | 'translucent' | 'neon' | 'metallic' | 'glow' | 'pastel';
  inStock?: boolean;
}

export interface ColorPalette {
  id: string;
  brand: string;
  series: string;
  beadSize: string;
  beadTypeId: string;
  version: string;
  colors: ColorDefinition[];
}

export interface ProjectSettings {
  beadTypeId: string;
  pegboardTemplateId: string;
  boardsHorizontal: number;
  boardsVertical: number;
  paletteId: string;
  ditherMode: 'none' | 'floyd-steinberg' | 'atkinson';
  scale: number;
  offsetX: number;
  offsetY: number;
  contrast: number;
  saturation: number;
  brightness: number;
  removeBackground: boolean;
  bgTolerance: number;
}

export interface MaterialItem {
  code: string;
  name: string;
  hex: string;
  count: number;
  percentage: number;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  totalWidthPins: number;
  totalHeightPins: number;
  totalBeads: number;
  colorsCount: number;
}

export interface BeadProjectData {
  version: '2.0';
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  materials: MaterialItem[];
  grid: {
    width: number;
    height: number;
    cells: Array<Array<{
      r: number;
      c: number;
      code: string;
      name: string;
      hex: string;
      isEmpty: boolean;
      plateRow: number;
      plateCol: number;
    }>>;
  };
}
