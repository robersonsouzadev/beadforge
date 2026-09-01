/**
 * BeadForge Studio - Contextual Recommendation Engine
 * Motor de Recomendação de Materiais & Kits de Afiliados
 */

export interface ProjectBOMInput {
  totalBeads: number;
  distinctColorCount: number;
  beadSize: string; // '2.6mm' | '5.0mm'
  gridWidth: number;
  gridHeight: number;
  colors: Array<{
    code: string;
    name: string;
    hex: string;
    count: number;
  }>;
}

export interface CandidateProduct {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  merchantProgramType: string;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  externalSku?: string | null;
  title: string;
  shortDescription?: string | null;
  url: string;
  affiliateUrl?: string | null;
  campaignTag?: string | null;
  brand: string;
  beadSize: string;
  colorCode?: string | null;
  colorHex?: string | null;
  quantityPerPack: number;
  colorCount: number;
  priceBrl: number;
  previousPriceBrl?: number | null;
  pricePerBead: number;
  priceVaries: boolean;
  rating: number;
  reviewCount: number;
  sellerName?: string | null;
  isAvailable: boolean;
  productType: string;
  badgeTag?: string | null;
  estimatedCommissionPct: number;
  priorityScore: number;
  imageUrl?: string | null;
  estimatedShippingDays: number;
  specsJson?: Record<string, any> | null;
  includedColors?: Array<{
    code: string;
    name: string;
    hex: string;
  }>;
}

export interface RecommendationResult {
  score: number;
  coveragePct: number;
  volumePct: number;
  badge: {
    key: string;
    label: string;
    icon: string;
    color: string;
  };
  product: CandidateProduct;
  formattedAffiliateUrl: string;
  reasonText: string;
}

export interface PegboardRecommendation {
  boardsNeeded: number;
  plateName: string;
  pinsGrid: string;
  totalPins: number;
  isModular: boolean;
  products: CandidateProduct[];
}

export interface FullProjectRecommendations {
  summary: {
    totalBeadsRequired: number;
    distinctColorsRequired: number;
    beadSize: string;
    gridDimensions: string;
    pegboardSetup: string;
  };
  bestValueKit: RecommendationResult | null;
  alternativeKits: RecommendationResult[];
  compatiblePegboards: PegboardRecommendation | null;
  accessories: CandidateProduct[];
  colorRefills: Array<{
    colorCode: string;
    colorName: string;
    colorHex: string;
    requiredCount: number;
    packsNeeded: number;
    options: CandidateProduct[];
  }>;
}

/**
 * Formata URL de afiliado injetando a tag de campanha apropriada (ex: beadforgekits)
 */
export function buildAffiliateUrl(
  product: CandidateProduct,
  defaultMerchantTag: string = 'beadforgekits',
  subPlacement: string = 'editor_bom'
): string {
  let url = product.affiliateUrl || product.url;
  const tag = product.campaignTag || defaultMerchantTag || 'beadforgekits';

  if (!url) return '';

  // Se já for link encurtado ou direto do Mercado Livre (ex: meli.la/xxx)
  if (url.includes('meli.la') || url.includes('mercadolivre.com')) {
    return url;
  }

  // Se for Shopee com parâmetros de afiliado
  if (product.merchantSlug === 'shopee') {
    const sep = url.includes('?') ? '&' : '?';
    const subId = `${tag}_${subPlacement}`;
    if (!url.includes('sub_id=')) {
      url = `${url}${sep}sub_id=${encodeURIComponent(subId)}`;
    }
  }

  return url;
}

/**
 * Calcula a pontuação e cobertura de um produto em relação ao projeto
 */
