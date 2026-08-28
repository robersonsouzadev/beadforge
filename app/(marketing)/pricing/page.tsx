'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptions';
import { createCheckoutSession } from '@/app/actions/billing';
import {
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCheckout = (priceId: string) => {
    startTransition(async () => {
      try {
        await createCheckoutSession(priceId);
      } catch (err: any) {
        console.error('Checkout error:', err);
      }
    });
  };

  const proPlan = SUBSCRIPTION_PLANS.pro;
  const freePlan = SUBSCRIPTION_PLANS.free;

  const currentProPrice = isYearly
    ? proPlan.prices.yearly
    : proPlan.prices.monthly;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-20">
      {/* ── Title & Toggle ── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Planos Transparentes & Sem Pegadinhas
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Invista na sua arte e produza como um profissional
        </h1>

        <p className="text-sm sm:text-base text-zinc-400">
          Comece gratuitamente e faça o upgrade quando precisar de recursos avançados, exportação vetorial e 3D.
        </p>

        {/* Period Switcher */}
        <div className="pt-6 flex items-center justify-center gap-4">
          <span
            className={`text-sm font-semibold cursor-pointer transition ${
              !isYearly ? 'text-white' : 'text-zinc-500'
            }`}
            onClick={() => setIsYearly(false)}
          >
            Mensal
          </span>

          <button
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-8 bg-zinc-800 rounded-full p-1 border border-zinc-700 transition duration-200 focus:outline-none"
          >
            <div
              className={`w-6 h-6 rounded-full bg-amber-400 shadow-md transform transition-transform duration-200 ${
                isYearly ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <span
            className={`text-sm font-semibold flex items-center gap-2 cursor-pointer transition ${
              isYearly ? 'text-white' : 'text-zinc-500'
            }`}
            onClick={() => setIsYearly(true)}
          >
            <span>Anual</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
              Economize 17% (2 meses grátis)
            </span>
          </span>
        </div>
      </div>

      {/* ── Pricing Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Free Tier */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{freePlan.name}</h3>
              <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-full">
                Básico
              </span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              {freePlan.description}
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-black text-white">
                R$ 0
              </span>
              <span className="text-xs text-zinc-500 font-medium">/sempre</span>
            </div>

            {/* Features */}
            <div className="mt-8 space-y-3.5 border-t border-zinc-800/80 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                O que está incluído:
              </p>
              {freePlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                  {feat.included ? (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      feat.included ? 'text-zinc-300' : 'text-zinc-600 line-through'
                    }
                  >
                    {feat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <Link
              href="/register"
              className="w-full flex items-center justify-center py-3.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-sm rounded-xl border border-zinc-700 transition"
            >
              Criar Conta Gratuita
            </Link>
          </div>
        </div>

        {/* Pro Tier */}
        <div className="relative bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-amber-500/10">
          {/* Badge */}
          <div className="absolute -top-3.5 right-8 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 text-xs font-black tracking-wide uppercase shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-zinc-950" />
            {proPlan.badge}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{proPlan.name}</h3>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-zinc-300">
              {proPlan.description}
            </p>

            <div className="mt-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-amber-400">
                  {currentProPrice.displayPrice}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {currentProPrice.period}
                </span>
              </div>
              {isYearly && (
                <p className="text-xs text-emerald-400 mt-1 font-semibold">
                  Cobrança única de R$ 299,00 por 12 meses de acesso total
                </p>
              )}
            </div>

            {/* Features */}
            <div className="mt-8 space-y-3.5 border-t border-zinc-800/80 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Tudo do Free mais:
              </p>
              {proPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-200 font-medium">{feat.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleCheckout(currentProPrice.priceId)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/25 transition duration-150 transform hover:scale-[1.02] disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Assinar BeadForge Pro</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-zinc-400 text-center mt-2.5">
              Pagamento 100% seguro via Stripe com Cartão de Crédito ou PIX.
            </p>
          </div>
        </div>
      </div>

      {/* ── Trust & Security Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-center">
        <div className="flex flex-col items-center gap-2 p-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">7 Dias de Garantia</h4>
          <p className="text-xs text-zinc-400">
            Não gostou? Reembolso total e imediato dentro de 7 dias sem perguntas.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 p-2">
          <QrCode className="w-6 h-6 text-amber-400" />
          <h4 className="text-sm font-bold text-white">PIX & Cartão de Crédito</h4>
          <p className="text-xs text-zinc-400">
            Liberação instantânea com QR Code PIX ou parcelamento no cartão.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 p-2">
          <CreditCard className="w-6 h-6 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Cancele quando quiser</h4>
          <p className="text-xs text-zinc-400">
            Sem fidelidade nem multas. Cancele com 1 clique direto no painel.
          </p>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-white">Perguntas Frequentes</h3>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <h4 className="text-sm font-bold text-white mb-1">
              Como funciona o pagamento com PIX para assinaturas?
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Ao escolher pagar com PIX, um QR Code dinâmico é gerado instantaneamente no checkout seguro da Stripe. Assim que o pagamento é reconhecido pelo seu banco, sua conta Pro é ativada em poucos segundos.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <h4 className="text-sm font-bold text-white mb-1">
              Posso cancelar a assinatura a qualquer momento?
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Sim! No seu painel de configurações, você tem acesso ao Portal de Faturamento Stripe para cancelar ou alterar o plano com apenas um clique. Você manterá o acesso Pro até o final do período já pago.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <h4 className="text-sm font-bold text-white mb-1">
              O que acontece com meus projetos se eu cancelar o Pro?
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Seus projetos nunca serão apagados! Se você voltar para o plano gratuito, manterá acesso aos seus primeiros 3 projetos 2D. Para criar novos ou editar projetos 3D, basta reativar o Pro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
