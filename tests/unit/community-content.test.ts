import { describe, it, expect } from 'vitest';
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_VIDEOS,
  getYouTubeThumbnail,
} from '../../config/community-content';

describe('Central de Conteúdo e Aprendizado Comunitário (Config & Models)', () => {
  it('contém as 6 categorias obrigatórias da Central de Conteúdo', () => {
    const categoryIds = COMMUNITY_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('comecando-agora');
    expect(categoryIds).toContain('montagem');
    expect(categoryIds).toContain('passando-ferro');
    expect(categoryIds).toContain('pixel-art');
    expect(categoryIds).toContain('projetos');
    expect(categoryIds).toContain('tecnicas-avancadas');
  });

  it('possui os 5 vídeos tutoriais oficiais com metadados íntegros', () => {
    expect(COMMUNITY_VIDEOS).toHaveLength(5);

    const videoIds = COMMUNITY_VIDEOS.map((v) => v.youtubeId);
    expect(videoIds).toContain('eyCFlpTa4gw'); // Senix Irabix
    expect(videoIds).toContain('u4us4pGNOC0'); // Faris
    expect(videoIds).toContain('wRq5pjgt_P0'); // Gamerview
    expect(videoIds).toContain('s-vyoIZGSyM'); // Família Porcides
    expect(videoIds).toContain('Uf5d0u-kzik'); // umComo
  });

  it('destaca o vídeo de introdução principal da Senix Irabix', () => {
    const featured = COMMUNITY_VIDEOS.find((v) => v.featured);
    expect(featured).toBeDefined();
    expect(featured?.youtubeId).toBe('eyCFlpTa4gw');
    expect(featured?.channelOrAuthor).toBe('Senix Irabix');
    expect(featured?.category).toBe('comecando-agora');
  });

  it('gera miniaturas de alta qualidade do YouTube de forma previsível', () => {
    const thumb = getYouTubeThumbnail('eyCFlpTa4gw');
    expect(thumb).toBe('https://img.youtube.com/vi/eyCFlpTa4gw/hqdefault.jpg');

    const customThumb = getYouTubeThumbnail('eyCFlpTa4gw', 'https://custom.cdn/thumb.jpg');
    expect(customThumb).toBe('https://custom.cdn/thumb.jpg');
  });
});
