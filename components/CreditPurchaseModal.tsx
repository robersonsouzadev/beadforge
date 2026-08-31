'use client';

import React, { useState, useTransition } from 'react';
import {
  X,
  Sparkles,
  Coins,
  CheckCircle2,
  Zap,
  CreditCard,
  QrCode,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Flame,
  Star,
} from 'lucide-react';
import {
  CREDIT_PACKAGES,
  CreditPackId,
  createCreditsCheckoutSession,
} from '@/app/actions/billing';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
}

export function CreditPurchaseModal({
  isOpen,
  onClose,
  currentCredits = 0,
}: CreditPurchaseModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPackId>('popular');
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handlePurchase = () => {
    startTransition(async () => {
      try {
        await createCreditsCheckoutSession(selectedPack);
      } catch (err: any) {
        alert(err.message || 'Erro ao iniciar pagamento.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-400/20 font-black">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Recarregar Créditos de IA 3D
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-extrabold text-[10px] uppercase">
                  SEM MENSALIDADE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Transforme qualquer foto 2D em escultura 3D de beads pronta para montar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Card de Saldo Atual */}
          <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Seu saldo atual:</span>
            </div>
            <div className="text-sm font-black text-amber-400 font-mono">
              {currentCredits} {currentCredits === 1 ? 'crédito disponível' : 'créditos disponíveis'}
            </div>
          </div>

          {/* Seleção de Pacotes */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
              Escolha seu Pacote de Créditos
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {(Object.keys(CREDIT_PACKAGES) as CreditPackId[]).map((key) => {
                const pack = CREDIT_PACKAGES[key];
                const isSelected = selectedPack === key;
                const isPopular = key === 'popular';
                const isMega = key === 'mega';

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPack(key)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/10'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Badge de Destaque */}
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-zinc-950" />
                        <span>MAIS VENDIDO</span>
                      </div>
                    )}

                    {isMega && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-sky-400 text-zinc-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-zinc-950" />
                        <span>MELHOR VALOR</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-zinc-200">{pack.name.split(' (')[0]}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-400 bg-amber-400' : 'border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                          <span>R$</span>
                          <span>{pack.priceBrl.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <span className="text-[11px] text-amber-400/90 font-mono font-bold block mt-0.5">
                          R$ {pack.unitPriceBrl} / modelo 3D
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-800/80">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{pack.credits} Esculturas 3D</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-1">
                          Créditos nunca expiram
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vantagens e Segurança */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/60 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Liberação imediata na conta</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Cartão de Crédito ou PIX</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pagamento 100% Seguro Stripe</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            Total selecionado:{' '}
            <strong className="text-amber-400 font-mono text-sm">
              R$ {CREDIT_PACKAGES[selectedPack].priceBrl.toFixed(2).replace('.', ',')}
            </strong>{' '}
            ({CREDIT_PACKAGES[selectedPack].credits} créditos)
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={isPending}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-xl shadow-amber-400/20 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando Pagamento Seguro...</span>
              </>
            ) : (
              <>
                <span>Continuar para Pagamento (Cartão / PIX)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
