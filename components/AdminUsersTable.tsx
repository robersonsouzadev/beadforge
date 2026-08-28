'use client';

import React, { useState } from 'react';
import { Search, Zap, Gift, FolderOpen, Calendar } from 'lucide-react';

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  isPro: boolean;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  projectCount: number;
}

export function AdminUsersTable({ users }: { users: AdminUserItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'free'>('all');

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'pro') return u.isPro;
    if (filterType === 'free') return !u.isPro;
    return true;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Usuários Cadastrados ({filtered.length})
          </h2>
          <p className="text-xs text-zinc-400">
            Lista completa de contas e planos ativos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="pl-9 pr-3.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 w-56 sm:w-64"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterType('pro')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                filterType === 'pro'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" />
              Pro ({users.filter((u) => u.isPro).length})
            </button>
            <button
              onClick={() => setFilterType('free')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'free'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Free ({users.filter((u) => !u.isPro).length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider font-semibold border-y border-zinc-800">
            <tr>
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Plano</th>
              <th className="py-3 px-4 text-center">Projetos</th>
              <th className="py-3 px-4">Data Cadastro</th>
              <th className="py-3 px-4">Status / Renovação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500">
                  Nenhum usuário encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-850/60 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-bold">{u.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-zinc-300 font-mono">
                    {u.email}
                  </td>

                  <td className="py-3 px-4">
                    {u.isPro ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                        <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                        PRO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-[11px] font-semibold">
                        <Gift className="w-3 h-3" />
                        GRATUITO
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono">
                      <FolderOpen className="w-3 h-3 text-zinc-500" />
                      {u.projectCount}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="py-3 px-4 text-zinc-400">
                    {u.isPro && u.currentPeriodEnd ? (
                      <span className="text-emerald-400 text-[11px]">
                        Até {new Date(u.currentPeriodEnd).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">
                        Sem assinatura ativa
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
