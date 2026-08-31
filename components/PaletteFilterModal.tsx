'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { getUserInventory } from '@/app/actions/inventory';
import {
  X,
  Check,
  Filter,
  Package,
  Search,
  CheckCheck,
  XCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export function PaletteFilterModal() {
  const {
    isPaletteFilterModalOpen,
    setIsPaletteFilterModalOpen,
    activePalette,
    enabledBeadCodes,
    toggleBeadCodeEnabled,
    enableAllBeadCodes,
    disableAllBeadCodes,
    setEnabledBeadCodes,
  } = useEditorStore();

  const [search, setSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!isPaletteFilterModalOpen) return null;

  const totalColors = activePalette.length;

  // Se enabledBeadCodes for null, todas estão ativas por padrão
  const getIsEnabled = (code: string) => {
    if (!enabledBeadCodes) return true;
    return enabledBeadCodes[code] !== false;
  };

  const activeCount = activePalette.filter((c) => getIsEnabled(c.code)).length;

  const filteredPalette = activePalette.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleImportInventory = async () => {
    setIsImporting(true);
    setImportMessage(null);
    try {
      const data = await getUserInventory();
      const items = data?.items || [];
      if (items.length === 0) {
        setImportMessage('Nenhum item cadastrado no seu estoque.');
        return;
      }

      // Códigos de beads que têm quantidade > 0 no estoque
      const availableCodes = items
        .filter((it: any) => it.quantity > 0)
        .map((it: any) => it.colorCode.toUpperCase().trim());

      setEnabledBeadCodes(availableCodes);
      setImportMessage(`✅ ${availableCodes.length} cores importadas do seu estoque físico!`);
    } catch (err: any) {
      setImportMessage('Erro ao carregar estoque: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Filtro de Cores da Gaveta</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {activeCount} de {totalColors} ativas
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Desmarque as cores que você não possui para que o gerador use apenas seus beads reais.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPaletteFilterModalOpen(false)}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar de Ações Rápidas */}
        <div className="p-4 bg-zinc-950/30 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou nome..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              onClick={enableAllBeadCodes}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Todas</span>
            </button>

            <button
              onClick={disableAllBeadCodes}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Nenhuma</span>
            </button>

            <button
              onClick={handleImportInventory}
              disabled={isImporting}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Package className="w-3.5 h-3.5" />
              )}
              <span>Importar do Estoque</span>
            </button>
          </div>
        </div>

        {importMessage && (
          <div className="px-5 py-2 text-xs bg-amber-500/10 border-b border-amber-500/20 text-amber-300 font-medium">
            {importMessage}
          </div>
        )}

        {/* Grid de Cores Selecionáveis */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredPalette.map((bead) => {
            const isEnabled = getIsEnabled(bead.code);
            return (
              <button
                key={bead.code}
                onClick={() => toggleBeadCodeEnabled(bead.code)}
                type="button"
                className={`p-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all select-none ${
                  isEnabled
                    ? 'bg-zinc-800/90 border-zinc-600 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800/80 opacity-40 hover:opacity-75'
                }`}
              >
                {/* Swatch & Checkbox */}
                <div
                  className="w-7 h-7 rounded-xl border border-black/30 shadow-inner flex items-center justify-center shrink-0 relative"
                  style={{ backgroundColor: bead.hex }}
                >
                  {isEnabled && (
                    <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-mono font-bold block truncate text-amber-400">
                    {bead.code}
                  </span>
                  <span className="text-[11px] text-zinc-300 block truncate">
                    {bead.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-400">
            {activeCount === 0
              ? '⚠️ Selecione pelo menos 1 cor para gerar o molde.'
              : `${activeCount} cores disponíveis para mapeamento.`}
          </span>

          <button
            onClick={() => setIsPaletteFilterModalOpen(false)}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            Aplicar Filtro
          </button>
        </div>
      </div>
    </div>
  );
}
