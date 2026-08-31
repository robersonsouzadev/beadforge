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
  id: 'free' | 'pro';
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

export const SUBSCRIPTION_PLANS: Record<'free' | 'pro', Plan> = {
  free: {
    id: 'free',
    name: 'Gratuito',
    description: 'Para quem está começando e quer criar e exportar seus moldes 2D.',
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
      { name: 'Editor 2D completo (Canvas)', included: true },
      { name: 'Exportação em imagem PNG', included: true },
      { name: 'Exportação vetorial em PDF 1:1 (com marca d\'água discreta)', included: true },
      { name: 'Lista de Materiais (BOM) em CSV', included: true },
      { name: 'Dithering e ajuste de contraste/brilho', included: true },
      { name: 'Paletas oficiais Hama, Artkal e Pindoo', included: true },
      { name: 'Multi-placas até 4×4', included: true },
      { name: 'Até 3 projetos salvos na nuvem', included: true },
      { name: 'PDF sem marca d\'água / White-label', included: false },
      { name: 'Editor Ultra 3D (esculturas e voxels)', included: false },
      { name: 'Importação 3D (.VOX, .STL, .3MF, .OBJ, .GLB)', included: false },
      { name: 'Projetos ilimitados na nuvem', included: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Mais Popular',
    description: 'Para criadores e artesãos que produzem moldes profissionais e peças 3D.',
    prices: {
      monthly: {
        amount: 29.9,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',
        displayPrice: 'R$ 29,90',
        period: '/mês',
      },
      yearly: {
        amount: 299.0,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly_placeholder',
        displayPrice: 'R$ 24,90',
        period: '/mês (faturado R$ 299/ano)',
        savingsBadge: 'Economize 17% (2 meses grátis)',
      },
    },
    limits: {
      maxProjects: Infinity,
      exportFormats: ['png', 'pdf', 'csv'],
      allow3D: true,
      maxDimension: 300,
    },
    features: [
      { name: 'Editor 2D completo (Canvas)', included: true },
      { name: 'Projetos ILIMITADOS na nuvem', included: true },
      { name: 'Exportação em imagem PNG em Alta Resolução', included: true },
      { name: 'Exportação vetorial em PDF 1:1 sem marca d\'água', included: true },
      { name: 'Lista de Materiais (BOM) em CSV e resumo', included: true },
      { name: 'Editor Ultra 3D (esculturas e fatiamento voxel)', included: true },
      { name: 'Importação 3D (.VOX, .STL, .3MF, .OBJ, .GLB)', included: true },
      { name: 'Guia de montagem 3D interativo passo a passo', included: true },
      { name: 'Modo Multipart para modelos multicoloridos', included: true },
      { name: 'Cálculo de peso estimado e placas necessárias', included: true },
      { name: 'Suporte prioritário', included: true },
    ],
  },
};
