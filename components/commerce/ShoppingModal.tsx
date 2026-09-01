'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  X,
  ExternalLink,
  Store,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Star,
  Info,
  Package,
  Layers,
} from 'lucide-react';
import {
  getRecommendedProductsForBOMAction,
  getFeaturedKitsAction,
  trackProductClickAction,
  type RecommendedColorOption,
  type ProductDTO,
} from '@/app/actions/commerce';
import type { BeadSummary } from '@/core/schemas/project';

interface ShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BeadSummary[];
  projectName?: string;
  projectId?: string;
}

export function ShoppingModal({
  isOpen,
  onClose,
  summary,
  projectName = 'Projeto',
  projectId,
}: ShoppingModalProps) {
  const [recommendations, setRecommendations] = useState<RecommendedColorOption[]>([]);
  const [featuredKits, setFeaturedKits] = useState<ProductDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'colors' | 'kits'>('colors');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    Promise.all([
      summary.length > 0
        ? getRecommendedProductsForBOMAction({
            summary: summary.map((s) => ({
              code: s.code,
              name: s.name,
              hex: s.hex,
              count: s.count,
            })),
            brand: 'pindoo',
            beadSize: '2.6mm',
          })
        : Promise.resolve([]),
      getFeaturedKitsAction(),
    ])
      .then(([bomRes, kitsRes]) => {
        setRecommendations(bomRes);
        setFeaturedKits(kitsRes);
      })
      .catch((err) => console.error('Erro ao buscar recomendações:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, summary]);

  if (!isOpen) return null;

  const totalRequiredBeads = summary.reduce((acc, s) => acc + s.count, 0);
  const totalColors = summary.length;

  const handleProductClick = (productId: string, colorCode: string | undefined, url: string) => {
    trackProductClickAction({
      productId,
      projectId,
      colorCode,
      source: 'shopping_modal',
    }).catch(console.warn);

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 text-zinc-950">
              <ShoppingCart className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Comprar Materiais</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold uppercase">
                  Kit do Projeto
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Opções de compra com entrega no Brasil para: <strong className="text-zinc-200">{projectName}</strong>
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
        <div className="px-5 py-2.5 bg-zinc-950 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'colors'
                  ? 'bg-amber-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cores do Projeto ({totalColors})</span>
            </button>
            <button
              onClick={() => setActiveTab('kits')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'kits'
                  ? 'bg-amber-400 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kits & Acessórios ({featuredKits.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span>{totalRequiredBeads.toLocaleString('pt-BR')} beads necessários</span>
            <span>&bull;</span>
            <span>Tamanho <strong>2.6mm</strong></span>
          </div>
        </div>

        {/* ── Content Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Buscando melhores preços na Shopee e Mercado Livre...</span>
            </div>
          ) : activeTab === 'colors' ? (
            recommendations.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <Package className="w-10 h-10 text-zinc-600 mb-2 mx-auto opacity-60" />
                <p>Nenhuma cor encontrada no catálogo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.colorCode}
                    className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 space-y-3 shadow-md hover:border-zinc-700 transition"
                  >
                    {/* Cor Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-xl border border-zinc-700 shadow-md shrink-0"
                          style={{ backgroundColor: rec.colorHex }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 text-sm">{rec.colorCode}</span>
                            <span className="font-bold text-white text-xs">{rec.colorName}</span>
                          </div>
                          <span className="text-[11px] text-zinc-400 block">
                            Você precisa de: <strong className="text-zinc-200">{rec.requiredCount} beads</strong> &bull; Sugestão: {rec.packsNeeded} pct ({rec.totalBeads} un)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Opções de Produtos para esta cor */}
                    {rec.products.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {rec.products.map((prod) => (
                          <div
                            key={prod.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                              prod.isBestPrice
                                ? 'bg-zinc-900/90 border-amber-500/40 shadow-sm shadow-amber-500/5'
                                : 'bg-zinc-900/50 border-zinc-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    prod.merchantSlug === 'shopee'
                                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                      : prod.merchantSlug === 'mercadolivre'
                                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  }`}
                                >
                                  {prod.merchantName}
                                </span>

                                {prod.isBestPrice && (
                                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Melhor Preço</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-semibold text-zinc-200 line-clamp-1" title={prod.title}>
                                {prod.title}
                              </p>

                              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                                <span className="text-emerald-400 font-bold text-sm">
                                  R$ {prod.priceBrl.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  (R$ {prod.pricePerBead.toFixed(4)} / bead)
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleProductClick(prod.id, rec.colorCode, prod.affiliateUrl)}
                              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.98]"
                            >
                              <span>Comprar no {prod.merchantName}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-850 text-xs text-zinc-400 flex items-center justify-between">
                        <span>Buscar refil da cor {rec.colorCode} na Shopee Brasil:</span>
                        <a
                          href={`https://shopee.com.br/search?keyword=${encodeURIComponent(`mini beads 2.6mm ${rec.colorCode}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-lg flex items-center gap-1 text-[11px]"
                        >
                          <span>Buscar na Shopee</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Aba de Kits & Acessórios */
            featuredKits.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <Package className="w-10 h-10 text-zinc-600 mb-2 mx-auto opacity-60" />
                <p>Nenhum kit ou acessório cadastrado no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featuredKits.map((kit) => (
                  <div
                    key={kit.id}
                    className="p-4 bg-zinc-950/70 border border-zinc-800/90 rounded-2xl flex flex-col justify-between space-y-3 hover:border-zinc-700 transition shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            kit.merchantSlug === 'shopee'
                              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                              : kit.merchantSlug === 'mercadolivre'
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                              : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {kit.merchantName || 'Parceiro'}
                        </span>

                        {kit.externalSku && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Cód: {kit.externalSku}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-2" title={kit.title}>
                        {kit.title}
                      </h4>

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-base font-black text-emerald-400 font-mono">
                          R$ {kit.priceBrl.toFixed(2)}
                        </span>
                        {kit.quantityPerPack > 1 && (
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {kit.quantityPerPack.toLocaleString('pt-BR')} beads
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleProductClick(kit.id, undefined, kit.affiliateUrl || kit.url)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.98]"
                    >
                      <span>Comprar no {kit.merchantName || 'Marketplace'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ── Footer com Disclaimer Transparente ── */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>
              Alguns links são de parceiros (Shopee / Mercado Livre). Você compra com segurança e apoia a plataforma sem custo extra!
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
