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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Total de Contas
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {data.totalUsers}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Cadastros registrados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pro Users */}
        <div className="bg-zinc-900/70 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-amber-500/5">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Assinantes Pro
            </span>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {data.proUsers}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {data.totalUsers > 0
                ? `${((data.proUsers / data.totalUsers) * 100).toFixed(1)}% de conversão`
                : '0% de conversão'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Free Users */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Contas Gratuitas
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {data.freeUsers}
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Potenciais assinantes
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        {/* MRR Estimado */}
        <div className="bg-zinc-900/70 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-emerald-500/5">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              MRR Estimado
            </span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              R$ {data.estimatedMRR.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Receita mensal recorrente
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Users Table Component ── */}
      <AdminUsersTable users={data.users} />
    </div>
  );
}
