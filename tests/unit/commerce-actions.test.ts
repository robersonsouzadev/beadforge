import { describe, it, expect, vi } from 'vitest';

describe('Commerce & Affiliate Recommendation Logic', () => {
  it('calcula a quantidade de pacotes necessarios com base no total de beads por cor', () => {
    const summary = [
      { code: 'A1', name: 'Branco Puro', hex: '#FFFFFF', count: 327 },
      { code: 'H10', name: 'Preto Intenso', hex: '#111111', count: 1450 },
      { code: 'B7', name: 'Azul Royal', hex: '#2980B9', count: 85 },
    ];

    const defaultPackSize = 1000;

    const result = summary.map((s) => {
      const packsNeeded = Math.max(1, Math.ceil(s.count / defaultPackSize));
      const totalBeads = packsNeeded * defaultPackSize;
      const wasteBeads = totalBeads - s.count;

      return {
        code: s.code,
        count: s.count,
        packsNeeded,
        totalBeads,
        wasteBeads,
      };
    });

    expect(result[0].packsNeeded).toBe(1);
    expect(result[0].totalBeads).toBe(1000);
    expect(result[0].wasteBeads).toBe(673);

    expect(result[1].packsNeeded).toBe(2);
    expect(result[1].totalBeads).toBe(2000);
    expect(result[1].wasteBeads).toBe(550);

    expect(result[2].packsNeeded).toBe(1);
    expect(result[2].totalBeads).toBe(1000);
  });

  it('injeta sub_id de rastreamento no link de afiliado da Shopee', () => {
    const baseShopeeUrl = 'https://shopee.com.br/search?keyword=mini+beads+2.6mm+A1';
    const colorCode = 'A1';
    const subId = `bf_bom_${colorCode.toLowerCase()}`;

    const sep = baseShopeeUrl.includes('?') ? '&' : '?';
    const affiliateUrl = `${baseShopeeUrl}${sep}sub_id=${subId}`;

    expect(affiliateUrl).toContain('sub_id=bf_bom_a1');
  });

  it('calcula o preco por bead com precisao de 4 casas decimais', () => {
    const priceBrl = 14.90;
    const quantity = 1000;
    const pricePerBead = Number((priceBrl / quantity).toFixed(4));

    expect(pricePerBead).toBe(0.0149);
  });
});
