'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wand2,
  Key,
  DollarSign,
  Cpu,
  Coins,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AdminAiConfig,
  AdminAiStats,
  updateSystemAiConfigAction,
} from '@/app/actions/admin';

interface AdminAiConfigTabProps {
  config: AdminAiConfig;
  stats: AdminAiStats;
}

export function AdminAiConfigTab({ config, stats }: AdminAiConfigTabProps) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState(config.activeProvider);
  const [tripoApiKey, setTripoApiKey] = useState(config.tripoApiKey);
  const [meshyApiKey, setMeshyApiKey] = useState(config.meshyApiKey);
  const [replicateToken, setReplicateToken] = useState(config.replicateToken);
  const [defaultAiCredits, setDefaultAiCredits] = useState(config.defaultAiCredits);
  const [costPerCreditBrl, setCostPerCreditBrl] = useState(config.costPerCreditBrl);

  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateSystemAiConfigAction({
          activeProvider,
          tripoApiKey,
          meshyApiKey,
          replicateToken,
          defaultAiCredits,
          costPerCreditBrl,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar configurações de IA.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Cards de Métricas e Custos de IA ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Gerações */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Gerações 3D por IA
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
              {stats.totalGenerations}
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">
              {stats.successGenerations} concluídas com sucesso
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Wand2 className="w-5 h-5" />
          </div>
        </div>

        {/* Custo Total em Dólares */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Custo de API Acumulado
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 font-mono">
              ${stats.totalCostUsd.toFixed(2)} USD
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Consumo de tokens de inferência
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Custo Convertido em Reais */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Gasto Estimado em BRL
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">
              R$ {stats.totalCostBrl.toFixed(2).replace('.', ',')}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Câmbio estimado R$ 5,65
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Créditos em Circulação */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Créditos em Circulação
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1 font-mono">
              {stats.totalCreditsCirculating}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Disponíveis nas contas dos usuários
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Formulário de Configurações de IA ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>Configuração dos Provedores e Tokens de IA 3D</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gerencie suas chaves de API e escolha o motor de reconstrução 3D padrão.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-950" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savedSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>

        {/* Seleção do Provedor Ativo */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Provedor Ativo Padrão
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                id: 'local_neural',
                name: 'Local Neural Extruder',
                badge: 'Gratuito / Sem API Externa',
                desc: 'Reconstrução volumétrica direta no servidor',
              },
              {
                id: 'tripo3d',
                name: 'Tripo3D API',
                badge: '~$0.08 / modelo',
                desc: 'Alta fidelidade e malhas detalhadas',
              },
              {
                id: 'meshy',
                name: 'Meshy 3D API',
                badge: '~$0.15 / modelo',
                desc: 'Geração rápida de malha com texturas PBR',
              },
              {
                id: 'replicate',
                name: 'Replicate (Hunyuan3D)',
                badge: '~$0.10 / modelo',
                desc: 'Motor open-weight do Beads3D',
              },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveProvider(p.id as any)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  activeProvider === p.id
                    ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-100">{p.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeProvider === p.id ? 'bg-amber-400 ring-4 ring-amber-400/20' : 'bg-zinc-700'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono block mt-1">{p.badge}</span>
                  <p className="text-[11px] text-zinc-400 mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chaves de API */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Tripo3D Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Tripo3D API Key</span>
              </span>
              <a
                href="https://platform.tripo3d.ai/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <span>Obter Chave</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="password"
              placeholder="tp_live_..."
              value={tripoApiKey}
              onChange={(e) => setTripoApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
            />
          </div>

          {/* Meshy Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-400" />
                <span>Meshy API Key</span>
              </span>
              <a
                href="https://meshy.ai/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <span>Obter Chave</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="password"
              placeholder="msy_..."
              value={meshyApiKey}
              onChange={(e) => setMeshyApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
            />
          </div>

          {/* Replicate Token */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>Replicate Token (Hunyuan)</span>
              </span>
              <a
                href="https://replicate.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>Obter Token</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="password"
              placeholder="r8_..."
              value={replicateToken}
              onChange={(e) => setReplicateToken(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Políticas de Créditos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Créditos Grátis de Boas-Vindas (Novas Contas)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={defaultAiCredits}
              onChange={(e) => setDefaultAiCredits(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
            />
            <span className="text-[10px] text-zinc-500 block">
              Quantidade de modelos 3D que o visitante pode gerar antes de precisar assinar.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Preço de Venda do Crédito Avulso (BRL)
            </label>
            <input
              type="number"
              step="0.10"
              min="0.50"
              value={costPerCreditBrl}
              onChange={(e) => setCostPerCreditBrl(parseFloat(e.target.value) || 1.99)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
            />
            <span className="text-[10px] text-zinc-500 block">
              Valor de referência para recargas de tokens (ex: R$ 2,49 por modelo).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
