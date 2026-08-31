import { describe, it, expect } from 'vitest';
import { pt } from '../../lib/i18n/dictionaries/pt';
import { en } from '../../lib/i18n/dictionaries/en';
import { es } from '../../lib/i18n/dictionaries/es';
import { DICTIONARIES } from '../../lib/i18n/context';

describe('i18n Multi-Language System', () => {
  it('contém dicionários completos para PT, EN e ES', () => {
    expect(DICTIONARIES.pt).toBeDefined();
    expect(DICTIONARIES.en).toBeDefined();
    expect(DICTIONARIES.es).toBeDefined();
  });

  it('possui traduções estruturadas para o cabeçalho e landing page', () => {
    expect(pt.common.createPattern).toBe('Criar Molde');
    expect(en.common.createPattern).toBe('Create Pattern');
    expect(es.common.createPattern).toBe('Crear Patrón');

    expect(pt.pricing.studioName).toBe('Studio Ateliê');
    expect(en.pricing.studioName).toBe('Studio Atelier');
    expect(es.pricing.studioName).toBe('Studio Atelier');
  });

  it('possui traduções completas para a Galeria Pública', () => {
    expect(pt.gallery.games).toContain('Games');
    expect(en.gallery.games).toContain('Games');
    expect(es.gallery.games).toContain('Videojuegos');

    expect(pt.gallery.anime).toContain('Anime');
    expect(en.gallery.anime).toContain('Anime');
    expect(es.gallery.anime).toContain('Anime');
  });
});
