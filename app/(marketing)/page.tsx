'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Palette,
  FileDown,
  Box,
  CheckCircle2,
  Zap,
  Crown,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function LandingPage() {
  const { t, currency } = useTranslation();

  return (
    <div className="space-y-24 pb-20 select-none">
      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            {t.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            {t.hero.titleMain}{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            {t.hero.description}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/editor"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-base font-bold rounded-2xl shadow-xl shadow-amber-500/25 transition duration-200 transform hover:scale-[1.03]"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/gallery"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-base font-semibold rounded-2xl transition duration-200"
            >
              <span>{t.hero.ctaSecondary}</span>
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-base font-semibold rounded-2xl transition duration-200"
            >
              <span>{t.hero.ctaPricing}</span>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{t.hero.featureNoSignup}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{t.hero.featurePdfCsv}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{t.hero.featurePalettes}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.features.sectionTitle}
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base">
            {t.features.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {t.features.card1Title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.features.card1Desc}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {t.features.card2Title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.features.card2Desc}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {t.features.card3Title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.features.card3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D Highlight Section ── */}
      <section id="3d" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 p-8 sm:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase mb-4">
              <Zap className="w-3.5 h-3.5" />
              {t.ultraHighlight.badge}
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.ultraHighlight.title}
            </h2>
            <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
              {t.ultraHighlight.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/30 transition transform hover:scale-105"
              >
                {t.ultraHighlight.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Preview Section ── */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {t.pricing.badge}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.pricing.titleMain} <span className="text-amber-400">{t.pricing.titleHighlight}</span>
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            {t.pricing.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Free */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">{t.pricing.freeName}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{currency === 'USD' ? '$0' : 'R$ 0'}</span>
                <span className="text-xs text-zinc-500">{currency === 'USD' ? '/mo' : '/mês'}</span>
              </div>
              <p className="text-xs text-zinc-400">{t.pricing.freeDesc}</p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>{t.hero.featureNoSignup}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>{t.hero.featurePdfCsv}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>{t.hero.featurePalettes}</span></li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/editor" className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs rounded-xl flex items-center justify-center transition border border-zinc-700">
                {t.pricing.freeCta}
              </Link>
            </div>
          </div>

          {/* Creator Pro */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{t.pricing.creatorName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">Pro</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{currency === 'USD' ? '$4.99' : 'R$ 19,90'}</span>
                <span className="text-xs text-zinc-500">{currency === 'USD' ? '/mo' : '/mês'}</span>
              </div>
              <p className="text-xs text-zinc-400">{t.pricing.creatorDesc}</p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>PDFs 1:1 clean exports</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Cloud projects</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Crafting Tracker</span></li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/pricing" className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl flex items-center justify-center transition">
                {t.pricing.creatorCta}
              </Link>
            </div>
          </div>

          {/* Studio Ateliê */}
          <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">{t.pricing.studioName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-extrabold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  VIP
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400">{currency === 'USD' ? '$14.99' : 'R$ 79,00'}</span>
                <span className="text-xs text-zinc-400">{currency === 'USD' ? '/mo' : '/mês'}</span>
              </div>
              <p className="text-xs text-zinc-300">{t.pricing.studioDesc}</p>
              <ul className="space-y-2 text-xs text-zinc-200 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Estoque Físico Multi-Marca & Baixa</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Calculadora de Custos & Taxas</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Pipeline de Pedidos & Provas WhatsApp</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">PDF White-Label + Ultra 3D</span></li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/pricing" className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition">
                <span>{t.pricing.studioCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {t.hero.titleMain} <span className="text-amber-400">{t.hero.titleHighlight}</span>
        </h2>
        <p className="mt-4 text-zinc-400 text-sm sm:text-base">
          {t.features.sectionSubtitle}
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-base font-bold rounded-2xl shadow-xl shadow-amber-500/30 transition duration-150 transform hover:scale-105"
          >
            <span>{t.common.register}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
