'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  getUserInventory,
  addOrUpdateInventoryItemAction,
  updateItemQuantityAction,
  deleteInventoryItemAction,
  type InventoryItemDTO,
  type InventoryStats,
} from '@/app/actions/inventory';
import { InventoryItemModal } from '@/components/inventory/InventoryItemModal';
import { InventoryImportModal } from '@/components/inventory/InventoryImportModal';
import {
  Boxes,
  Plus,
  Download,
  Search,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  Layers,
  Coins,
  Package,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalColors: 0,
    totalBeads: 0,
    totalValueBrl: 0,
    lowStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItemDTO | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getUserInventory();
      setItems(data.items);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSaveItem = async (itemData: any) => {
    await addOrUpdateInventoryItemAction(itemData);
    await loadInventory();
  };

  const handleUpdateQuantity = (itemId: string, amount: number, mode: 'set' | 'delta') => {
    startTransition(async () => {
      try {
        await updateItemQuantityAction(itemId, amount, mode);
        await loadInventory();
      } catch (err: any) {
        alert(err.message || 'Erro ao atualizar quantidade.');
      }
    });
  };

  const handleDeleteItem = async (itemId: string, colorName: string) => {
    if (!confirm(`Deseja remover a cor "${colorName}" do seu estoque?`)) return;
    try {
      await deleteInventoryItemAction(itemId);
      await loadInventory();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir item.');
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.colorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || item.brand === selectedBrand;
    const matchesSize = selectedSize === 'all' || item.size === selectedSize;
    return matchesSearch && matchesBrand && matchesSize;
  });

  const brands = [
    { id: 'all', label: 'Todas as Marcas' },
    { id: 'pindoo', label: 'Pindoo' },
    { id: 'hama', label: 'Hama' },
    { id: 'artkal', label: 'Artkal' },
    { id: 'perler', label: 'Perler' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-8 select-none w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Meu Estoque Físico de Beads</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold border border-amber-400/25">
                Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Controle seu inventário de cores, custo médio por peça e evite paradas na produção.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold rounded-xl transition shadow"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Importar Paleta / CSV</span>
            <span className="sm:hidden">Importar</span>
          </button>

          <button
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Cor</span>
          </button>
        </div>
      </div>

      {/* ── Stats Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Beads */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Total em Estoque</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {stats.totalBeads.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-zinc-500 block">beads físicos</span>
          </div>
        </div>

        {/* Card 2: Cores Cadastradas */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Cores Distintas</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {stats.totalColors}
            </span>
            <span className="text-[10px] text-zinc-500 block">tonalidades ativas</span>
          </div>
        </div>

        {/* Card 3: Valor do Estoque */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Valor do Inventário</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {stats.totalValueBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="text-[10px] text-zinc-500 block">patrimônio em insumos</span>
          </div>
        </div>

        {/* Card 4: Alertas de Estoque Baixo */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            stats.lowStockCount > 0
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Estoque Baixo</span>
            <span className={`text-xl sm:text-2xl font-black font-mono ${
              stats.lowStockCount > 0 ? 'text-rose-400' : 'text-zinc-300'
            }`}>
              {stats.lowStockCount}
            </span>
            <span className="text-[10px] text-zinc-500 block">precisam reposição</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="space-y-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código (ex: H22, P01) ou nome da cor..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Size Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Tamanho:</span>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todos os Tamanhos</option>
              <option value="midi">Midi (5,0mm)</option>
              <option value="mini">Mini (2,6mm)</option>
            </select>
          </div>
        </div>

        {/* Brand filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedBrand === b.id
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Inventory Items Grid / List ── */}
      {isLoading ? (
        <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Carregando estoque de beads...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Boxes className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">
            {items.length === 0
              ? 'Nenhuma cor cadastrada no seu estoque'
              : 'Nenhuma cor encontrada com os filtros selecionados'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {items.length === 0
              ? 'Comece importando uma paleta completa com 1 clique ou adicione suas cores manualmente.'
              : 'Tente alterar os termos de busca ou remover os filtros.'}
          </p>
          {items.length === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow hover:bg-amber-300 transition"
              >
                Importar Paleta Completa
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredItems.map((item) => {
            const isLowStock = item.quantity <= item.lowStockThreshold;
            const totalItemValue = item.quantity * item.unitCostBrl;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border bg-zinc-900/80 hover:bg-zinc-850 transition duration-200 flex flex-col justify-between space-y-3.5 shadow-md relative group ${
                  isLowStock ? 'border-rose-500/40' : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Bead 3D Icon */}
                    <div
                      className="w-7 h-8 rounded-[4px] border border-black/40 shadow-inner flex items-center justify-center ring-1 ring-white/10 shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                    >
                      <div className="w-2 h-2 rounded-full bg-zinc-950/70 border border-white/20" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {item.colorCode}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 uppercase font-semibold border border-zinc-700">
                          {item.brand}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800/60 text-zinc-400 font-mono">
                          {item.size === 'mini' ? '2.6mm' : '5.0mm'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 truncate max-w-[130px]" title={item.colorName}>
                        {item.colorName}
                      </h4>
                    </div>
                  </div>

                  {/* Actions Drop/Buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setItemToEdit(item);
                        setIsItemModalOpen(true);
                      }}
                      title="Editar detalhes"
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.colorName)}
                      title="Excluir cor"
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">Disponível:</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`font-mono font-extrabold text-sm ${
                        isLowStock ? 'text-rose-400' : 'text-white'
                      }`}>
                        {item.quantity.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-zinc-500">peças</span>
                    </div>
                  </div>

                  {/* Quick +/- Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -100, 'delta')}
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition"
                    >
                      -100
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 100, 'delta')}
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-white transition"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 500, 'delta')}
                      className="py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-white transition"
                    >
                      +500
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1000, 'delta')}
                      className="py-1 rounded bg-amber-400/15 hover:bg-amber-400/25 text-[10px] font-mono font-bold text-amber-300 transition"
                    >
                      +1k
                    </button>
                  </div>
                </div>

                {/* Footer / Cost Info */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400 border-t border-zinc-800/60">
                  <span>
                    R$ {(item.unitCostBrl * 1000).toFixed(2)} / pct
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {totalItemValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />

      <InventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadInventory}
      />
    </div>
  );
}
