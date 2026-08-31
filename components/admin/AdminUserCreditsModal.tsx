'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Plus, Minus, Loader2, Coins, CheckCircle2 } from 'lucide-react';
import { AdminUserItem, manageUserCreditsAction } from '@/app/actions/admin';

interface AdminUserCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserItem | null;
}

export function AdminUserCreditsModal({ isOpen, onClose, user }: AdminUserCreditsModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('Bônus Promocional / Atendimento');
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleAdjustCredits = (delta: number) => {
    startTransition(async () => {
      try {
        await manageUserCreditsAction(user.id, delta, reason);
        setSuccessMsg(`Saldo atualizado com sucesso! (${delta > 0 ? `+${delta}` : delta} créditos)`);
        setTimeout(() => {
          setSuccessMsg(null);
          router.refresh();
          onClose();
        }, 1200);
      } catch (err: any) {
        alert(err.message || 'Erro ao ajustar créditos.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Gerenciar Créditos de IA 3D</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">{user.name} ({user.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Current Balance Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Saldo Atual de IA:
            </span>
            <span className="text-xl font-black text-amber-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {user.aiCredits} créditos
            </span>
          </div>

          {/* Presets Rápidos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Atalhos Rápidos de Adição
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[+5, +10, +25, +50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAdjustCredits(preset)}
                  disabled={isPending}
                  className="py-2 px-1 rounded-xl bg-zinc-800 hover:bg-amber-400/20 border border-zinc-700 hover:border-amber-400/40 text-xs font-bold text-zinc-200 hover:text-amber-300 transition disabled:opacity-50"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Ajuste Personalizado */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Quantidade Personalizada
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => handleAdjustCredits(amount)}
                disabled={isPending}
                className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1 transition shadow-md disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Adicionar</span>
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCredits(-amount)}
                disabled={isPending || user.aiCredits <= 0}
                className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 transition disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
