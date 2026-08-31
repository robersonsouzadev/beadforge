'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Zap,
  Gift,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  ToggleLeft,
  ToggleRight,
  Crown,
} from 'lucide-react';
import {
  AdminUserItem,
  createAdminUserAction,
  updateAdminUserAction,
} from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: AdminUserItem | null;
}

export function AdminUserModal({
  isOpen,
  onClose,
  userToEdit,
}: AdminUserModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!userToEdit;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'studio' | 'pro' | 'free'>('studio');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [duration, setDuration] = useState<
    '30days' | '6months' | '1year' | 'lifetime' | 'custom'
  >('30days');
  const [customPeriodEnd, setCustomPeriodEnd] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setPassword('');
      setPlan(userToEdit.planId || (userToEdit.isPro ? 'studio' : 'free'));
      setStatus(userToEdit.subscriptionStatus === 'inactive' ? 'inactive' : 'active');
      if (userToEdit.currentPeriodEnd) {
        const d = new Date(userToEdit.currentPeriodEnd);
        const yyyy = d.getFullYear();
        if (yyyy >= 2090) {
          setDuration('lifetime');
        } else {
          setDuration('custom');
        }
      } else {
        setDuration('30days');
        setCustomPeriodEnd('');
      }
    } else {
      setName('');
      setEmail('');
      setPassword('123456');
      setPlan('studio');
      setStatus('active');
      setDuration('30days');
      setCustomPeriodEnd('');
    }
    setErrorMessage('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('O e-mail é obrigatório.');
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && userToEdit) {
          await updateAdminUserAction({
            userId: userToEdit.id,
            name,
            email,
            plan,
            status,
            duration: plan !== 'free' ? duration : undefined,
            customPeriodEnd: plan !== 'free' && duration === 'custom' ? customPeriodEnd : undefined,
          });
        } else {
          await createAdminUserAction({
            name,
            email,
            password: password || '123456',
            plan,
            status,
            duration: plan !== 'free' ? duration : undefined,
            customPeriodEnd: plan !== 'free' && duration === 'custom' ? customPeriodEnd : undefined,
          });
        }

        router.refresh();
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao processar solicitação.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Editar Usuário & Assinatura' : 'Adicionar Novo Usuário'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? `Gerenciar dados e plano de ${userToEdit.name}`
                  : 'Cadastre um novo usuário e defina o plano de acesso'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nome e Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Nome Completo</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>E-mail</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Senha (apenas na criação ou se quiser trocar) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{isEditing ? 'Redefinir Senha (Opcional)' : 'Senha Inicial'}</span>
              </span>
              {!isEditing && (
                <span className="text-[10px] text-zinc-500">Padrão: 123456</span>
              )}
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? 'Deixe em branco para manter a senha atual' : '123456'}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Seletor de Plano: 3 Módulos */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-300">
              Plano de Acesso
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Studio Ateliê */}
              <button
                type="button"
                onClick={() => setPlan('studio')}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition text-left relative overflow-hidden ${
                  plan === 'studio'
                    ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    plan === 'studio' ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-850 text-amber-400'
                  }`}>
                    <Crown className="w-4 h-4 fill-current" />
                  </div>
                  <span className={`text-xs font-black ${plan === 'studio' ? 'text-amber-300' : 'text-zinc-200'}`}>
                    Studio Ateliê
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Estoque + Pedidos + CRM + Provas + 3D + White-Label
                </span>
              </button>

              {/* Creator Pro */}
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition text-left ${
                  plan === 'pro'
                    ? 'bg-sky-500/15 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    plan === 'pro' ? 'bg-sky-400 text-zinc-950' : 'bg-zinc-850 text-sky-400'
                  }`}>
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <span className={`text-xs font-bold ${plan === 'pro' ? 'text-sky-300' : 'text-zinc-300'}`}>
                    Creator Pro
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  PDF 1:1 Limpo + Projetos Ilimitados + Crafting
                </span>
              </button>

              {/* Plano Gratuito */}
              <button
                type="button"
                onClick={() => setPlan('free')}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition text-left ${
                  plan === 'free'
                    ? 'bg-zinc-800 border-zinc-600 shadow-md ring-1 ring-zinc-500'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    plan === 'free' ? 'bg-zinc-700 text-white' : 'bg-zinc-850 text-zinc-500'
                  }`}>
                    <Gift className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${plan === 'free' ? 'text-white' : 'text-zinc-300'}`}>
                    Gratuito
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  Até 3 projetos 2D + PDF com marca d&apos;água
                </span>
              </button>
            </div>
          </div>

          {/* Status da Assinatura: Ativo vs Inativo */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">
                Status da Assinatura
              </span>
              <span className="text-[11px] text-zinc-500">
                {status === 'active'
                  ? 'Acesso ativo e liberado aos recursos do plano'
                  : 'Assinatura inativada / suspensa'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{status === 'active' ? 'ATIVO' : 'INATIVO'}</span>
            </button>
          </div>

          {/* Duração / Validade do Plano Pago (apenas se Studio ou Pro estiver selecionado e status for ativo) */}
          {plan !== 'free' && status === 'active' && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duração / Validade do {plan === 'studio' ? 'Studio' : 'Pro'}</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {duration === 'lifetime' ? 'Sem Expiração' : 'Renovação'}
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: '30days', label: '1 Mês (30d)' },
                  { id: '6months', label: '6 Meses' },
                  { id: '1year', label: '1 Ano' },
                  { id: 'lifetime', label: 'Vitalício ⚡' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDuration(item.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center border ${
                      duration === item.id
                        ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Data Personalizada */}
              <div className="pt-1.5 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDuration('custom')}
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    duration === 'custom' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Definir Data Específica:</span>
                </button>

                <input
                  type="date"
                  value={customPeriodEnd}
                  onChange={(e) => {
                    setCustomPeriodEnd(e.target.value);
                    setDuration('custom');
                  }}
                  className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Usuário'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
