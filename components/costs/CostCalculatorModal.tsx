'use client';

import React, { useState, useEffect } from 'react';
import {
  calculateProjectCostAction,
  getUserCostConfig,
  type ProjectCostCalculationResult,
} from '@/app/actions/costs';
import {
  X,
  Calculator,
  Sparkles,
  Copy,
  Check,
  Percent,
  Clock,
  Package,
  TrendingUp,
  Store,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface CostCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  totalBeads: number;
  baseMaterialCostBrl: number;
}

export function CostCalculatorModal({
  isOpen,
  onClose,
  projectName,
  totalBeads,
  baseMaterialCostBrl,
}: CostCalculatorModalProps) {
  const [laborHours, setLaborHours] = useState<number>(1.0);
  const [laborRate, setLaborRate] = useState<number>(25.0);
  const [wastePct, setWastePct] = useState<number>(10.0);
  const [packagingBrl, setPackagingBrl] = useState<number>(5.0);
  const [marginPct, setMarginPct] = useState<number>(35.0);
  const [channelFeePct, setChannelFeePct] = useState<number>(14.0);
  const [channelPreset, setChannelPreset] = useState<string>('shopee');
  const [copied, setCopied] = useState(false);

  const [calcResult, setCalcResult] = useState<ProjectCostCalculationResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      getUserCostConfig().then((cfg) => {
        setLaborRate(cfg.laborRatePerHourBrl);
        setWastePct(cfg.wastePct);
        setPackagingBrl(cfg.packagingCostBrl);
        setMarginPct(cfg.defaultMarginPct);
        setChannelFeePct(cfg.defaultChannelFeePct);

        const speed = cfg.averageBeadsPerHour > 0 ? cfg.averageBeadsPerHour : 600;
        const autoHours = Number((totalBeads / speed).toFixed(1)) || 0.5;
        setLaborHours(autoHours);
      });
    }
  }, [isOpen, totalBeads]);

  useEffect(() => {
    if (!isOpen) return;

    calculateProjectCostAction({
      projectName,
      totalBeads,
      baseMaterialCostBrl,
      customLaborHours: laborHours,
      customLaborRateBrl: laborRate,
      customWastePct: wastePct,
      customPackagingBrl: packagingBrl,
      customMarginPct: marginPct,
      customChannelFeePct: channelFeePct,
    }).then(setCalcResult);
  }, [
    isOpen,
    projectName,
    totalBeads,
    baseMaterialCostBrl,
    laborHours,
    laborRate,
    wastePct,
    packagingBrl,
    marginPct,
    channelFeePct,
  ]);

  if (!isOpen) return null;

  const handleChannelPreset = (preset: string) => {
    setChannelPreset(preset);
    if (preset === 'direct' || preset === 'whatsapp') {
      setChannelFeePct(0);
    } else if (preset === 'shopee') {
      setChannelFeePct(14);
    } else if (preset === 'mercadolivre') {
      setChannelFeePct(16);
    } else if (preset === 'elo7') {
      setChannelFeePct(12);
    }
  };

  const handleCopyWhatsApp = () => {
    if (!calcResult) return;
    navigator.clipboard.writeText(calcResult.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatBrl = (val?: number) =>
    (val ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Calculadora de Custos & Precificação</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Lucro Real
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Precifique seu projeto considerando materiais, horas trabalhadas e taxas de venda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Main Price Card */}
          {calcResult && (
            <div className="bg-gradient-to-br from-amber-500/15 via-zinc-950 to-zinc-950 border border-amber-500/40 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider block">
                  Preço de Venda Recomendado
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                    {formatBrl(calcResult.suggestedSellingPriceBrl)}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    (com {calcResult.channelFeePct}% de taxa)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-300 mt-1">
                  <span>Lucro Líquido: <strong className="text-emerald-400 font-mono">{formatBrl(calcResult.netProfitBrl)}</strong> ({calcResult.profitMarginPct}%)</span>
                  <span>&bull;</span>
                  <span>Ganhos: <strong className="text-white font-mono">{formatBrl(calcResult.hourlyEarningsBrl)}/h</strong></span>
                </div>
              </div>

              <button
                onClick={handleCopyWhatsApp}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado para o WhatsApp!' : 'Copiar Proposta WhatsApp'}</span>
              </button>
            </div>
          )}

          {/* Breakdown Pills */}
          {calcResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Insumos (+{calcResult.wasteAmountBrl ? 'desp.' : ''})</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatBrl(calcResult.totalMaterialCostBrl)}
                </span>
              </div>

              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Mão de Obra ({calcResult.estimatedLaborHours}h)</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatBrl(calcResult.laborCostBrl)}
                </span>
              </div>

              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Taxa do Marketplace</span>
                <span className="text-sm font-bold text-rose-400 font-mono">
                  {formatBrl(calcResult.channelFeeAmountBrl)}
                </span>
              </div>

              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Custo Total de Prod.</span>
                <span className="text-sm font-bold text-amber-300 font-mono">
                  {formatBrl(calcResult.totalProductionCostBrl)}
                </span>
              </div>
            </div>
          )}

          {/* Channel Presets */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-300">
              Canal de Venda da Peça:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'direct', label: 'Venda Direta / PIX', fee: '0%' },
                { id: 'shopee', label: 'Shopee', fee: '14%' },
                { id: 'mercadolivre', label: 'Mercado Livre', fee: '16%' },
                { id: 'elo7', label: 'Elo7', fee: '12%' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleChannelPreset(p.id)}
                  className={`p-2 rounded-xl border text-left transition ${
                    channelPreset === p.id
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="block font-semibold">{p.label}</span>
                  <span className="text-[10px] opacity-75">{p.fee} comissão</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
            {/* Margem de Lucro */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Margem de Lucro Desejada:</span>
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {marginPct}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={marginPct}
                onChange={(e) => setMarginPct(parseInt(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Horas de Trabalho */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tempo de Montagem Estimado:</span>
                </span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {laborHours}h
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={laborHours}
                onChange={(e) => setLaborHours(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Valor da Hora */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium">Seu Valor por Hora (R$/h):</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  R$ {laborRate.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={laborRate}
                onChange={(e) => setLaborRate(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Embalagem & Desperdício */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium">Embalagem + Fita (R$):</span>
                <span className="font-mono font-bold text-zinc-200 text-sm">
                  R$ {packagingBrl.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={packagingBrl}
                onChange={(e) => setPackagingBrl(parseInt(e.target.value))}
                className="w-full accent-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Fórmula: Custo Total ÷ (1 - Taxa%) &bull; Lucro Líquido Protegido
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
