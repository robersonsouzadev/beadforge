/**
 * Catálogo e Estrutura de Dados para a Central de Conteúdo e Aprendizado do BeadForge Studio
 * Preparado para futura evolução com tutoriais em texto, guias, dicas e projetos.
 */

export type ContentCategory =
  | 'comecando-agora'
  | 'montagem'
  | 'passando-ferro'
  | 'pixel-art'
  | 'projetos'
  | 'tecnicas-avancadas';

export interface CategoryMetadata {
  id: ContentCategory;
  label: string;
  description: string;
  badge: string;
}

export const COMMUNITY_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'comecando-agora',
    label: 'Começando agora',
    description: 'Conceitos básicos, materiais, pegboards e primeiros passos no mundo dos Fuse Beads.',
    badge: 'Iniciante',
  },
  {
    id: 'montagem',
    label: 'Montagem',
    description: 'Técnicas de posicionamento com pinças, organização de paletas e manuseio de matrizes.',
    badge: 'Prática',
  },
  {
    id: 'passando-ferro',
    label: 'Passando o ferro',
    description: 'Fusão perfeita, temperatura ideal do ferro de passar e o método da fita adesiva (Tape Method).',
    badge: 'Técnica',
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    description: 'Transformação de sprites 8-bit e 16-bit em moldes de alta fidelidade visual.',
    badge: 'Design',
  },
  {
    id: 'projetos',
    label: 'Projetos',
    description: 'Passo a passo completo de projetos temáticos, personagens e chaveiros colecionáveis.',
    badge: 'Inspiração',
  },
  {
    id: 'tecnicas-avancadas',
    label: 'Técnicas avançadas',
    description: 'Esculturas 3D multicamadas, acabamento fosco flat-melt e peças articuladas.',
    badge: 'Avançado',
  },
];

export interface CommunityContentItem {
  id: string;
  type: 'video' | 'guide' | 'tutorial' | 'project';
  title: string;
  channelOrAuthor: string;
  youtubeUrl: string;
  youtubeId: string;
  category: ContentCategory;
  description: string;
  thumbnailUrl?: string;
  featured?: boolean;
  language: 'pt-BR' | 'en';
  order: number;
}

export const COMMUNITY_VIDEOS: CommunityContentItem[] = [
  {
    id: 'vid-senix-how-to-make',
    type: 'video',
    title: 'HOW TO MAKE HAMA BEADS',
    channelOrAuthor: 'Senix Irabix',
    youtubeUrl: 'https://www.youtube.com/watch?v=eyCFlpTa4gw',
    youtubeId: 'eyCFlpTa4gw',
    category: 'comecando-agora',
    description:
      'Aprenda os conceitos básicos para começar a trabalhar com Hama Beads, escolher os materiais e montar seus primeiros projetos.',
    featured: true,
    language: 'en',
    order: 1,
  },
  {
    id: 'vid-faris-perler-beginners',
    type: 'video',
    title: 'How to Perler Beads for Beginners',
    channelOrAuthor: 'Faris',
    youtubeUrl: 'https://www.youtube.com/watch?v=u4us4pGNOC0',
    youtubeId: 'u4us4pGNOC0',
    category: 'comecando-agora',
    description:
      'Um guia para iniciantes mostrando materiais, montagem e dicas para começar a criar com Perler Beads.',
    featured: false,
    language: 'en',
    order: 2,
  },
  {
    id: 'vid-gamerview-especial',
    type: 'video',
    title: 'Especial | Tudo sobre Perler Beads',
    channelOrAuthor: 'Gamerview',
    youtubeUrl: 'https://www.youtube.com/watch?v=wRq5pjgt_P0',
    youtubeId: 'wRq5pjgt_P0',
    category: 'comecando-agora',
    description:
      'Conteúdo em português explicando a técnica, os materiais e como criar personagens em estilo 8-bit e 16-bit.',
    featured: false,
    language: 'pt-BR',
    order: 3,
  },
  {
    id: 'vid-familia-porcides-step-by-step',
    type: 'video',
    title: 'HAMA BEADS TUTORIAL: STEP-BY-STEP GUIDE',
    channelOrAuthor: 'Família Porcides',
    youtubeUrl: 'https://www.youtube.com/watch?v=s-vyoIZGSyM',
    youtubeId: 's-vyoIZGSyM',
    category: 'montagem',
    description: 'Tutorial passo a passo para montar um projeto com Hama Beads.',
    featured: false,
    language: 'pt-BR',
    order: 4,
  },
  {
    id: 'vid-umcomo-panda',
    type: 'video',
    title: 'Tutorial de Perler Beads - Panda',
    channelOrAuthor: 'umComo',
    youtubeUrl: 'https://www.youtube.com/watch?v=Uf5d0u-kzik',
    youtubeId: 'Uf5d0u-kzik',
    category: 'projetos',
    description:
      'Aprenda a criar um projeto de Perler Beads acompanhando um exemplo passo a passo.',
    featured: false,
    language: 'pt-BR',
    order: 5,
  },
];

/**
 * Retorna a URL da miniatura de alta resolução do YouTube com fallback
 */
export function getYouTubeThumbnail(youtubeId: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}
