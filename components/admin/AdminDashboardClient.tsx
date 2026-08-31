'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Users,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AdminStats, AdminAiStats, AdminAiConfig } from '@/app/actions/admin';
import { AdminAnalyticsCards } from '@/components/admin/AdminAnalyticsCards';
import { AdminAiConfigTab } from '@/components/admin/AdminAiConfigTab';
import { AdminUsersTable } from '@/components/AdminUsersTable';
import { AdminAiLogsTable } from '@/components/admin/AdminAiLogsTable';

interface AdminDashboardClientProps {
  stats: AdminStats;
  aiStats: AdminAiStats;
  aiConfig: AdminAiConfig;
  projects2DCount: number;
  projects3DCount: number;
}

export function AdminDashboardClient({
  stats,
  aiStats,
  aiConfig,
  projects2DCount,
  projects3DCount,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai_config' | 'users' | 'logs'>('analytics');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* ── Admin Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Painel de Administração & Analytics</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-extrabold uppercase">
                Studio Hub
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Gestão de usuários, tokens de IA 3D, custos de API e métricas financeiras.
            </p>
          </div>
        </div>

        {/* Status Rápido do Provedor de IA */}
        <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">Motor 3D:</span>
          <span className="font-bold text-amber-400 font-mono uppercase">{aiConfig.activeProvider}</span>
        </div>
      </div>

      {/* ── Navegação por Abas ── */}
      <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard & Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ai_config'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Gestão de IA 3D & Tokens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Créditos ({stats.totalUsers})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Logs de Auditoria IA ({aiStats.totalGenerations})</span>
        </button>
      </div>

      {/* ── Conteúdo da Aba Ativa ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <AdminAnalyticsCards
            stats={stats}
            aiStats={aiStats}
            projects2DCount={projects2DCount}
            projects3DCount={projects3DCount}
          />
          <AdminUsersTable users={stats.users} />
        </div>
      )}

      {activeTab === 'ai_config' && (
        <div className="animate-fade-in">
          <AdminAiConfigTab config={aiConfig} stats={aiStats} />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <AdminUsersTable users={stats.users} />
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="animate-fade-in">
          <AdminAiLogsTable logs={aiStats.recentLogs} />
        </div>
      )}
    </div>
  );
}
