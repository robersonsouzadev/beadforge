'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptions';
import { CREDIT_PACKAGES, CreditPackId } from '@/config/credits';
import {
  createCheckoutSession,
  createCreditsCheckoutSession,
} from '@/app/actions/billing';
import { useTranslation } from '@/lib/i18n';
import {
  Check,
  X,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Globe2,
  Loader2,
  Crown,
  ArrowRight,
  Coins,
  Zap,
  Flame,
  Star,
} from 'lucide-react';

export default function PricingPage() {
  const { t, currency, setCurrency } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);

  const handleCheckout = (priceId: string) => {
    startTransition(async () => {
      try {
        await createCheckoutSession(priceId);
      } catch (err: any) {
        console.error('Checkout error:', err);
      }
    });
  };

  const handleCreditsCheckout = (packId: CreditPackId) => {
    setPendingPackId(packId);
    startTransition(async () => {
      try {
        await createCreditsCheckoutSession(packId);
      } catch (err: any) {
        alert(err.message || 'Erro ao iniciar checkout de créditos.');
      } finally {
        setPendingPackId(null);
      }
    });
  };

  const freePlan = SUBSCRIPTION_PLANS.free;
  const proPlan = SUBSCRIPTION_PLANS.pro;
  const studioPlan = SUBSCRIPTION_PLANS.studio;

  const proPrices = currency === 'USD' ? proPlan.pricesUSD : proPlan.prices;
  const studioPrices = currency === 'USD' ? studioPlan.pricesUSD : studioPlan.prices;
  const freePrices = currency === 'USD' ? freePlan.pricesUSD : freePlan.prices;

  const currentProPrice = isYearly ? proPrices.yearly : proPrices.monthly;
  const currentStudioPrice = isYearly ? studioPrices.yearly : studioPrices.monthly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16 select-none">
      {/* ── Title & Toggles ── */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          {t.pricing.badge}
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {t.pricing.titleMain} <span className="text-amber-400">{t.pricing.titleHighlight}</span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto">
          {t.pricing.description}
        </p>

        {/* Currency & Period Switchers */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {/* Currency Switcher (BRL vs USD) */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-2xl text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setCurrency('BRL')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                currency === 'BRL'
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🇧🇷 Real (R$)</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                currency === 'USD'
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🇺🇸 Dólar (USD $)</span>
            </button>
          </div>

          {/* Period Switcher (Monthly vs Yearly) */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs sm:text-sm font-semibold cursor-pointer transition ${
                !isYearly ? 'text-white' : 'text-zinc-500'
              }`}
              onClick={() => setIsYearly(false)}
            >
              {t.pricing.monthly}
            </span>

            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-12 h-7 bg-zinc-800 rounded-full p-1 border border-zinc-700 transition duration-200 focus:outline-none"
            >
              <div
                className={`w-5 h-5 rounded-full bg-amber-400 shadow-md transform transition-transform duration-200 ${
                  isYearly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition ${
                isYearly ? 'text-white' : 'text-zinc-500'
              }`}
              onClick={() => setIsYearly(true)}
            >
              <span>{t.pricing.yearly}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] font-bold border border-emerald-500/30">
                {t.pricing.saveBadge}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 Pricing Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* 1. Free Tier */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">{t.pricing.freeName}</h3>
              <p className="text-xs text-zinc-400 mt-1">{t.pricing.freeDesc}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {currency === 'USD' ? '$0' : 'R$ 0'}
              </span>
              <span className="text-xs text-zinc-500">
                {currency === 'USD' ? '/mo' : '/mês'}
              </span>
            </div>

            <div className="border-t border-zinc-800 pt-6 space-y-3">
              <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                {t.pricing.includedHeading}
              </span>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {freePlan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {feat.included ? (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                    )}
                    <span className={feat.included ? '' : 'text-zinc-600 line-through'}>
                      {feat.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <Link
              href="/editor"
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs rounded-xl flex items-center justify-center transition border border-zinc-700"
            >
              {t.pricing.freeCta}
            </Link>
          </div>
        </div>

        {/* 2. Creator Pro */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{t.pricing.creatorName}</h3>
                <p className="text-xs text-zinc-400 mt-1">{t.pricing.creatorDesc}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">
                Pro
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {currentProPrice.displayPrice}
                </span>
                <span className="text-xs text-zinc-500">{currentProPrice.period}</span>
              </div>
              {isYearly && (
                <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                  {proPrices.yearly.savingsBadge}
                </span>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-6 space-y-3">
              <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                {t.pricing.includedHeading}
              </span>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {proPlan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {feat.included ? (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                    )}
                    <span className={feat.included ? '' : 'text-zinc-600 line-through'}>
                      {feat.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout(currentProPrice.priceId)}
              disabled={isPending}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t.pricing.creatorCta}</span>}
            </button>
          </div>
        </div>

        {/* 3. Studio Tier (O Carro-Chefe) */}
        <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-lg flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 fill-zinc-950" />
            <span>{t.pricing.studioBadge}</span>
          </div>

          <div className="space-y-6 mt-2">
            <div>
              <h3 className="text-lg font-black text-white">{t.pricing.studioName}</h3>
              <p className="text-xs text-zinc-300 mt-1">{t.pricing.studioDesc}</p>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-amber-400">
                  {currentStudioPrice.displayPrice}
                </span>
                <span className="text-xs text-zinc-400">{currentStudioPrice.period}</span>
              </div>
              {isYearly && (
                <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                  {studioPrices.yearly.savingsBadge}
                </span>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-6 space-y-3">
              <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                {t.pricing.studioHeading}
              </span>
              <ul className="space-y-2.5 text-xs text-zinc-200">
                {studioPlan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-medium">{feat.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout(currentStudioPrice.priceId)}
              disabled={isPending}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
            >
              {isPending && !pendingPackId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{t.pricing.studioCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Seção de Pacotes de Créditos de IA 3D Avulsos ── */}
      <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>SEM MENSALIDADE • PAGAMENTO ÚNICO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Precisa apenas de <span className="text-amber-400">Créditos de IA 3D</span>?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Recarregue pacotes avulsos com Cartão ou PIX imediato. Os créditos nunca expiram.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(CREDIT_PACKAGES) as CreditPackId[]).map((key) => {
            const pack = CREDIT_PACKAGES[key];
            const isPopular = key === 'popular';
            const isMega = key === 'mega';
            const isRowPending = isPending && pendingPackId === key;

            return (
              <div
                key={key}
                className={`relative p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                  isPopular
                    ? 'bg-zinc-900/90 border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/10'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-zinc-950" />
                    <span>MAIS VENDIDO</span>
                  </div>
                )}

                {isMega && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-400 text-zinc-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-zinc-950" />
                    <span>MELHOR VALOR</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{pack.name}</h3>
                    <span className="text-xs text-zinc-400">{pack.description}</span>
                  </div>

                  <div>
                    <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                      <span>R$</span>
                      <span>{pack.priceBrl.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <span className="text-xs text-amber-400 font-mono font-bold block mt-0.5">
                      R$ {pack.unitPriceBrl} por modelo 3D
                    </span>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{pack.credits} conversões Image-to-3D</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Fatiamento & Blueprints inclusos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sem expiração de saldo</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleCreditsCheckout(key)}
                    disabled={isPending}
                    className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 ${
                      isPopular
                        ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-lg shadow-amber-400/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                    }`}
                  >
                    {isRowPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Comprar {pack.credits} Créditos</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payment Methods & Guarantee Badges ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80 text-xs">
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <Globe2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">{t.pricing.globalPaymentTitle}</span>
            <span className="text-zinc-500 text-[11px]">{t.pricing.globalPaymentDesc}</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">{t.pricing.guaranteeTitle}</span>
            <span className="text-zinc-500 text-[11px]">{t.pricing.guaranteeDesc}</span>
          </div>
        </div>

        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-sky-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">{t.pricing.cancelTitle}</span>
            <span className="text-zinc-500 text-[11px]">{t.pricing.cancelDesc}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
