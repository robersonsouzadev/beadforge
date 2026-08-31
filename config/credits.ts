export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Pacote Starter (10 Créditos)',
    credits: 10,
    priceBrl: 19.9,
    priceInCents: 1990,
    unitPriceBrl: '1,99',
    description: '10 Esculturas 3D por IA no BeadForge Ultra',
    badge: 'Iniciante',
  },
  popular: {
    id: 'popular',
    name: 'Pacote Popular (25 Créditos)',
    credits: 25,
    priceBrl: 39.9,
    priceInCents: 3990,
    unitPriceBrl: '1,59',
    description: '25 Esculturas 3D por IA • Mais Vendido',
    badge: 'Mais Vendido',
  },
  mega: {
    id: 'mega',
    name: 'Pacote Mega Studio (60 Créditos)',
    credits: 60,
    priceBrl: 79.9,
    priceInCents: 7990,
    unitPriceBrl: '1,33',
    description: '60 Esculturas 3D por IA • Melhor Custo-Benefício',
    badge: 'Melhor Valor',
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKAGES;
