export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PlanLimits {
  maxProjects: number;
  exportFormats: ('png' | 'pdf' | 'csv')[];
  allow3D: boolean;
  maxDimension: number; // Max pegboard width/height in beads
}

export interface Plan {
  id: 'free' | 'pro' | 'studio';
  name: string;
  badge?: string;
  description: string;
  prices: {
    monthly: {
      amount: number;
      priceId: string;
      displayPrice: string;
      period: string;
    };
    yearly: {
      amount: number;
      priceId: string;
      displayPrice: string;
      period: string;
      savingsBadge?: string;
    };
  };
  features: PlanFeature[];
  limits: PlanLimits;
}

export const SUBSCRIPTION_PLANS: Record<'free' | 'pro' | 'studio', Plan> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    description: 'Para entusiastas que querem criar seus primeiros moldes sem custo.',
    prices: {
      monthly: {
        amount: 0,
        priceId: '',
        displayPrice: 'R$ 0',
        period: '/mês',
      },
      yearly: {
        amount: 0,
        priceId: '',
        displayPrice: 'R$ 0',
        period: '/ano',
      },
    },
    limits: {
      maxProjects: 3,
      exportFormats: ['png', 'pdf', 'csv'],
      allow3D: false,
      maxDimension: 200,
    },
    features: [
      { name: 'Editor 2D completo sem cadastro', included: true },
      { name: 'Exportação PDF 1:1 e CSV (com marca d\'água discreta)', included: true },
      { name: 'Paletas oficiais Hama, Artkal e Pindoo', included: true },
      { name: 'Multi-placas até 4×4', included: true },
      { name: 'Até 3 projetos salvos na nuvem', included: true },
      { name: 'PDF 1:1 sem marca d\'água', included: false },
      { name: 'Estoque Físico & Baixa Automática', included: false },
      { name: 'Calculadora de Custos & Preço com Taxas', included: false },
      { name: 'Gestão de Pedidos & Provas WhatsApp', included: false },
      { name: 'PDF White-Label com marca do Ateliê', included: false },
      { name: 'Ultra 3D Voxel Studio completo', included: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Creator Pro',
    badge: 'Popular',
    description: 'Para hobbistas avançados e criadores de conteúdo em Pixel Art.',
    prices: {
      monthly: {
        amount: 19.9,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_creator_monthly',
        displayPrice: 'R$ 19,90',
        period: '/mês',
      },
      yearly: {
        amount: 199.0,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || 'price_creator_yearly',
        displayPrice: 'R$ 16,50',
        period: '/mês (faturado R$ 199/ano)',
        savingsBadge: 'Economize 17%',
      },
    },
    limits: {
      maxProjects: Infinity,
      exportFormats: ['png', 'pdf', 'csv'],
      allow3D: false,
      maxDimension: 300,
    },
    features: [
      { name: 'Tudo do plano Gratuito', included: true },
      { name: 'PDFs 1:1 limpos sem marca d\'água', included: true },
      { name: 'Projetos ILIMITADOS na nuvem', included: true },
      { name: 'Imagens PNG em Alta Resolução 4K', included: true },
      { name: 'Assistente de Montagem Bead-a-Bead', included: true },
      { name: 'Galeria Pública & Perfil de Criador', included: true },
      { name: 'Estoque Físico & Baixa Automática', included: false },
      { name: 'Calculadora de Custos & Preço com Taxas', included: false },
      { name: 'Gestão de Pedidos & Provas WhatsApp', included: false },
      { name: 'PDF White-Label com marca do Ateliê', included: false },
      { name: 'Ultra 3D Voxel Studio completo', included: false },
    ],
  },
  studio: {
    id: 'studio',
    name: 'Studio Ateliê',
    badge: 'O Sistema Completo para Vendas',
    description: 'Para artesãos e sellers que vivem de encomendas e vendas em marketplaces.',
    prices: {
      monthly: {
        amount: 79.0,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_MONTHLY || 'price_studio_monthly',
        displayPrice: 'R$ 79,00',
        period: '/mês',
      },
      yearly: {
        amount: 790.0,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_YEARLY || 'price_studio_yearly',
        displayPrice: 'R$ 65,80',
        period: '/mês (faturado R$ 790/ano)',
        savingsBadge: 'Economize 17% (2 meses grátis)',
      },
    },
    limits: {
      maxProjects: Infinity,
      exportFormats: ['png', 'pdf', 'csv'],
      allow3D: true,
      maxDimension: 500,
    },
    features: [
      { name: 'Tudo do plano Creator Pro', included: true },
      { name: 'Estoque Físico Multi-Marca Ilimitado', included: true },
      { name: 'BOM Inteligente & Baixa Automática', included: true },
      { name: 'Calculadora de Custos & Taxas (Shopee/ML/Elo7)', included: true },
      { name: 'CRM de Clientes & WhatsApp Direto', included: true },
      { name: 'Pipeline de Pedidos & Produção', included: true },
      { name: 'Link Público de Prova de Aprovação (WhatsApp)', included: true },
      { name: 'PDF White-Label com o branding do seu Ateliê', included: true },
      { name: 'Ultra 3D Voxel Studio completo (.VOX, .STL, .3MF)', included: true },
      { name: 'Suporte Prioritário VIP', included: true },
    ],
  },
};
