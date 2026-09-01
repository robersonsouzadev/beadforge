'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  ArrowRight,
  GraduationCap,
  Layers,
  Video,
  Tv,
  BookOpen,
  Wrench,
  Flame,
  Grid,
  Palette,
} from 'lucide-react';
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_VIDEOS,
  CommunityContentItem,
  ContentCategory,
  getYouTubeThumbnail,
} from '@/config/community-content';
import { VideoPlayerModal } from './VideoPlayerModal';

export function CommunityLearningSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<CommunityContentItem | null>(null);

  // Filtra os vídeos de acordo com a categoria selecionada
  const filteredVideos = useMemo(() => {
    if (selectedCategory === 'all') {
      return COMMUNITY_VIDEOS;
    }
    return COMMUNITY_VIDEOS.filter((v) => v.category === selectedCategory);
  }, [selectedCategory]);

  // Identifica o vídeo principal em destaque (ou o primeiro do filtro)
  const featuredVideo = useMemo(() => {
    if (selectedCategory === 'all') {
      return COMMUNITY_VIDEOS.find((v) => v.featured) || COMMUNITY_VIDEOS[0];
    }
    return filteredVideos[0] || null;
  }, [selectedCategory, filteredVideos]);

  // Vídeos secundários para exibição no grid
  const secondaryVideos = useMemo(() => {
    if (selectedCategory === 'all') {
      return filteredVideos.filter((v) => v.id !== featuredVideo?.id);
    }
    return filteredVideos.slice(1);
  }, [selectedCategory, filteredVideos, featuredVideo]);

  // Mapeamento de contagem por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: COMMUNITY_VIDEOS.length };
    COMMUNITY_CATEGORIES.forEach((cat) => {
      counts[cat.id] = COMMUNITY_VIDEOS.filter((v) => v.category === cat.id).length;
    });
    return counts;
  }, []);

  return (
    <section id="community-learning" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* ── Section Header ── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-inner">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Central de Aprendizado</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          Aprenda com a <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">comunidade</span>
        </h2>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Do primeiro projeto às técnicas mais avançadas, aprenda a criar com Hama Beads, dominar o ferro de passar e transformar qualquer ideia em Pixel Art.
        </p>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 pt-1 custom-scrollbar no-scrollbar select-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition duration-150 flex items-center gap-2 border ${
            selectedCategory === 'all'
              ? 'bg-amber-400 border-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 ring-1 ring-amber-400/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <span>Todos os conteúdos</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
            selectedCategory === 'all' ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'
          }`}>
            {categoryCounts.all}
          </span>
        </button>

        {COMMUNITY_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition duration-150 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-amber-400 border-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20 ring-1 ring-amber-400/50'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      {filteredVideos.length === 0 ? (
        /* Empty Category State */
        <div className="text-center py-16 px-6 rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800 space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Novos tutoriais em produção</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Estamos preparando guias passo a passo para esta categoria. Enquanto isso, confira os conteúdos em <strong>Começando agora</strong> e <strong>Montagem</strong>!
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold rounded-xl border border-zinc-700 transition"
          >
            Ver todos os tutoriais
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Featured Hero Spotlight Video ── */}
          {featuredVideo && (
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 hover:border-amber-500/30 transition duration-300 shadow-2xl p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Video Click-to-Play Thumbnail Preview (7 cols) */}
                <div
                  onClick={() => setActiveVideo(featuredVideo)}
                  className="lg:col-span-7 relative aspect-video w-full rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden group cursor-pointer shadow-xl ring-1 ring-white/5"
                >
                  <img
                    src={getYouTubeThumbnail(featuredVideo.youtubeId, featuredVideo.thumbnailUrl)}
                    alt={featuredVideo.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20" />

                  {/* Big Stylized Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center shadow-2xl shadow-amber-500/40 group-hover:scale-110 transition duration-300 transform">
                      <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-zinc-950 translate-x-0.5" />
                    </div>
                  </div>

                  {/* Badge floating on thumbnail */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur border border-zinc-700/60 text-amber-400 text-[11px] font-extrabold flex items-center gap-1.5 uppercase">
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span>Tutorial em Vídeo</span>
                  </div>
                </div>

                {/* Video Info & CTAs (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      ⭐ Tutorial Recomendado
                    </span>
                    <span className="text-zinc-600">&bull;</span>
                    <span className="text-xs text-zinc-400 font-semibold">{featuredVideo.channelOrAuthor}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    {featuredVideo.title}
                  </h3>

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {featuredVideo.description}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => setActiveVideo(featuredVideo)}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02] cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-zinc-950" />
                      <span>Assistir Tutorial Completo</span>
                    </button>

                    <Link
                      href="/editor"
                      className="flex items-center justify-center gap-1.5 px-4 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-zinc-800 hover:border-zinc-700 transition"
                    >
                      <span>Abrir Editor 2D</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Secondary Videos Grid ── */}
          {secondaryVideos.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-400" />
                  <span>Mais Tutoriais & Projetos para Você</span>
                </h3>
                <span className="text-xs text-zinc-500">
                  {secondaryVideos.length} {secondaryVideos.length === 1 ? 'conteúdo' : 'conteúdos'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {secondaryVideos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveVideo(item)}
                    className="group bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-3.5 flex flex-col justify-between transition duration-200 cursor-pointer shadow-lg hover:shadow-black/60"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-hidden mb-3">
                      <img
                        src={getYouTubeThumbnail(item.youtubeId, item.thumbnailUrl)}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />

                      {/* Small Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/90 group-hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-200">
                          <Play className="w-4 h-4 fill-zinc-950 translate-x-0.5" />
                        </div>
                      </div>

                      {/* Category Pill on Thumbnail */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur border border-zinc-700/50 text-[10px] font-bold text-amber-300 uppercase">
                        {COMMUNITY_CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] text-zinc-400 font-medium block truncate">
                          {item.channelOrAuthor}
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition line-clamp-2 leading-snug mt-0.5">
                          {item.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/60 mt-3 flex items-center justify-between text-xs text-amber-400 font-bold">
                        <span>Assistir tutorial</span>
                        <Play className="w-3 h-3 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bridge CTA: Transformar Aprendizado em Ação ── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/30 p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider inline-block">
              Agora é a sua vez
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Encontrou uma ideia que gostaria de reproduzir?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Crie seu molde no BeadForge e descubra automaticamente quantas peças e quais cores exatas você vai precisar para montar seu projeto.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/editor"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-sm sm:text-base font-black rounded-2xl shadow-xl shadow-amber-500/25 transition duration-200 transform hover:scale-105 active:scale-98"
            >
              <span>CRIAR MEU MOLDE</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Modal Lightbox do Vídeo ── */}
      <VideoPlayerModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </section>
  );
}
