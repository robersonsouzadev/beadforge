'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  ShoppingCart,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export function MaterialCostEstimatorSection() {
  const [projectSize, setProjectSize] = useState<'small' | 'medium' | 'large'>('medium');

  const configs = {
    small: {
      name: 'Chaveiro / Pixel Pequeno',
      dimensions: '1 Placa (14×14 cm)',
      beadCount: 850,
      colorsCount: 6,
      beadCostBrl: 12.75, // R$ 0.015 por bead
      pegboardBrl: 0, // reutilizável
      packagingBrl: 3.50,
      suggestedSalePriceBrl: 39.90,
      laborTimeHours: 0.8,
    },
    medium: {
      name: 'Quadro Geek / Decoração',
      dimensions: '2×2 Placas (29×29 cm)',
      beadCount: 3200,
      colorsCount: 14,
      beadCostBrl: 48.00,
      pegboardBrl: 0,
      packagingBrl: 6.00,
      suggestedSalePriceBrl: 119.90,
      laborTimeHours: 2.5,
    },
    large: {
      name: 'Painel Colecionável / 3D',
      dimensions: '3×3 Placas ou Escultura 3D',
      beadCount: 8400,
      colorsCount: 22,
      beadCostBrl: 126.00,
      pegboardBrl: 0,
      packagingBrl: 12.00,
      suggestedSalePriceBrl: 299.90,
      laborTimeHours: 6.0,
    },
  };

  const current = configs[projectSize];
  const totalCost = current.beadCostBrl + current.packagingBrl;
  const netProfit = current.suggestedSalePriceBrl - totalCost;
  const profitMarginPct = Math.round((netProfit / current.suggestedSalePriceBrl) * 100);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5" />
            <span>Custos Reais de Produção no Brasil</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Quanto custa produzir arte em beads e quanto você pode lucrar?
          </h2>

          <p className="text-sm sm:text-base text-zinc-400">
            O BeadForge calcula a contagem exata de beads e cruza com os preços reais praticados na <strong>Shopee</strong> e <strong>Mercado Livre</strong>.
          </p>
        </div>

        {/* Size Selector */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-xl mx-auto bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setProjectSize(size)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                projectSize === size
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {size === 'small' && 'Pequeno (Chaveiro)'}
              {size === 'medium' && 'Médio (Quadro 29cm)'}
              {size === 'large' && 'Grande / 3D (Painel)'}
            </button>
          ))}
        </div>

        {/* Interactive Breakdown Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Specs & Material Breakdown */}
          <div className="lg:col-span-7 bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <div>
                <h4 className="font-bold text-white text-base">{current.name}</h4>
                <span className="text-xs text-zinc-400">{current.dimensions}</span>
              </div>
              <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold rounded-lg">
                {current.beadCount.toLocaleString('pt-BR')} beads
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custo Estimado dos Beads (Shopee / ML):</span>
                </span>
                <span className="font-mono font-bold text-white">R$ {current.beadCostBrl.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
                  <span>Embalagem & Envio:</span>
                </span>
                <span className="font-mono font-bold text-white">R$ {current.packagingBrl.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cores Diferentes no Projeto:</span>
                </span>
                <span className="font-mono text-zinc-300">{current.colorsCount} cores</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-850 text-sm">
                <span className="font-bold text-zinc-200">Custo Total de Insumos:</span>
                <span className="font-mono font-extrabold text-amber-400">R$ {totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right: Profit & Sale Highlight */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 p-6 rounded-2xl border-2 border-emerald-500/40 space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Rentabilidade do Artesão</span>
              </span>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-zinc-400">Preço Sugerido de Venda:</span>
                <span className="text-2xl font-black text-white font-mono">
                  R$ {current.suggestedSalePriceBrl.toFixed(2)}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-400">Lucro Líquido Estimado:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  + R$ {netProfit.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-between">
                <span>Margem de Lucro:</span>
                <span className="text-sm font-black font-mono">{profitMarginPct}%</span>
              </div>
            </div>

            <Link
              href="/editor"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <span>Criar Molde & Ver Lista de Compras Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