export function evaluateProductFit(
  product: CandidateProduct,
  bom: ProjectBOMInput,
  minMarketPricePerBead: number = 0.0028
): RecommendationResult | null {
  // 1. Filtro Rígido de Compatibilidade
  if (!product.isAvailable) return null;
  
  // Verifica diâmetro quando aplicável (produtos de beads)
  const isBeadProduct = ['multi_color_kit', 'single_color', 'starter_kit'].includes(product.productType);
  if (isBeadProduct && product.beadSize && bom.beadSize && product.beadSize !== bom.beadSize) {
    return null;
  }

  // 2. Score de Cobertura de Cores (S_cov)
  let coveragePct = 0;
  if (product.productType === 'multi_color_kit' || product.productType === 'starter_kit') {
    if (product.includedColors && product.includedColors.length > 0) {
      const includedSet = new Set(product.includedColors.map((c) => c.code.toUpperCase()));
      const matches = bom.colors.filter((c) => includedSet.has(c.code.toUpperCase())).length;
      coveragePct = Number(((matches / Math.max(1, bom.distinctColorCount)) * 100).toFixed(1));
    } else {
      // Se for kit com contagem de cores declarada (ex: 24 cores)
      const ratio = Math.min(1.0, product.colorCount / Math.max(1, bom.distinctColorCount));
      coveragePct = Number((ratio * 100).toFixed(1));
    }
  } else if (product.productType === 'single_color') {
    const isPresent = bom.colors.some((c) => c.code.toUpperCase() === (product.colorCode || '').toUpperCase());
    coveragePct = isPresent ? 100 : 0;
  } else {
    coveragePct = 100; // Placas e acessórios não dependem de cor
  }

  // 3. Score de Suficiência de Volume (S_vol)
  const volumeRatio = product.quantityPerPack / Math.max(1, bom.totalBeads);
  const volumePct = Number((Math.min(200, volumeRatio * 100)).toFixed(1));
  const sVol = Math.min(100, volumeRatio * 100);

  // 4. Score de Eficiência Econômica (S_econ)
  const ppb = product.pricePerBead || (product.priceBrl / Math.max(1, product.quantityPerPack));
  const sEcon = Math.max(0, Math.min(100, 100 - ((ppb - minMarketPricePerBead) / minMarketPricePerBead) * 50));

  // 5. Score de Qualidade / Avaliação (S_qual)
  const ratingNorm = (product.rating / 5.0) * 70;
  const reviewNorm = Math.min(1.0, (product.reviewCount || 10) / 100) * 30;
  const sQual = ratingNorm + reviewNorm;

  // 6. Modificador Comercial (M_comm) - Fator de desempate
  const commFactor = 1.0 + (product.estimatedCommissionPct / 100) * 0.3 + (product.priorityScore / 100) * 0.1;

  // 7. Fórmula Final Ponderada
  // W_cov = 0.40, W_vol = 0.25, W_econ = 0.20, W_qual = 0.15
  const baseScore = (coveragePct * 0.40) + (sVol * 0.25) + (sEcon * 0.20) + (sQual * 0.15);
  const finalScore = Number((baseScore * commFactor).toFixed(2));

  // 8. Determina Badge e Texto de Justificativa
  let badge = {
    key: 'recommended',
    label: 'Recomendado',
    icon: 'Sparkles',
    color: 'amber',
  };

  let reasonText = `Supre ${volumePct}% do volume necessário`;

  if (product.quantityPerPack >= bom.totalBeads && coveragePct >= 80 && product.priceBrl <= 40) {
    badge = {
      key: 'best_value',
      label: '🥇 Melhor Custo-Benefício',
      icon: 'Trophy',
      color: 'emerald',
    };
    reasonText = `Supre 100% das ${bom.totalBeads.toLocaleString('pt-BR')} peças com menor custo por bead`;
  } else if (product.colorCount >= 48 || product.colorCount > bom.distinctColorCount * 1.5) {
    badge = {
      key: 'most_complete',
      label: '🥈 Mais Completo',
      icon: 'Layers',
      color: 'sky',
    };
    reasonText = `Variedade gigante de ${product.colorCount} cores para projetos complexos`;
  } else if (product.quantityPerPack >= 24000) {
    badge = {
      key: 'high_volume',
      label: '🥉 Para Quem Produz Muito',
      icon: 'Boxes',
      color: 'purple',
    };
    reasonText = `Grande volume (${product.quantityPerPack.toLocaleString('pt-BR')} beads) para estúdios`;
  }

  return {
    score: finalScore,
    coveragePct,
    volumePct,
    badge,
    product,
    formattedAffiliateUrl: buildAffiliateUrl(product),
    reasonText,
  };
}

