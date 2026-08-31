'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getGalleryPatternsAction,
  likePatternAction,
  type GalleryPatternDTO,
} from '@/app/actions/gallery';
import {
  Globe,
  Search,
  Heart,
  Sparkles,
  Layers,
  Palette,
  ArrowRight,
  TrendingUp,
  Filter,
  User,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Todos os Moldes' },
  { id: 'games', label: '🎮 Games' },
  { id: 'anime', label: '⛩️ Anime & Mangá' },
  { id: 'geek', label: '⚡ Geek & Heróis' },
  { id: 'cartoons', label: '📺 Desenhos' },
  { id: 'decor', label: '🎨 Decoração' },
  { id: 'animals', label: '🐾 Animais' },
];

export default function GalleryPage() {
  const [patterns, setPatterns] = useState<GalleryPatternDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'recent' | 'small'>('popular');
  const [likedSlugs, setLikedSlugs] = useState<Set<string>>(new Set());

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const data = await getGalleryPatternsAction({
        search: searchQuery,
        category: selectedCategory,
        sort: selectedSort,
      });
      setPatterns(data);
    } catch (err) {
      console.error('Failed to load gallery patterns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, [selectedCategory, selectedSort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatterns();
  };

  const handleLike = async (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (likedSlugs.has(slug)) return;

    setLikedSlugs((prev) => new Set(prev).add(slug));
    setPatterns((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, likesCount: p.likesCount + 1 } : p))
    );

    try {
      await likePatternAction(slug);
    } catch (err) {
      console.error('Failed to like pattern:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      {/* ── Public Gallery Hero ── */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-b border-zinc-800/80 px-4 py-12 sm:py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold border border-amber-400/25">
            <Globe className="w-3.5 h-3.5" />
            <span>Galeria Pública da Comunidade</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Descubra e Baixe Moldes de <span className="text-amber-400">Fuse Beads</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Milhares de ideias e padrões em pixel art criados por ateliês e artesãos do Brasil. Remixe e edite qualquer molde gratuitamente.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur mt-4"
          >
            <Search className="w-4 h-4 ml-3 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Mario, Pokémon, Chaveiro, Anime..."
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none px-2 py-1.5"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow transition shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* ── Main Gallery Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {/* Category Pills & Sort Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Ordenar por:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="popular">Mais Populares</option>
              <option value="recent">Mais Recentes</option>
              <option value="small">Menos Beads</option>
            </select>
          </div>
        </div>

        {/* Patterns Grid */}
        {isLoading ? (
          <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Carregando moldes da galeria...</span>
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-300">
              Nenhum molde encontrado para esta categoria ou busca
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Seja o primeiro a publicar um molde na galeria pública e ajude outros criadores de beads!
            </p>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow hover:bg-amber-300 transition"
            >
              <span>Criar Molde no Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {patterns.map((pat) => (
              <Link
                key={pat.id}
                href={`/gallery/${pat.slug}`}
                className="bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition duration-200 group hover:shadow-xl hover:shadow-black/40 relative"
              >
                {/* Thumbnail Preview with Subtle Background */}
                <div className="relative aspect-square w-full rounded-xl bg-zinc-950/90 border border-zinc-800/80 flex items-center justify-center p-3 overflow-hidden">
                  {pat.thumbnailUrl ? (
                    <img
                      src={pat.thumbnailUrl}
                      alt={pat.title}
                      className="w-full h-full object-contain rounded drop-shadow-md group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Layers className="w-8 h-8 text-zinc-600 opacity-40" />
                  )}

                  {/* Likes Button floating on top-right */}
                  <button
                    onClick={(e) => handleLike(pat.slug, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-900/80 backdrop-blur border border-zinc-700/60 text-zinc-300 hover:text-rose-400 transition flex items-center gap-1 text-[10px] font-bold shadow"
                  >
                    <Heart
                      className={`w-3 h-3 ${
                        likedSlugs.has(pat.slug) ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span>{pat.likesCount}</span>
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="font-mono">{pat.beadCount.toLocaleString('pt-BR')} peças</span>
                    <span>&bull;</span>
                    <span className="font-mono text-amber-400">{pat.colorCount} cores</span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-amber-400 transition truncate" title={pat.title}>
                    {pat.title}
                  </h3>

                  {pat.creator && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-0.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-300 font-bold overflow-hidden shrink-0">
                        {pat.creator.avatarUrl ? (
                          <img src={pat.creator.avatarUrl} alt={pat.creator.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-2.5 h-2.5" />
                        )}
                      </div>
                      <span className="truncate">{pat.creator.name}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span>Ver Molde & PDF</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500 space-y-2">
        <p>BeadForge Studio &bull; A maior comunidade brasileira de artesãos em Fuse Beads</p>
      </footer>
    </div>
  );
}
