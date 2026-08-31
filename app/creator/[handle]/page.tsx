'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  getCreatorProfileByHandleAction,
  type CreatorFullProfileDTO,
} from '@/app/actions/creator';
import {
  User,
  ShoppingBag,
  MessageCircle,
  AtSign,
  Heart,
  Layers,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface CreatorPageProps {
  params: Promise<{ handle: string }>;
}

export default function CreatorProfilePage({ params }: CreatorPageProps) {
  const { handle } = use(params);
  const [profile, setProfile] = useState<CreatorFullProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCreatorProfileByHandleAction(handle)
      .then((data) => {
        setProfile(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load creator profile:', err);
        setIsLoading(false);
      });
  }, [handle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Carregando perfil do criador...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Criador Não Encontrado</h1>
        <p className="text-xs text-zinc-400 mb-4">Não encontramos nenhum criador com o nome @{handle}.</p>
        <Link
          href="/gallery"
          className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow"
        >
          Ir para a Galeria Pública
        </Link>
      </div>
    );
  }

  const rawPhone = profile.whatsappNumber ? profile.whatsappNumber.replace(/[^0-9]/g, '') : null;
  const waLink = rawPhone
    ? `https://wa.me/${rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      {/* ── Top Bar ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur px-4 py-3.5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/gallery"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a Galeria</span>
          </Link>
        </div>
      </header>

      {/* ── Profile Header ── */}
      <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-b border-zinc-800/80 px-4 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-900 border-2 border-amber-400/40 p-1 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <User className="w-12 h-12 text-zinc-500" />
            )}
          </div>

          {/* Bio & Links */}
          <div className="space-y-3 flex-1">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile.displayName}
                </h1>
                <span className="text-xs font-mono text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/25 self-center sm:self-auto">
                  @{profile.handle}
                </span>
              </div>
              {profile.bio && (
                <p className="text-xs text-zinc-400 mt-2 max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Layers className="w-4 h-4 text-amber-400" />
                <span><strong className="text-white font-mono">{profile.totalPatternsCount}</strong> moldes criados</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Heart className="w-4 h-4 text-rose-500" />
                <span><strong className="text-white font-mono">{profile.totalLikesCount}</strong> curtidas</span>
              </div>
            </div>

            {/* Social / Store Links */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {profile.shopUrl && (
                <a
                  href={profile.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Loja Shopee / Elo7</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Encomendas</span>
                </a>
              )}

              {profile.instagramHandle && (
                <a
                  href={`https://instagram.com/${profile.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <AtSign className="w-3.5 h-3.5" />
                  <span>@{profile.instagramHandle}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Creator's Patterns Grid ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1 w-full">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Moldes Criados por {profile.displayName} ({profile.patterns.length})
        </h2>

        {profile.patterns.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 text-xs text-zinc-500">
            Nenhum molde publicado publicamente por este criador ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profile.patterns.map((pat) => (
              <Link
                key={pat.id}
                href={`/gallery/${pat.slug}`}
                className="bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition duration-200 group hover:shadow-xl relative"
              >
                <div className="relative aspect-square w-full rounded-xl bg-zinc-950/90 border border-zinc-800/80 flex items-center justify-center p-3 overflow-hidden">
                  {pat.thumbnailUrl ? (
                    <img
                      src={pat.thumbnailUrl}
                      alt={pat.title}
                      className="w-full h-full object-contain rounded drop-shadow-md group-hover:scale-105 transition"
                    />
                  ) : (
                    <Layers className="w-8 h-8 text-zinc-600 opacity-40" />
                  )}

                  <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-900/80 backdrop-blur border border-zinc-700/60 text-zinc-300 flex items-center gap-1 text-[10px] font-bold">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{pat.likesCount}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="font-mono">{pat.beadCount} peças</span>
                    <span>&bull;</span>
                    <span className="font-mono text-amber-400">{pat.colorCount} cores</span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-amber-400 transition truncate">
                    {pat.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-4 px-4 text-center text-xs text-zinc-500">
        BeadForge Studio &bull; Perfil de Criador
      </footer>
    </div>
  );
}
