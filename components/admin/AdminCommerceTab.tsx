'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit2,
  Copy,
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
  Grid,
  Wrench,
  Flame,
  Boxes,
  Trophy,
  DollarSign,
} from 'lucide-react';
import {
  listMerchantsAction,
  saveMerchantAction,
  deleteMerchantAction,
  listCategoriesAction,
  saveCategoryAction,
  deleteCategoryAction,
  listProductsAction,
  saveProductAction,
  deleteProductAction,
  duplicateProductAction,
  getCommerceMetricsAction,
  seedPopularBeadProductsAction,
  type MerchantDTO,
  type CategoryDTO,
  type ProductDTO,
  type CommerceMetricsDTO,
} from '@/app/actions/commerce';

interface AdminCommerceTabProps {
  initialMerchants?: MerchantDTO[];
  initialCategories?: CategoryDTO[];
  initialProducts?: ProductDTO[];
  initialMetrics?: CommerceMetricsDTO | null;
}

export function AdminCommerceTab({
  initialMerchants = [],
  initialCategories = [],
  initialProducts = [],
  initialMetrics = null,
}: AdminCommerceTabProps = {}) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<'metrics' | 'products' | 'merchants' | 'categories'>('metrics');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Data states
  const [metrics, setMetrics] = useState<CommerceMetricsDTO | null>(initialMetrics);
  const [merchants, setMerchants] = useState<MerchantDTO[]>(initialMerchants);
  const [categories, setCategories] = useState<CategoryDTO[]>(initialCategories);
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Modals
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantDTO | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);

  // Merchant form state
  const [mName, setMName] = useState('');
  const [mSlug, setMSlug] = useState('');
  const [mProgramType, setMProgramType] = useState('ml_affiliate');
  const [mBaseUrl, setMBaseUrl] = useState('');
  const [mAffiliateId, setMAffiliateId] = useState('');
  const [mDefaultTag, setMDefaultTag] = useState('beadforgekits');
  const [mCommissionPct, setMCommissionPct] = useState(12);
  const [mCookieDays, setMCookieDays] = useState(1);
  const [mPriority, setMPriority] = useState(10);
  const [mIsActive, setMIsActive] = useState(true);

  // Category form state
  const [cName, setCName] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cIcon, setCIcon] = useState('Package');
  const [cDescription, setCDescription] = useState('');
  const [cOrder, setCOrder] = useState(0);

  // Product form state
  const [pMerchantId, setPMerchantId] = useState('');
  const [pCategoryId, setPCategoryId] = useState('');
  const [pExternalSku, setPExternalSku] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pShortDescription, setPShortDescription] = useState('');
  const [pUrl, setPUrl] = useState('');
  const [pAffiliateUrl, setPAffiliateUrl] = useState('');
  const [pCampaignTag, setPCampaignTag] = useState('beadforgekits');
  const [pBrand, setPBrand] = useState('generic');
  const [pBeadSize, setPBeadSize] = useState('2.6mm');
  const [pProductType, setPProductType] = useState('multi_color_kit');
  const [pBadgeTag, setPBadgeTag] = useState('best_value');
  const [pQuantity, setPQuantity] = useState(10000);
  const [pColorCount, setPColorCount] = useState(24);
  const [pColorCode, setPColorCode] = useState('');
  const [pColorHex, setPColorHex] = useState('#000000');
  const [pPriceBrl, setPPriceBrl] = useState(29.96);
  const [pPreviousPriceBrl, setPPreviousPriceBrl] = useState<string>('39.90');
  const [pPriceVaries, setPPriceVaries] = useState(true);
  const [pRating, setPRating] = useState(4.85);
  const [pReviewCount, setPReviewCount] = useState(140);
  const [pSellerName, setPSellerName] = useState('Mercado Livre Oficial');
  const [pCommissionPct, setPCommissionPct] = useState(12);
  const [pPriorityScore, setPPriorityScore] = useState(100);
  const [pShippingDays, setPShippingDays] = useState(2);
  const [pImageUrl, setPImageUrl] = useState('');
  const [pIsActive, setPIsActive] = useState(true);

  const loadData = async () => {
    try {
      const [mRes, cRes, pRes, metricsRes] = await Promise.all([
        listMerchantsAction(),
        listCategoriesAction(),
        listProductsAction(),
        getCommerceMetricsAction(),
      ]);
      setMerchants(mRes);
      setCategories(cRes);
      setProducts(pRes);
      setMetrics(metricsRes);
    } catch (err) {
      console.error('Erro ao carregar dados de commerce:', err);
    }
  };

  useEffect(() => {
    if (initialMerchants?.length) setMerchants(initialMerchants);
    if (initialCategories?.length) setCategories(initialCategories);
    if (initialProducts?.length) setProducts(initialProducts);
    if (initialMetrics) setMetrics(initialMetrics);
  }, [initialMerchants, initialCategories, initialProducts, initialMetrics]);

  // ── Merchant Handlers ──
  const handleOpenMerchantModal = (merchant?: MerchantDTO) => {
    if (merchant) {
      setEditingMerchant(merchant);
      setMName(merchant.name);
      setMSlug(merchant.slug);
      setMProgramType(merchant.programType);
      setMBaseUrl(merchant.baseUrl || '');
      setMAffiliateId(merchant.affiliateId || '');
      setMDefaultTag(merchant.defaultCampaignTag || 'beadforgekits');
      setMCommissionPct(merchant.commissionPct);
      setMCookieDays(merchant.cookieDurationDays);
      setMPriority(merchant.priority);
      setMIsActive(merchant.isActive);
    } else {
      setEditingMerchant(null);
      setMName('');
      setMSlug('');
      setMProgramType('ml_affiliate');
      setMBaseUrl('https://www.mercadolivre.com.br');
      setMAffiliateId('beadforge-ml');
      setMDefaultTag('beadforgekits');
      setMCommissionPct(12);
      setMCookieDays(1);
      setMPriority(10);
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
          defaultCampaignTag: mDefaultTag,
          commissionPct: Number(mCommissionPct),
          cookieDurationDays: Number(mCookieDays),
          priority: Number(mPriority),
          isActive: mIsActive,
        });
        setIsMerchantModalOpen(false);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar parceiro.');
      }
    });
  };

  const handleDeleteMerchant = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir o marketplace "${name}" e todos os produtos vinculados?`)) return;
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      try {
        await deleteMerchantAction(id);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir marketplace.');
        await loadData();
      }
    });
  };

  // ── Category Handlers ──
  const handleOpenCategoryModal = (cat?: CategoryDTO) => {
    if (cat) {
      setEditingCategory(cat);
      setCName(cat.name);
      setCSlug(cat.slug);
      setCIcon(cat.icon);
      setCDescription(cat.description || '');
      setCOrder(cat.displayOrder);
    } else {
      setEditingCategory(null);
      setCName('');
      setCSlug('');
      setCIcon('Package');
      setCDescription('');
      setCOrder(categories.length + 1);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveCategoryAction({
          id: editingCategory?.id,
          name: cName,
          slug: cSlug,
          icon: cIcon,
          description: cDescription,
          displayOrder: Number(cOrder),
        });
        setIsCategoryModalOpen(false);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar categoria.');
      }
    });
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a categoria "${name}"?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir categoria.');
        await loadData();
      }
    });
  };

  // ── Product Handlers ──
  const handleOpenProductModal = (product?: ProductDTO) => {
    if (product) {
      setEditingProduct(product);
      setPMerchantId(product.merchantId);
      setPCategoryId(product.categoryId || '');
      setPExternalSku(product.externalSku || '');
      setPTitle(product.title);
      setPShortDescription(product.shortDescription || '');
      setPUrl(product.url);
      setPAffiliateUrl(product.affiliateUrl || product.url);
      setPCampaignTag(product.campaignTag || 'beadforgekits');
      setPBrand(product.brand);
      setPBeadSize(product.beadSize);
      setPProductType(product.productType || 'multi_color_kit');
      setPBadgeTag(product.badgeTag || 'best_value');
      setPQuantity(product.quantityPerPack);
      setPColorCount(product.colorCount);
      setPColorCode(product.colorCode || '');
      setPColorHex(product.colorHex || '#000000');
      setPPriceBrl(product.priceBrl);
      setPPreviousPriceBrl(product.previousPriceBrl ? String(product.previousPriceBrl) : '');
      setPPriceVaries(product.priceVaries);
      setPRating(product.rating);
      setPReviewCount(product.reviewCount);
      setPSellerName(product.sellerName || '');
      setPCommissionPct(product.estimatedCommissionPct);
      setPPriorityScore(product.priorityScore);
      setPShippingDays(product.estimatedShippingDays);
      setPImageUrl(product.imageUrl || '');
      setPIsActive(product.isActive);
    } else {
      setEditingProduct(null);
      setPMerchantId(merchants[0]?.id || '');
      setPCategoryId(categories[0]?.id || '');
      setPExternalSku('7SVEU4-S4TM');
      setPTitle('Conjunto 10.000 Hama Beads 2,6mm Miçangas Brinquedo 24 Cores');
      setPShortDescription('Kit completo com 24 cores vivas em caixa organizadora.');
      setPUrl('https://meli.la/2q4Xt3j');
      setPAffiliateUrl('https://meli.la/2q4Xt3j');
      setPCampaignTag('beadforgekits');
      setPBrand('generic');
      setPBeadSize('2.6mm');
      setPProductType('multi_color_kit');
      setPBadgeTag('best_value');
      setPQuantity(10000);
      setPColorCount(24);
      setPColorCode('');
      setPColorHex('#000000');
      setPPriceBrl(29.96);
      setPPreviousPriceBrl('39.90');
      setPPriceVaries(true);
      setPRating(4.85);
      setPReviewCount(140);
      setPSellerName('Mercado Livre Oficial');
      setPCommissionPct(12);
      setPPriorityScore(100);
      setPShippingDays(2);
      setPImageUrl('');
      setPIsActive(true);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pMerchantId) {
      alert('Selecione um parceiro/marketplace.');
      return;
    }
    const finalUrl = (pAffiliateUrl || pUrl || '').trim();
    if (!finalUrl) {
      alert('Por favor, informe a URL do produto ou link afiliado.');
      return;
    }

    startTransition(async () => {
      try {
        await saveProductAction({
          id: editingProduct?.id,
          merchantId: pMerchantId,
          categoryId: pCategoryId || undefined,
          externalSku: pExternalSku.trim() || undefined,
          title: pTitle,
          shortDescription: pShortDescription.trim() || undefined,
          url: pUrl.trim() || finalUrl,
          affiliateUrl: pAffiliateUrl.trim() || finalUrl,
          campaignTag: pCampaignTag.trim() || 'beadforgekits',
          brand: pBrand,
          beadSize: pBeadSize,
          productType: pProductType,
          badgeTag: pBadgeTag || undefined,
          colorCode: pProductType === 'single_color' ? pColorCode.trim() : undefined,
          colorHex: pProductType === 'single_color' ? pColorHex : undefined,
          quantityPerPack: Number(pQuantity),
          colorCount: Number(pColorCount),
          priceBrl: Number(pPriceBrl),
          previousPriceBrl: pPreviousPriceBrl ? Number(pPreviousPriceBrl) : undefined,
          priceVaries: pPriceVaries,
          rating: Number(pRating),
          reviewCount: Number(pReviewCount),
          sellerName: pSellerName.trim() || undefined,
          estimatedCommissionPct: Number(pCommissionPct),
          priorityScore: Number(pPriorityScore),
          estimatedShippingDays: Number(pShippingDays),
          imageUrl: pImageUrl.trim() || undefined,
          isActive: pIsActive,
        });
        setIsProductModalOpen(false);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar produto.');
      }
    });
  };

  const handleDuplicateProduct = async (id: string) => {
    startTransition(async () => {
      try {
        await duplicateProductAction(id);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao duplicar produto.');
      }
    });
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Deseja excluir o produto "${title}"?`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir produto.');
        await loadData();
      }
    });
  };

  const handleSeedPopular = async () => {
    if (!confirm('Deseja semear as Categorias, Marketplaces (Mercado Livre, Shopee, Amazon) e o Kit 10.000 (R$ 29,96) com placas e acessórios?')) return;
    setIsLoading(true);
    startTransition(async () => {
      try {
        const res = await seedPopularBeadProductsAction();
        alert(`Sucesso! ${res.insertedCount} itens cadastrados com o primeiro produto do Mercado Livre!`);
        await loadData();
        router.refresh();
      } catch (err: any) {
        alert(err.message || 'Erro ao semear catálogo.');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.colorCode && p.colorCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.externalSku && p.externalSku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMerchant = !selectedMerchantFilter || p.merchantId === selectedMerchantFilter;
    const matchesCategory = !selectedCategoryFilter || p.categoryId === selectedCategoryFilter;
    const matchesType = !selectedTypeFilter || p.productType === selectedTypeFilter;
    return matchesSearch && matchesMerchant && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* ── Sub Header com Navegação de Abas ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-900/80 p-3.5 sm:p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSubTab('metrics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'metrics'
                ? 'bg-amber-400 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Métricas & Cliques</span>
          </button>
          <button
            onClick={() => setSubTab('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'products'
                ? 'bg-amber-400 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catálogo de Produtos ({products.length})</span>
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'categories'
                ? 'bg-amber-400 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorias ({categories.length})</span>
          </button>
          <button
            onClick={() => setSubTab('merchants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'merchants'
                ? 'bg-amber-400 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
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
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow"
            title="Popula Mercado Livre, Shopee, Amazon e o Kit 10.000 24 Cores"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Semear Catálogo Padrão (ML)</span>
          </button>

          {subTab === 'products' && (
            <button
              onClick={() => handleOpenProductModal()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Produto</span>
            </button>
          )}

          {subTab === 'categories' && (
            <button
              onClick={() => handleOpenCategoryModal()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Categoria</span>
            </button>
          )}

          {subTab === 'merchants' && (
            <button
              onClick={() => handleOpenMerchantModal()}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Marketplace</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB: MÉTRICAS & FUNIL ── */}
      {subTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Total de Cliques de Afiliados</span>
                <MousePointerClick className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{metrics?.totalClicks || 0}</p>
              <span className="text-[10px] text-zinc-500">Cliques acumulados com tag beadforgekits</span>
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
              <span className="text-[10px] text-zinc-500">{metrics?.totalCategories || 0} categorias ativas</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Estimativa de Comissão</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">
                R$ {(metrics?.estimatedRevenueBrl || 0).toFixed(2)}
              </p>
              <span className="text-[10px] text-zinc-500">Baseada em 4% conversão (~12% ML)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Produtos Mais Clicados */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
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
                        <div className="flex items-center gap-1.5">
                          {p.badgeTag && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                              {p.badgeTag === 'best_value' ? 'Melhor Custo' : p.badgeTag}
                            </span>
                          )}
                          <p className="font-semibold text-white truncate">{p.title}</p>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          {p.merchantName} &bull; R$ {p.priceBrl.toFixed(2)}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold rounded-lg text-xs shrink-0">
                        {p.clicks} cliques
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-6">Nenhum clique registrado ainda.</p>
              )}
            </div>

            {/* Top Cores com Maior Demanda */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Top Cores Demandadas em Projetos</span>
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
                        <span className="text-zinc-300">Interesse em refil</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{c.clicks} busca(s)</span>
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

      {/* ── TAB: PRODUTOS DO CATÁLOGO ── */}
      {subTab === 'products' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, SKU (7SVEU4-S4TM) ou cor..."
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
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
            >
              <option value="">Todos os Tipos</option>
              <option value="multi_color_kit">Kit Multicolorido</option>
              <option value="single_color">Refil de Cor</option>
              <option value="pegboard">Placa / Pegboard</option>
              <option value="ironing_paper">Fusão / Passar</option>
              <option value="tool">Ferramenta</option>
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
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold">
                      {p.merchantName}
                    </span>
                    {p.badgeTag && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
                        {p.badgeTag === 'best_value' ? '🥇 Melhor Custo' : p.badgeTag}
                      </span>
                    )}
                    {p.colorCode && (
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-md border border-zinc-700 shrink-0 shadow-sm"
                          style={{ backgroundColor: p.colorHex || '#000' }}
                        />
                        <span className="font-mono font-bold text-amber-400 text-xs">{p.colorCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 shrink-0 rounded-xl bg-zinc-950 border border-zinc-800 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs line-clamp-2" title={p.title}>
                        {p.title}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Preço:</span>
                      <span className="text-emerald-400 font-bold">R$ {p.priceBrl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Contagem:</span>
                      <span className="text-zinc-300">
                        {p.quantityPerPack.toLocaleString('pt-BR')} un ({p.colorCount} cores)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Comissão Estimada:</span>
                      <span className="text-amber-400">{p.estimatedCommissionPct}%</span>
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
                    <span>Testar Link</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicateProduct(p.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Duplicar Produto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
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

      {/* ── TAB: CATEGORIAS ── */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 font-bold">
                        {c.displayOrder}
                      </span>
                      <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">/{c.slug}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{c.description || 'Categoria de produtos'}</p>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{c.productCount || 0} produtos vinculados</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCategoryModal(c)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
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

      {/* ── TAB: MARKETPLACES ── */}
      {subTab === 'merchants' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {merchants.map((m) => (
              <div
                key={m.id}
                className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{m.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {m.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-1.5 text-xs text-zinc-300 font-mono">
                    <p className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Comissão Média:</span>
                      <span className="text-emerald-400 font-bold">{m.commissionPct}%</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Tag Padrão:</span>
                      <span className="text-amber-400 font-bold">{m.defaultCampaignTag}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Produtos Ativos:</span>
                      <span className="text-white">{m.productCount || 0}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">{m.slug}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenMerchantModal(m)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMerchant(m.id, m.name)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400"
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

      {/* ── MODAL: PRODUTO ── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs max-h-[92vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">
              {editingProduct ? 'Editar Produto do Catálogo' : 'Novo Produto para Recomendação'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Marketplace *</label>
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
                  <label className="block font-semibold text-zinc-300 mb-1">Categoria *</label>
                  <select
                    value={pCategoryId}
                    onChange={(e) => setPCategoryId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Título do Produto *</label>
                <input
                  type="text"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="Ex: Conjunto 10.000 Hama Beads 2,6mm Miçangas Brinquedo 24 Cores"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">SKU / ID no Marketplace</label>
                  <input
                    type="text"
                    value={pExternalSku}
                    onChange={(e) => setPExternalSku(e.target.value)}
                    placeholder="7SVEU4-S4TM"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tag / Campanha</label>
                  <input
                    type="text"
                    value={pCampaignTag}
                    onChange={(e) => setPCampaignTag(e.target.value)}
                    placeholder="beadforgekits"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Link de Afiliado (URL de Destino) *</label>
                <input
                  type="url"
                  value={pAffiliateUrl}
                  onChange={(e) => {
                    setPAffiliateUrl(e.target.value);
                    if (!pUrl) setPUrl(e.target.value);
                  }}
                  placeholder="https://meli.la/2q4Xt3j"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Preço Atual (R$) *</label>
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
                  <label className="block font-semibold text-zinc-300 mb-1">Total de Beads *</label>
                  <input
                    type="number"
                    value={pQuantity}
                    onChange={(e) => setPQuantity(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Qtd de Cores *</label>
                  <input
                    type="number"
                    value={pColorCount}
                    onChange={(e) => setPColorCount(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* URL da Imagem do Produto e Preview */}
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  URL da Imagem do Produto (Mercado Livre / CDN / Web)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pImageUrl}
                    onChange={(e) => setPImageUrl(e.target.value)}
                    placeholder="https://http2.mlstatic.com/D_NQ_NP_2X_...webp"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  {pImageUrl && (
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-zinc-950 border border-zinc-700 p-0.5 flex items-center justify-center overflow-hidden">
                      <img
                        src={pImageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Dica: Você pode copiar o link da imagem do anúncio do Mercado Livre ou Shopee.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tipo de Produto</label>
                  <select
                    value={pProductType}
                    onChange={(e) => setPProductType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="multi_color_kit">Kit Multicolorido</option>
                    <option value="single_color">Refil Cor Única</option>
                    <option value="pegboard">Placa / Pegboard</option>
                    <option value="ironing_paper">Papel de Fusão</option>
                    <option value="tool">Ferramenta / Pinça</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Badge de Recomendação</label>
                  <select
                    value={pBadgeTag}
                    onChange={(e) => setPBadgeTag(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="best_value">🥇 Melhor Custo-Benefício</option>
                    <option value="most_complete">🥈 Mais Completo</option>
                    <option value="high_volume">🥉 Grande Volume</option>
                    <option value="essential_tool">🛠️ Acessório Essencial</option>
                    <option value="recommended">⭐ Recomendado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow"
                >
                  {isPending ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CATEGORIA ── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => {
                    setCName(e.target.value);
                    if (!editingCategory && !cSlug) setCSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  placeholder="Ex: Kits Completos"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Slug (Identificador) *</label>
                <input
                  type="text"
                  value={cSlug}
                  onChange={(e) => setCSlug(e.target.value)}
                  placeholder="kits"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MARKETPLACE ── */}
      {isMerchantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-4 text-xs">
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
                  placeholder="Ex: Mercado Livre"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={mSlug}
                    onChange={(e) => setMSlug(e.target.value)}
                    placeholder="mercadolivre"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tag de Campanha</label>
                  <input
                    type="text"
                    value={mDefaultTag}
                    onChange={(e) => setMDefaultTag(e.target.value)}
                    placeholder="beadforgekits"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Comissão Média (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mCommissionPct}
                    onChange={(e) => setMCommissionPct(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Janela de Cookie (dias)</label>
                  <input
                    type="number"
                    value={mCookieDays}
                    onChange={(e) => setMCookieDays(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsMerchantModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow"
                >
                  Salvar Marketplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
