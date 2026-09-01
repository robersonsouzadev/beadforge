'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Store,
  Package,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
} from 'lucide-react';
import {
  listMerchantsAction,
  saveMerchantAction,
  deleteMerchantAction,
  listProductsAction,
  saveProductAction,
  deleteProductAction,
  getCommerceMetricsAction,
  seedPopularBeadProductsAction,
  type MerchantDTO,
  type ProductDTO,
  type CommerceMetricsDTO,
} from '@/app/actions/commerce';

export function AdminCommerceTab() {
  const [subTab, setSubTab] = useState<'metrics' | 'merchants' | 'products'>('metrics');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Data states
  const [metrics, setMetrics] = useState<CommerceMetricsDTO | null>(null);
  const [merchants, setMerchants] = useState<MerchantDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');

  // Modals
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantDTO | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);

  // Merchant form state
  const [mName, setMName] = useState('');
  const [mSlug, setMSlug] = useState('');
  const [mProgramType, setMProgramType] = useState('shopee_affiliate');
  const [mBaseUrl, setMBaseUrl] = useState('');
  const [mAffiliateId, setMAffiliateId] = useState('');
  const [mCommissionPct, setMCommissionPct] = useState(8);
  const [mCookieDays, setMCookieDays] = useState(7);
  const [mIsActive, setMIsActive] = useState(true);

  // Product form state
  const [pMerchantId, setPMerchantId] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pAffiliateUrl, setPAffiliateUrl] = useState('');
  const [pBrand, setPBrand] = useState('pindoo');
  const [pBeadSize, setPBeadSize] = useState('2.6mm');
  const [pColorCode, setPColorCode] = useState('');
  const [pColorHex, setPColorHex] = useState('#000000');
  const [pQuantity, setPQuantity] = useState(1000);
  const [pPriceBrl, setPPriceBrl] = useState(14.90);
  const [pRating, setPRating] = useState(4.8);
  const [pShippingDays, setPShippingDays] = useState(5);
  const [pProductType, setPProductType] = useState('single_color');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mRes, pRes, metricsRes] = await Promise.all([
        listMerchantsAction(),
        listProductsAction(),
        getCommerceMetricsAction(),
      ]);
      setMerchants(mRes);
      setProducts(pRes);
      setMetrics(metricsRes);
    } catch (err) {
      console.error('Erro ao carregar dados de commerce:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenMerchantModal = (merchant?: MerchantDTO) => {
    if (merchant) {
      setEditingMerchant(merchant);
      setMName(merchant.name);
      setMSlug(merchant.slug);
      setMProgramType(merchant.programType);
      setMBaseUrl(merchant.baseUrl || '');
      setMAffiliateId(merchant.affiliateId || '');
      setMCommissionPct(merchant.commissionPct);
      setMCookieDays(merchant.cookieDurationDays);
      setMIsActive(merchant.isActive);
    } else {
      setEditingMerchant(null);
      setMName('');
      setMSlug('');
      setMProgramType('shopee_affiliate');
      setMBaseUrl('https://shopee.com.br');
      setMAffiliateId('');
      setMCommissionPct(8);
      setMCookieDays(7);
      setMIsActive(true);
    }
    setIsMerchantModalOpen(true);
  };

  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveMerchantAction({
          id: editingMerchant?.id,
          name: mName,
          slug: mSlug,
          programType: mProgramType,
          baseUrl: mBaseUrl,
          affiliateId: mAffiliateId,
          commissionPct: Number(mCommissionPct),
          cookieDurationDays: Number(mCookieDays),
          isActive: mIsActive,
        });
        setIsMerchantModalOpen(false);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar parceiro.');
      }
    });
  };

  const handleDeleteMerchant = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir o parceiro "${name}" e todos os seus produtos associados?`)) return;
    startTransition(async () => {
      try {
        await deleteMerchantAction(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir parceiro.');
      }
    });
  };

  const handleOpenProductModal = (product?: ProductDTO) => {
    if (product) {
      setEditingProduct(product);
      setPMerchantId(product.merchantId);
      setPTitle(product.title);
      setPUrl(product.url);
      setPAffiliateUrl(product.affiliateUrl || product.url);
      setPBrand(product.brand);
      setPBeadSize(product.beadSize);
      setPColorCode(product.colorCode || '');
      setPColorHex(product.colorHex || '#000000');
      setPQuantity(product.quantityPerPack);
      setPPriceBrl(product.priceBrl);
      setPRating(product.rating);
      setPShippingDays(product.estimatedShippingDays);
      setPProductType(product.productType);
    } else {
      setEditingProduct(null);
      setPMerchantId(merchants[0]?.id || '');
      setPTitle('');
      setPUrl('');
      setPAffiliateUrl('');
      setPBrand('pindoo');
      setPBeadSize('2.6mm');
      setPColorCode('');
      setPColorHex('#000000');
      setPQuantity(1000);
      setPPriceBrl(14.90);
      setPRating(4.8);
      setPShippingDays(5);
      setPProductType('single_color');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pMerchantId) {
      alert('Selecione um parceiro/marketplace.');
      return;
    }
    startTransition(async () => {
      try {
        await saveProductAction({
          id: editingProduct?.id,
          merchantId: pMerchantId,
          title: pTitle,
          url: pUrl,
          affiliateUrl: pAffiliateUrl,
          brand: pBrand,
          beadSize: pBeadSize,
          colorCode: pColorCode || undefined,
          colorHex: pColorHex || undefined,
          quantityPerPack: Number(pQuantity),
          priceBrl: Number(pPriceBrl),
          rating: Number(pRating),
          estimatedShippingDays: Number(pShippingDays),
          productType: pProductType,
        });
        setIsProductModalOpen(false);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar produto.');
      }
    });
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Deseja excluir o produto "${title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir produto.');
      }
    });
  };

  const handleSeedPopular = async () => {
    if (!confirm('Deseja semear o catálogo inicial com os Marketplaces (Shopee, ML, Amazon) e 30 cores populares?')) return;
    startTransition(async () => {
      try {
        const res = await seedPopularBeadProductsAction();
        alert(`Sucesso! ${res.insertedCount} produtos populares foram adicionados ao catálogo.`);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao semear catálogo.');
      }
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.colorCode && p.colorCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMerchant = !selectedMerchantFilter || p.merchantId === selectedMerchantFilter;
    const matchesBrand = !selectedBrandFilter || p.brand.toLowerCase() === selectedBrandFilter.toLowerCase();
    return matchesSearch && matchesMerchant && matchesBrand;
  });

  return (
    <div className="space-y-6">
      {/* ── Sub Header com Ações Rápidas ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('metrics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'metrics' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Métricas & Cliques</span>
          </button>
          <button
            onClick={() => setSubTab('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'products' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catálogo de Produtos ({products.length})</span>
          </button>
          <button
            onClick={() => setSubTab('merchants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'merchants' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Marketplaces ({merchants.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedPopular}
            disabled={isPending}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow"
            title="Popula automaticamente Shopee, Mercado Livre e as cores mais usadas"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Semear Cores Populares</span>
          </button>

          {subTab === 'products' ? (
            <button
              onClick={() => handleOpenProductModal()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Produto</span>
            </button>
          ) : subTab === 'merchants' ? (
            <button
              onClick={() => handleOpenMerchantModal()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Marketplace</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Tab: Métricas ── */}
      {subTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Total de Cliques em Produtos</span>
                <MousePointerClick className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{metrics?.totalClicks || 0}</p>
              <span className="text-[10px] text-zinc-500">Cliques acumulados com intenção de compra</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Cliques Últimos 7 Dias</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">{metrics?.clicksLast7Days || 0}</p>
              <span className="text-[10px] text-emerald-500/80">Atividade recente</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Produtos no Catálogo</span>
                <Package className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{metrics?.totalProducts || 0}</p>
              <span className="text-[10px] text-zinc-500">Disponíveis para recomendação no BOM</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Marketplaces Conectados</span>
                <Store className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{metrics?.totalMerchants || 0}</p>
              <span className="text-[10px] text-zinc-500">Shopee, ML, Amazon, etc.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Produtos */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>Top Produtos Mais Clicados</span>
              </h3>

              {metrics?.topProducts && metrics.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {metrics.topProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{p.title}</p>
                        <p className="text-[10px] text-zinc-400">
                          {p.merchantName} &bull; R$ {p.priceBrl.toFixed(2)}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold rounded-lg text-xs shrink-0">
                        {p.clicks} cliques
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6">Nenhum clique registrado ainda.</p>
              )}
            </div>

            {/* Top Cores Mais Procuradas */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Top Cores Mais Buscadas pelos Usuários</span>
              </h3>

              {metrics?.topColors && metrics.topColors.length > 0 ? (
                <div className="space-y-2">
                  {metrics.topColors.map((c) => (
                    <div
                      key={c.colorCode}
                      className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 bg-zinc-800 text-amber-300 font-mono font-bold rounded-md text-xs">
                          {c.colorCode}
                        </span>
                        <span className="text-zinc-300">Demanda em projetos</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{c.clicks} interesse(s)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6">Nenhuma cor buscada ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Marketplaces ── */}
      {subTab === 'merchants' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {merchants.map((m) => (
              <div
                key={m.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl space-y-3 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{m.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {m.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-1.5 text-xs text-zinc-300 font-mono">
                    <p className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Comissão Média:</span>
                      <span className="text-emerald-400 font-bold">{m.commissionPct}%</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Janela de Cookie:</span>
                      <span className="text-zinc-300">{m.cookieDurationDays} dias</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Produtos Vinculados:</span>
                      <span className="text-amber-400 font-bold">{m.productCount || 0}</span>
                    </p>
                    {m.affiliateId && (
                      <p className="flex justify-between">
                        <span className="text-zinc-500 font-sans">ID de Afiliado:</span>
                        <span className="text-zinc-400 truncate max-w-[120px]">{m.affiliateId}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">{m.slug}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenMerchantModal(m)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMerchant(m.id, m.name)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Produtos do Catálogo ── */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Filtros e Busca */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código de cor (ex: A1, H10) ou título..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={selectedMerchantFilter}
              onChange={(e) => setSelectedMerchantFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
            >
              <option value="">Todos os Marketplaces</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
            >
              <option value="">Todas as Marcas</option>
              <option value="pindoo">Pindoo</option>
              <option value="hama">Hama</option>
              <option value="artkal">Artkal</option>
              <option value="perler">Perler</option>
            </select>
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl space-y-3 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold">
                      {p.merchantName}
                    </span>
                    {p.colorCode && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-md border border-zinc-700 shrink-0 shadow-sm"
                          style={{ backgroundColor: p.colorHex || '#000' }}
                        />
                        <span className="font-mono font-bold text-amber-400 text-xs">{p.colorCode}</span>
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-white text-xs line-clamp-2" title={p.title}>
                    {p.title}
                  </h4>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Preço Pacote:</span>
                      <span className="text-emerald-400 font-bold">R$ {p.priceBrl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Quantidade:</span>
                      <span className="text-zinc-300">{p.quantityPerPack} beads</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Preço/Bead:</span>
                      <span className="text-amber-400">R$ {p.pricePerBead.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <a
                    href={p.affiliateUrl || p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Testar Link Afiliado</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenProductModal(p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.title)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal de Marketplace ── */}
      {isMerchantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">
              {editingMerchant ? 'Editar Marketplace' : 'Novo Marketplace / Loja Parceira'}
            </h3>

            <form onSubmit={handleSaveMerchant} className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Nome do Parceiro *</label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => {
                    setMName(e.target.value);
                    if (!editingMerchant && !mSlug) setMSlug(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  }}
                  placeholder="Ex: Shopee Brasil"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Slug (Identificador) *</label>
                  <input
                    type="text"
                    value={mSlug}
                    onChange={(e) => setMSlug(e.target.value)}
                    placeholder="shopee"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tipo de Programa</label>
                  <select
                    value={mProgramType}
                    onChange={(e) => setMProgramType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="shopee_affiliate">Shopee Afiliados</option>
                    <option value="ml_affiliate">Mercado Livre</option>
                    <option value="amazon_associates">Amazon Associados</option>
                    <option value="direct_partner">Parceiro B2B Direto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">URL Base</label>
                <input
                  type="url"
                  value={mBaseUrl}
                  onChange={(e) => setMBaseUrl(e.target.value)}
                  placeholder="https://shopee.com.br"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">ID / Tag de Afiliado</label>
                  <input
                    type="text"
                    value={mAffiliateId}
                    onChange={(e) => setMAffiliateId(e.target.value)}
                    placeholder="Ex: beadforge-20"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Comissão Estimada (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mCommissionPct}
                    onChange={(e) => setMCommissionPct(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsMerchantModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow"
                >
                  {isPending ? 'Salvando...' : 'Salvar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Produto ── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">
              {editingProduct ? 'Editar Produto do Catálogo' : 'Novo Produto para Recomendação'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Marketplace / Parceiro *</label>
                <select
                  value={pMerchantId}
                  onChange={(e) => setPMerchantId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.commissionPct}% comissão)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Título do Produto *</label>
                <input
                  type="text"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="Ex: Mini Beads 2.6mm Cor A1 (Branco Puro) 1000un"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Código da Cor</label>
                  <input
                    type="text"
                    value={pColorCode}
                    onChange={(e) => setPColorCode(e.target.value.toUpperCase())}
                    placeholder="Ex: A1, H10"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Hexadecimal</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={pColorHex}
                      onChange={(e) => setPColorHex(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-950 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={pColorHex}
                      onChange={(e) => setPColorHex(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-2 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tamanho</label>
                  <select
                    value={pBeadSize}
                    onChange={(e) => setPBeadSize(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="2.6mm">Mini (2.6mm)</option>
                    <option value="5.0mm">Midi (5.0mm)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Preço Pacote (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pPriceBrl}
                    onChange={(e) => setPPriceBrl(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Qtd de Beads por Pacote *</label>
                  <input
                    type="number"
                    value={pQuantity}
                    onChange={(e) => setPQuantity(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">URL Original do Produto *</label>
                <input
                  type="url"
                  value={pUrl}
                  onChange={(e) => setPUrl(e.target.value)}
                  placeholder="https://shopee.com.br/produto-xyz"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Link de Afiliado (com tag de rastreamento)</label>
                <input
                  type="url"
                  value={pAffiliateUrl}
                  onChange={(e) => setPAffiliateUrl(e.target.value)}
                  placeholder="https://shopee.com.br/...&utm_source=beadforge"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow"
                >
                  {isPending ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
