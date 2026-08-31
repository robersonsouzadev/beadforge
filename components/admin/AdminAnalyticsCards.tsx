'use client';

import React from 'react';
import {
  DollarSign,
  Crown,
  Zap,
  Gift,
  Users,
  FolderOpen,
  Box,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';
import { AdminStats, AdminAiStats } from '@/app/actions/admin';

interface AdminAnalyticsCardsProps {
  stats: AdminStats;
  aiStats: AdminAiStats;
  projects2DCount: number;
  projects3DCount: number;
}

export function AdminAnalyticsCards({
  stats,
  aiStats,
  projects2DCount,
  projects3DCount,
}: AdminAnalyticsCardsProps) {
  const totalPaidUsers = stats.studioUsers + stats.proUsers;
  const conversionRate = stats.totalUsers > 0 ? (totalPaidUsers / stats.totalUsers) * 100 : 0;
  const projectedARR = stats.estimatedMRR * 12;

  return (
    <div className="space-y-6">
      {/* ── Métricas de Receita e Planos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Users */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total de Contas
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
              {stats.totalUsers}
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
        <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/5">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Studio Ateliê 👑
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">
              {stats.studioUsers}
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
        <div className="bg-zinc-900/80 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-sky-500/5">
          <div>
            <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">
              Creator Pro ⚡
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1 font-mono">
              {stats.proUsers}
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              R$ 19,90 / mês
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Zap className="w-5 h-5 fill-sky-400" />
          </div>
        </div>

        {/* MRR Estimado */}
        <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-500/5">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              MRR (Mensal)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">
              R$ {stats.estimatedMRR.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block font-mono">
              ARR: R$ {projectedARR.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-indigo-500/5">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
              Conversão Paga
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1 font-mono">
              {conversionRate.toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              {totalPaidUsers} assinantes ativos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Distribuição de Atividade e Engajamento ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Projetos 2D */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Moldes 2D Criados
            </span>
            <div className="text-xl font-black text-zinc-100 mt-1 font-mono">
              {projects2DCount} projetos
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Matrizes planas de pegboards
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <FolderOpen className="w-4 h-4" />
          </div>
        </div>

        {/* Esculturas 3D Ultra */}
        <div className="bg-zinc-900/80 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Esculturas 3D Ultra
            </span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">
              {projects3DCount} projetos
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Modelos multicamadas voxelizados
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Box className="w-4 h-4" />
          </div>
        </div>

        {/* Eficiência da IA */}
        <div className="bg-zinc-900/80 border border-sky-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
              Taxa de Sucesso IA
            </span>
            <div className="text-xl font-black text-sky-300 mt-1 font-mono">
              {aiStats.totalGenerations > 0
                ? `${((aiStats.successGenerations / aiStats.totalGenerations) * 100).toFixed(0)}%`
                : '100%'}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              {aiStats.totalGenerations} gerações totais
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
