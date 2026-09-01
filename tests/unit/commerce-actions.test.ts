import { describe, it, expect } from 'vitest';
import {
  evaluateProductFit,
  calculatePegboardRequirement,
  generateFullRecommendations,
  buildAffiliateUrl,
  type ProjectBOMInput,
  type CandidateProduct,
} from '@/core/commerce/recommendation-engine';

describe('Contextual Recommendation Engine', () => {
  const sampleBOM: ProjectBOMInput = {
    totalBeads: 3249,
    distinctColorCount: 24,
    beadSize: '2.6mm',
    gridWidth: 57,
    gridHeight: 57,
    colors: [
      { code: 'A1', name: 'Branco', hex: '#FFFFFF', count: 400 },
      { code: 'A4', name: 'Amarelo', hex: '#FFE953', count: 250 },
      { code: 'A7', name: 'Laranja', hex: '#FF7C2F', count: 180 },
      { code: 'A19', name: 'Vermelho', hex: '#C62828', count: 320 },
      { code: 'B3', name: 'Azul Céu', hex: '#85C1E9', count: 150 },
      { code: 'B7', name: 'Azul Royal', hex: '#2980B9', count: 200 },
      { code: 'B12', name: 'Azul Marinho', hex: '#1B4F72', count: 110 },
      { code: 'C8', name: 'Verde Grama', hex: '#27AE60', count: 95 },
      { code: 'C15', name: 'Verde Floresta', hex: '#145A32', count: 80 },
      { code: 'E6', name: 'Rosa', hex: '#E87090', count: 140 },
      { code: 'G8', name: 'Marrom', hex: '#8B5E3C', count: 130 },
      { code: 'H10', name: 'Preto', hex: '#111111', count: 650 },
      // ... outras 12 cores totalizando 24
      ...Array.from({ length: 12 }, (_, i) => ({
        code: `D${i + 1}`,
        name: `Tom ${i + 1}`,
        hex: '#AAAAAA',
        count: 45,
      })),
    ],
  };

  const productHeroML: CandidateProduct = {
    id: 'prod-ml-10k',
    merchantId: 'm-ml',
    merchantName: 'Mercado Livre',
    merchantSlug: 'mercadolivre',
    merchantProgramType: 'ml_affiliate',
    title: 'Conjunto 10.000 Hama Beads 2,6mm Miçangas Brinquedo 24 Cores',
    url: 'https://meli.la/2q4Xt3j',
    affiliateUrl: 'https://meli.la/2q4Xt3j',
    campaignTag: 'beadforgekits',
    brand: 'generic',
    beadSize: '2.6mm',
    quantityPerPack: 10000,
    colorCount: 24,
    priceBrl: 29.96,
    pricePerBead: 0.0030,
    priceVaries: true,
    rating: 4.85,
    reviewCount: 140,
    isAvailable: true,
    productType: 'multi_color_kit',
    badgeTag: 'best_value',
    estimatedCommissionPct: 12.0,
    priorityScore: 100,
    estimatedShippingDays: 2,
  };

  const productBigKitML: CandidateProduct = {
    id: 'prod-ml-42k',
    merchantId: 'm-ml',
    merchantName: 'Mercado Livre',
    merchantSlug: 'mercadolivre',
    merchantProgramType: 'ml_affiliate',
    title: 'Kit 42.000 Hama Beads 2,6mm - 120 Cores com Organizador',
    url: 'https://lista.mercadolivre.com.br/kit-120-cores',
    affiliateUrl: 'https://lista.mercadolivre.com.br/kit-120-cores',
    campaignTag: 'beadforgekits',
    brand: 'generic',
    beadSize: '2.6mm',
    quantityPerPack: 42000,
    colorCount: 120,
    priceBrl: 137.57,
    pricePerBead: 0.0033,
    priceVaries: true,
    rating: 4.90,
    reviewCount: 95,
    isAvailable: true,
    productType: 'multi_color_kit',
    badgeTag: 'most_complete',
    estimatedCommissionPct: 12.0,
    priorityScore: 85,
    estimatedShippingDays: 3,
  };

  const productPegboard57: CandidateProduct = {
    id: 'prod-peg-57',
    merchantId: 'm-ml',
    merchantName: 'Mercado Livre',
    merchantSlug: 'mercadolivre',
    merchantProgramType: 'ml_affiliate',
    title: 'Placa Pegboard Mini 2,6mm Quadrada 57x57 Pinos (14,5x14,5cm)',
    url: 'https://lista.mercadolivre.com.br/placa-57x57',
    affiliateUrl: 'https://lista.mercadolivre.com.br/placa-57x57',
    campaignTag: 'beadforgekits',
    brand: 'generic',
    beadSize: '2.6mm',
    quantityPerPack: 1,
    colorCount: 1,
    priceBrl: 19.90,
    pricePerBead: 19.90,
    priceVaries: true,
    rating: 4.88,
    reviewCount: 64,
    isAvailable: true,
    productType: 'pegboard',
    estimatedCommissionPct: 12.0,
    priorityScore: 90,
    estimatedShippingDays: 2,
    specsJson: { pinsHorizontal: 57, pinsVertical: 57, widthCm: 14.5, heightCm: 14.5 },
  };

  it('classifica o Kit 10.000 24 Cores do Mercado Livre como 🥇 Melhor Custo-Benefício para o projeto de 3.249 beads', () => {
    const result = evaluateProductFit(productHeroML, sampleBOM);

    expect(result).not.toBeNull();
    expect(result?.badge.key).toBe('best_value');
    expect(result?.badge.label).toContain('Melhor Custo-Benefício');
    expect(result?.coveragePct).toBe(100);
    expect(result?.volumePct).toBeGreaterThan(100); // 10.000 / 3.249 = 307%
    expect(result?.score).toBeGreaterThan(80);
  });

  it('classifica o Kit 42.000 120 Cores como 🥈 Mais Completo', () => {
    const result = evaluateProductFit(productBigKitML, sampleBOM);

    expect(result).not.toBeNull();
    expect(result?.badge.key).toBe('most_complete');
    expect(result?.badge.label).toContain('Mais Completo');
  });

  it('descarta automaticamente produtos com diametro incompativel (5.0mm para projeto de 2.6mm)', () => {
    const incompatibleProduct: CandidateProduct = {
      ...productHeroML,
      id: 'prod-incompatible',
      beadSize: '5.0mm',
    };

    const result = evaluateProductFit(incompatibleProduct, sampleBOM);
    expect(result).toBeNull();
  });

  it('calcula corretamente 1 placa 57x57 pinos para projeto de 57x57', () => {
    const pegboardRec = calculatePegboardRequirement(sampleBOM, [productPegboard57]);

    expect(pegboardRec.boardsNeeded).toBe(1);
    expect(pegboardRec.isModular).toBe(false);
    expect(pegboardRec.plateName).toContain('57x57 pinos');
    expect(pegboardRec.products.length).toBe(1);
  });

  it('calcula corretamente 4 placas modulares 57x57 para projeto grande de 114x114 pinos', () => {
    const bigBOM: ProjectBOMInput = {
      ...sampleBOM,
      gridWidth: 114,
      gridHeight: 114,
      totalBeads: 12996,
    };

    const pegboardRec = calculatePegboardRequirement(bigBOM, [productPegboard57]);

    expect(pegboardRec.boardsNeeded).toBe(4);
    expect(pegboardRec.isModular).toBe(true);
    expect(pegboardRec.totalPins).toBe(12996);
  });

  it('gera recomendacao completa com bestValueKit, alternativas e placas', () => {
    const fullRec = generateFullRecommendations(sampleBOM, [
      productHeroML,
      productBigKitML,
      productPegboard57,
    ]);

    expect(fullRec.bestValueKit?.product.id).toBe('prod-ml-10k');
    expect(fullRec.alternativeKits.length).toBe(1);
    expect(fullRec.alternativeKits[0].product.id).toBe('prod-ml-42k');
    expect(fullRec.compatiblePegboards?.boardsNeeded).toBe(1);
    expect(fullRec.summary.totalBeadsRequired).toBe(3249);
  });

  it('preserva URL de afiliado oficial do Mercado Livre', () => {
    const url = buildAffiliateUrl(productHeroML);
    expect(url).toBe('https://meli.la/2q4Xt3j');
  });
});
