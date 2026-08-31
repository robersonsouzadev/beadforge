import React from 'react';
import { getAdminData } from '@/app/actions/admin';
import {
  Users,
  Zap,
  Gift,
  DollarSign,
  FolderOpen,
  ShieldCheck,
  Search,
  Calendar,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { AdminUsersTable } from '@/components/AdminUsersTable';

export default async function AdminPage() {
  const data = await getAdminData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Admin Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Painel de Administração</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                ADMIN
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Visão geral de métricas, crescimento de contas e assinaturas em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Users */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total de Contas
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {data.totalUsers}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Cadastros registrados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Studio Users */}
        <div className="bg-zinc-900/70 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/5">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Studio Ateliê 👑
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {data.studioUsers}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              R$ 79,00 / mês
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5 fill-amber-400" />
          </div>
        </div>

        {/* Creator Pro */}
        <div className="bg-zinc-900/70 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-sky-500/5">
          <div>
            <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">
              Creator Pro ⚡
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
              {data.proUsers}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              R$ 19,90 / mês
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Zap className="w-5 h-5 fill-sky-400" />
          </div>
        </div>

        {/* Free Users */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Gratuitos
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {data.freeUsers}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Potenciais assinantes
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        {/* MRR Estimado */}
        <div className="bg-zinc-900/70 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-500/5">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              MRR Estimado
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              R$ {data.estimatedMRR.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              Receita mensal
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Users Table Component ── */}
      <AdminUsersTable users={data.users} />
    </div>
  );
}