/**
 * Calcula a necessidade de placas pegboards para o projeto
 */
export function calculatePegboardRequirement(
  bom: ProjectBOMInput,
  availablePegboards: CandidateProduct[]
): PegboardRecommendation {
  const isMini = bom.beadSize === '2.6mm';
  const boardPins = isMini ? 57 : 29; // Placa padrão 14.5x14.5cm: Mini = 57x57, Midi = 29x29

  const boardsH = Math.max(1, Math.ceil(bom.gridWidth / boardPins));
  const boardsV = Math.max(1, Math.ceil(bom.gridHeight / boardPins));
  const totalBoards = boardsH * boardsV;

  const plateName = isMini
    ? 'Placa Pegboard Mini 57x57 pinos (14,5 x 14,5 cm)'
    : 'Placa Pegboard Midi 29x29 pinos (14,5 x 14,5 cm)';

  const matchingProducts = availablePegboards.filter((p) => {
    return p.beadSize === bom.beadSize && p.isAvailable;
  });

  return {
    boardsNeeded: totalBoards,
    plateName,
    pinsGrid: `${boardsH * boardPins} x ${boardsV * boardPins} pinos (${boardsH}x${boardsV} placas)`,
    totalPins: totalBoards * boardPins * boardPins,
    isModular: totalBoards > 1,
    products: matchingProducts,
  };
}

/**
 * Executa o motor de recomendação completo para o projeto ativo
 */
export function generateFullRecommendations(
  bom: ProjectBOMInput,
  catalog: CandidateProduct[]
): FullProjectRecommendations {
  // Separa produtos por tipo
  const kits = catalog.filter((p) => ['multi_color_kit', 'starter_kit'].includes(p.productType));
  const pegboards = catalog.filter((p) => p.productType === 'pegboard');
  const accessories = catalog.filter((p) => ['tool', 'ironing_paper', 'storage'].includes(p.productType) && p.isAvailable);
  const singleColors = catalog.filter((p) => p.productType === 'single_color' && p.isAvailable);

  // Avalia kits
  const evaluatedKits: RecommendationResult[] = [];
  for (const kit of kits) {
    const result = evaluateProductFit(kit, bom);
    if (result) {
      evaluatedKits.push(result);
    }
  }

  // Ordena kits por score
  evaluatedKits.sort((a, b) => b.score - a.score);

  const bestValueKit = evaluatedKits[0] || null;
  const alternativeKits = evaluatedKits.slice(1, 6);

  // Calcula placas necessárias
  const pegboardRec = calculatePegboardRequirement(bom, pegboards);

  // Mapeia opções de refil por cor
  const colorRefills = bom.colors.map((c) => {
    const code = c.code.toUpperCase();
    const matchingSingle = singleColors.filter((p) => (p.colorCode || '').toUpperCase() === code);
    const defaultPack = matchingSingle[0]?.quantityPerPack || 1000;
    const packsNeeded = Math.max(1, Math.ceil(c.count / defaultPack));

    return {
      colorCode: code,
      colorName: c.name,
      colorHex: c.hex,
      requiredCount: c.count,
      packsNeeded,
      options: matchingSingle,
    };
  });

  return {
    summary: {
      totalBeadsRequired: bom.totalBeads,
      distinctColorsRequired: bom.distinctColorCount,
      beadSize: bom.beadSize,
      gridDimensions: `${bom.gridWidth} x ${bom.gridHeight} pinos`,
      pegboardSetup: `${pegboardRec.boardsNeeded}x ${pegboardRec.plateName}`,
    },
    bestValueKit,
    alternativeKits,
    compatiblePegboards: pegboardRec,
    accessories,
    colorRefills,
  };
}
