import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { createCustomerPortalSession } from '@/app/actions/billing';
import {
  CreditCard,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default async function BillingSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const sub = await getUserSubscription(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-amber-400" />
          <span>Assinatura & Faturamento</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Gerencie seu plano ativo, métodos de pagamento e faturas da sua conta.
        </p>
      </div>

      {/* ── Active Subscription Card ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">
              Plano Vigente
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-bold text-white">
                {sub.isPro ? 'BeadForge Pro' : 'Plano Gratuito'}
              </h2>
              {sub.isPro && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  ATIVO
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {sub.isPro
                ? 'Você possui acesso ilimitado a todos os recursos 2D, Ultra 3D e exportação vetorial.'
                : 'Acesso básico ao editor 2D e até 3 projetos salvos.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {sub.isPro ? (
              <form action={createCustomerPortalSession}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs rounded-xl border border-zinc-700 transition"
                >
                  <span>Gerenciar Assinatura</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </form>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fazer Upgrade para Pro</span>
              </Link>
            )}
          </div>
        </div>

        {/* Subscription Metadata */}
        {sub.isPro && sub.currentPeriodEnd && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-zinc-500 block">Próxima Renovação:</span>
                <span className="text-zinc-200 font-semibold">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-zinc-500 block">Status de Faturamento:</span>
                <span className="text-emerald-400 font-semibold capitalize">
                  {sub.cancelAtPeriodEnd ? 'Cancelamento Agendado' : 'Renovação Automática Ativa'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Self-Service Portal Notice */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300">
            Segurança & Autonomia de Cobrança:
          </p>
          <p>
            Todas as transações e dados de cartão são processados com criptografia bancária pela <strong>Stripe</strong>. Você pode alterar seu cartão de crédito, solicitar notas fiscais ou cancelar sua assinatura a qualquer momento através do Portal de Faturamento.
          </p>
        </div>
      </div>
    </div>
  );
}
