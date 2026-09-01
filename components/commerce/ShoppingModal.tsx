'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  X,
  ExternalLink,
  Store,
  Sparkles,
  Trophy,
  Layers,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
  Star,
  Info,
  Grid,
  Wrench,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import {
  getRecommendedProductsForBOMAction,
  trackProductClickAction,
  trackAffiliateEventAction,
} from '@/app/actions/commerce';
import type { FullProjectRecommendations, CandidateProduct } from '@/core/commerce/recommendation-engine';
import type { BeadSummary } from '@/core/schemas/project';

interface ShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BeadSummary[];
  projectName?: string;
  projectId?: string;
  gridWidth?: number;
  gridHeight?: number;
}

export function ShoppingModal({
  isOpen,
  onClose,
  summary,
  projectName = 'Projeto de Beads',
  projectId,
  gridWidth = 57,
  gridHeight = 57,
}: ShoppingModalProps) {
  const [data, setData] = useState<FullProjectRecommendations | null>(null);
  const [activeTab, setActiveTab] = useState<'kits' | 'pegboards' | 'colors'>('kits');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    trackAffiliateEventAction({
      eventType: 'modal_open',
      projectId,
      source: 'shopping_modal',
    }).catch(console.warn);

    getRecommendedProductsForBOMAction({
      summary: summary.map((s) => ({
        code: s.code,
        name: s.name,
        hex: s.hex,
        count: s.count,
      })),
      beadSize: '2.6mm',
      gridWidth,
      gridHeight,
    })
      .then((res) => {
        setData(res);
      })
      .catch((err) => console.error('Erro ao carregar recomendações:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, summary, projectId, gridWidth, gridHeight]);

  if (!isOpen) return null;

  const totalRequiredBeads = summary.reduce((acc, s) => acc + s.count, 0);
  const totalColors = summary.length;

  const handleProductClick = (
    product: CandidateProduct,
    colorCode?: string,
    source: string = 'shopping_modal'
  ) => {
    trackProductClickAction({
      productId: product.id,
      projectId,
      colorCode,
      source,
      campaignTag: product.campaignTag || 'beadforgekits',
    }).catch(console.warn);

    const targetUrl = product.affiliateUrl || product.url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/10 text-zinc-950 font-black">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Materiais para este Projeto
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold uppercase">
                  Recomendação Contextual
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Seleção compatível com entrega no Brasil para: <strong className="text-zinc-200">{projectName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Specs & Tabs Bar ── */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('kits')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'kits'
                  ? 'bg-amber-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kits Recomendados</span>
            </button>
            <button
              onClick={() => setActiveTab('pegboards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'pegboards'
                  ? 'bg-amber-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Placas & Acessórios</span>
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'colors'
                  ? 'bg-amber-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Refis por Cor ({totalColors})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="text-white font-bold">{totalRequiredBeads.toLocaleString('pt-BR')} beads</span>
            <span>&bull;</span>
            <span>{totalColors} cores</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-bold">2,6 mm</span>
          </div>
        </div>

        {/* ── Content Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Calculando melhor combinação de materiais e preços...</span>
            </div>
          ) : activeTab === 'kits' ? (
            /* ── ABA 1: KITS RECOMENDADOS ── */
            <div className="space-y-4">
              {/* HERO CARD: MELHOR CUSTO-BENEFÍCIO */}
              {data?.bestValueKit && (
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{data.bestValueKit.badge.label}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 uppercase">
                        {data.bestValueKit.product.merchantName}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        {data.bestValueKit.product.priceVaries ? 'Preço verificado no Mercado Livre:' : 'Preço estimado:'}
                      </span>
                      <div className="flex items-baseline gap-2">
                        {data.bestValueKit.product.previousPriceBrl && (
                          <span className="text-xs text-zinc-500 line-through font-mono">
                            R$ {data.bestValueKit.product.previousPriceBrl.toFixed(2)}
                          </span>
                        )}
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          R$ {data.bestValueKit.product.priceBrl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {data.bestValueKit.product.title}
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1">
                      {data.bestValueKit.product.shortDescription || data.bestValueKit.reasonText}
                    </p>
                  </div>

                  {/* Especificações do Kit */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Quantidade no Kit</span>
                      <strong className="text-white font-mono">{data.bestValueKit.product.quantityPerPack.toLocaleString('pt-BR')} beads</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Cores Inclusas</span>
                      <strong className="text-amber-400 font-mono">{data.bestValueKit.product.colorCount} cores</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Custo por Bead</span>
                      <strong className="text-emerald-400 font-mono">R$ {data.bestValueKit.product.pricePerBead.toFixed(4)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Cobertura do Molde</span>
                      <strong className="text-emerald-400 font-mono">100% das peças</strong>
                    </div>
                  </div>

                  {/* CTA Principal de Compra */}
                  <button
                    type="button"
                    onClick={() => handleProductClick(data.bestValueKit!.product, undefined, 'shopping_modal_hero')}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-zinc-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] cursor-pointer"
                  >
                    <span>Comprar no {data.bestValueKit.product.merchantName}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* KITS ALTERNATIVOS */}
              {data?.alternativeKits && data.alternativeKits.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Outras Opções Recomendadas</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.alternativeKits.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-zinc-700 transition shadow-md"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              {item.badge.label}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {item.product.merchantName}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-white line-clamp-2" title={item.product.title}>
                            {item.product.title}
                          </h5>

                          <div className="flex items-baseline justify-between pt-1">
                            <span className="text-lg font-black text-emerald-400 font-mono">
                              R$ {item.product.priceBrl.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {item.product.quantityPerPack.toLocaleString('pt-BR')} beads ({item.product.colorCount} cores)
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleProductClick(item.product, undefined, 'shopping_modal_alt')}
                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <span>Comprar no {item.product.merchantName}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'pegboards' ? (
            /* ── ABA 2: PLACAS & ACESSÓRIOS ── */
            <div className="space-y-4">
              {/* Placa Necessária para o Projeto */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">
                      Placa Pegboard para este Molde ({gridWidth}x{gridHeight} pinos)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                    {data?.compatiblePegboards?.boardsNeeded === 1
                      ? '1 Placa de 14,5cm'
                      : `${data?.compatiblePegboards?.boardsNeeded} Placas Modulares`}
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  {data?.compatiblePegboards?.plateName}. {data?.compatiblePegboards?.isModular ? 'Encaixe modular para criar áreas maiores.' : 'Ideal para montagem integral.'}
                </p>

                {data?.compatiblePegboards?.products && data.compatiblePegboards.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {data.compatiblePegboards.products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-white truncate">{p.title}</p>
                          <p className="text-emerald-400 font-mono font-bold">R$ {p.priceBrl.toFixed(2)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleProductClick(p, undefined, 'shopping_modal_pegboard')}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
                        >
                          <span>Comprar</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                    <span>Buscar Placa Pegboard Mini 57x57 no Mercado Livre:</span>
                    <a
                      href={`https://lista.mercadolivre.com.br/placa-pegboard-mini-2.6mm-57x57`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-lg flex items-center gap-1 text-[11px]"
                    >
                      <span>Buscar no Mercado Livre</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Acessórios de Fusão e Ferramentas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acessórios & Ferramentas Essenciais</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data?.accessories.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          {acc.productType === 'ironing_paper' ? 'Fusão / Passar' : 'Ferramenta'}
                        </span>
                        <h5 className="text-xs font-bold text-white line-clamp-1">{acc.title}</h5>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{acc.shortDescription}</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono pt-1">
                          R$ {acc.priceBrl.toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleProductClick(acc, undefined, 'shopping_modal_accessory')}
                        className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <span>Comprar no {acc.merchantName}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── ABA 3: REFIS POR COR ── */
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Se você já possui as cores básicas e precisa apenas de refis avulsos (1.000 un):
              </p>

              <div className="space-y-3">
                {data?.colorRefills.map((refil) => (
                  <div
                    key={refil.colorCode}
                    className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-lg border border-zinc-700 shrink-0 shadow-sm"
                          style={{ backgroundColor: refil.colorHex }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-xs">{refil.colorCode}</span>
                            <span className="font-bold text-white text-xs">{refil.colorName}</span>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            Necessário: <strong className="text-zinc-200">{refil.requiredCount} beads</strong> &bull; Sugestão: {refil.packsNeeded} pacote(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {refil.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {refil.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-zinc-200 truncate">{opt.title}</p>
                              <p className="text-emerald-400 font-mono font-bold">R$ {opt.priceBrl.toFixed(2)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleProductClick(opt, refil.colorCode, 'shopping_modal_color_option')}
                              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-lg text-xs shrink-0 flex items-center gap-1"
                            >
                              <span>Comprar</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850 text-xs text-zinc-400 flex items-center justify-between">
                        <span>Buscar refil da cor {refil.colorCode} no Mercado Livre:</span>
                        <a
                          href={`https://lista.mercadolivre.com.br/${encodeURIComponent(`mini beads 2.6mm ${refil.colorCode}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-lg flex items-center gap-1 text-[11px]"
                        >
                          <span>Buscar no ML</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer com Disclaimer de Compliance ── */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>
              Você compra com segurança no marketplace oficial (Mercado Livre / Shopee). O BeadForge pode receber comissão pela indicação sem custo extra para você!
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl shrink-0"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
