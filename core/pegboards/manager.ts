import pegboardsData from '@/data/config/pegboards.json';
import beadTypesData from '@/data/config/bead-types.json';
import type { PegboardTemplate, BeadType } from '@/core/schemas/database';

export const BEAD_TYPES: BeadType[] = beadTypesData;
export const PEGBOARD_TEMPLATES: PegboardTemplate[] = pegboardsData;

export function getBeadTypeById(id: string): BeadType {
  const found = BEAD_TYPES.find((b) => b.id === id);
  return found || BEAD_TYPES[0];
}

export function getPegboardTemplateById(id: string): PegboardTemplate {
  const found = PEGBOARD_TEMPLATES.find((p) => p.id === id);
  return found || PEGBOARD_TEMPLATES[0];
}

export function listPegboardsByBeadType(beadTypeId: string): PegboardTemplate[] {
  return PEGBOARD_TEMPLATES.filter((p) => p.beadTypeId === beadTypeId);
}

export interface MultiBoardCalculation {
  template: PegboardTemplate;
  beadType: BeadType;
  boardsHorizontal: number;
  boardsVertical: number;
  totalBoards: number;
  pinsHorizontalPerBoard: number;
  pinsVerticalPerBoard: number;
  totalPinsHorizontal: number;
  totalPinsVertical: number;
  totalCapacityBeads: number;
  totalWidthCm: number;
  totalHeightCm: number;
}

export function calculateMultiBoardConfig(
  pegboardTemplateId: string,
  boardsHorizontal: number = 1,
  boardsVertical: number = 1
): MultiBoardCalculation {
  const template = getPegboardTemplateById(pegboardTemplateId);
  const beadType = getBeadTypeById(template.beadTypeId);

  const nX = Math.max(1, Math.min(boardsHorizontal, 10));
  const nY = Math.max(1, Math.min(boardsVertical, 10));

  const totalPinsHorizontal = nX * template.pinsHorizontal;
  const totalPinsVertical = nY * template.pinsVertical;
  const totalCapacityBeads = totalPinsHorizontal * totalPinsVertical;

  const totalWidthCm = +(nX * template.widthCm).toFixed(1);
  const totalHeightCm = +(nY * template.heightCm).toFixed(1);

  return {
    template,
    beadType,
    boardsHorizontal: nX,
    boardsVertical: nY,
    totalBoards: nX * nY,
    pinsHorizontalPerBoard: template.pinsHorizontal,
    pinsVerticalPerBoard: template.pinsVertical,
    totalPinsHorizontal,
    totalPinsVertical,
    totalCapacityBeads,
    totalWidthCm,
    totalHeightCm,
  };
}
