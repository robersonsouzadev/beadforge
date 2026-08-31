'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getPatternBySlugAction,
  likePatternAction,
  remixPatternAction,
  type PatternDetailsDTO,
} from '@/app/actions/gallery';
import {
  Sparkles,
  Heart,
  Download,
  Share2,
  Layers,
  Palette,
  ArrowLeft,
  User,
  ExternalLink,
  Check,
  Loader2,
  Copy,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface PatternPageProps {
  params: Promise<{ slug: string }>;
}

export default function PatternDetailsPage({ params }: PatternPageProps) {
  const { t } = useTranslation();
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  const router = useRouter();
  const [pattern, setPattern] = useState<PatternDetailsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    getPatternBySlugAction(slug)
      .then((data) => {
        setPattern(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load pattern:', err);
        setIsLoading(false);
      });
  }, [slug]);

  const handleLike = async () => {
    if (liked || !pattern) return;
    setLiked(true);
    setPattern((prev) => (prev ? { ...prev, likesCount: prev.likesCount + 1 } : prev));
    try {
      await likePatternAction(slug);
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleRemix = async () => {
    if (!pattern) return;
    setIsRemixing(true);
    try {
      await remixPatternAction(slug);
      router.push(`/editor?remix=${slug}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao remixar molde.');
      setIsRemixing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Carregando molde da galeria...</span>
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Molde Não Encontrado</h1>
        <p className="text-xs text-zinc-400 mb-4">O molde solicitado não existe ou foi removido.</p>
        <Link
          href="/gallery"
          className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow"
        >
          Voltar para a Galeria
        </Link>
      </div>
    );
  }

  const summary = pattern.patternData?.summary || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      {/* ── Top Bar ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl px-4 sm:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
                <Sparkles className="w-3.5 h-3.5 text-zinc-950 font-bold" />
              </div>
              <span className="text-sm font-black tracking-tight text-white hidden sm:inline">
                Bead<span className="text-amber-400">Forge</span>
              </span>
            </Link>

            <span className="text-zinc-700 hidden sm:inline">|</span>

            <Link
              href="/gallery"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Galeria de Moldes</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/editor"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition px-2.5 py-1"
            >
              {t.common.editor}
            </Link>

            <LanguageSwitcher />

            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t.common.copied : t.common.share}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Pattern Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Preview & Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center space-y-4 shadow-2xl relative">
              {pattern.thumbnailUrl ? (
                <div className="w-full max-w-md aspect-square bg-zinc-950/90 rounded-2xl border border-zinc-800 flex items-center justify-center p-4 shadow-inner">
                  <img
                    src={pattern.thumbnailUrl}
                    alt={pattern.title}
                    className="w-full h-full object-contain rounded drop-shadow-2xl"
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-600">
                  <Layers className="w-12 h-12 opacity-40" />
                </div>
              )}

              {/* Specs Pills */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md text-center text-xs pt-2">
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Total de Peças</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {pattern.beadCount.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Cores Distintas</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {pattern.colorCount} cores
                  </span>
                </div>

                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Dimensões</span>
                  <span className="font-mono font-bold text-zinc-300 text-sm">
                    {pattern.dimensions || '29x29'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info, Creator & Action Buttons (5 cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/25">
                  {pattern.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                  {pattern.title}
                </h1>
                {pattern.description && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {pattern.description}
                  </p>
                )}
              </div>

              {/* Creator Card */}
              {pattern.creator && (
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                      {pattern.creator.avatarUrl ? (
                        <img src={pattern.creator.avatarUrl} alt={pattern.creator.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {pattern.creator.name}
                      </span>
                      {pattern.creator.handle && (
                        <span className="text-[11px] text-amber-400 font-mono">
                          @{pattern.creator.handle}
                        </span>
                      )}
                    </div>
                  </div>

                  {pattern.creator.handle && (
                    <Link
                      href={`/creator/${pattern.creator.handle}`}
                      className="text-xs text-zinc-400 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <span>Ver Perfil</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleRemix}
                  disabled={isRemixing}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50"
                >
                  {isRemixing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4" />
                  )}
                  <span>Remixar & Customizar no Editor</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      liked
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                    <span>{liked ? 'Curtido!' : `Curtir (${pattern.likesCount})`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Paleta & BOM Breakdown */}
            {summary.length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2 uppercase tracking-wide">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lista de Materiais (BOM)</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {summary.map((item: any) => (
                    <div
                      key={item.code}
                      className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-4 h-4 rounded-md border border-white/20 shrink-0 shadow-inner"
                        style={{ backgroundColor: item.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-mono font-bold text-[10px] text-amber-400 block truncate">
                          {item.code}
                        </span>
                        <span className="text-[9px] text-zinc-500 truncate block">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-[10px] text-zinc-300">
                        {item.count} un
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-4 px-4 text-center text-xs text-zinc-500">
        BeadForge Studio &bull; Molde de Fuse Beads
      </footer>
    </div>
  );
}
