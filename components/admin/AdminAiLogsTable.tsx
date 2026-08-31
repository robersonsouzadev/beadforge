'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Cpu,
  User,
} from 'lucide-react';
import { AdminAiLogItem } from '@/app/actions/admin';

interface AdminAiLogsTableProps {
  logs: AdminAiLogItem[];
}

export function AdminAiLogsTable({ logs }: AdminAiLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.provider.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 select-none">
      {/* Header & Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Logs de Auditoria e Consumo de IA</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registro em tempo real de cada geração 3D, provedor acionado, custo e tempo de resposta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Busca */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por modelo, usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none w-48 sm:w-60"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sucesso
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'failed'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Falhas
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Data / Hora</th>
              <th className="py-3 px-4">Modelo</th>
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Provedor</th>
              <th className="py-3 px-4 text-center">Tempo (ms)</th>
              <th className="py-3 px-4 text-center">Custo Estimado</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Nenhum log de geração encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-850/50 transition">
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>

                  <td className="py-3 px-4 text-zinc-200 font-bold">
                    {log.modelName || 'Modelo 3D'}
                  </td>

                  <td className="py-3 px-4 text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-zinc-500" />
                      <span className="truncate max-w-[140px]">{log.userName || log.userEmail}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                      <Cpu className="w-3 h-3 text-amber-400" />
                      {log.provider}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-zinc-400 text-[11px]">
                    {log.durationMs} ms
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-rose-400 text-[11px]">
                    ${log.estimatedCostUsd.toFixed(4)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {log.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[10px] uppercase" title={log.errorMessage || ''}>
                        <XCircle className="w-3 h-3" />
                        Erro
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
