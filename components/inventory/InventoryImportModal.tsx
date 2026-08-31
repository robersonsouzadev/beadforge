'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Palette,
  Sparkles,
  Download,
  Upload,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { populateFromPaletteAction } from '@/app/actions/inventory';

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InventoryImportModal({
  isOpen,
  onClose,
  onSuccess,
}: InventoryImportModalProps) {
  const [tab, setTab] = useState<'palette' | 'csv'>('palette');
  const [selectedPalette, setSelectedPalette] = useState('pindoo-standard');
  const [defaultQuantity, setDefaultQuantity] = useState(1000);
  const [defaultUnitCost, setDefaultUnitCost] = useState(0.015);
  const [csvText, setCsvText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePopulatePalette = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await populateFromPaletteAction(
        selectedPalette,
        defaultQuantity,
        defaultUnitCost
      );
      alert(`Sucesso! ${res.addedCount} novas cores foram adicionadas ao seu estoque.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao importar paleta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csv = `codigo,nome,hex,marca,quantidade,custo_unitario,tamanho
P01,Preto,#000000,pindoo,1000,0.0150,midi
P02,Branco,#FFFFFF,pindoo,1500,0.0150,midi
P03,Vermelho,#E53935,pindoo,800,0.0150,midi
H22,Vermelho Natal,#C62828,hama,1000,0.0180,midi
S-01,Branco Neve,#FAFAFA,artkal,2000,0.0120,mini`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_estoque_beadforge.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Importação em Lote de Estoque
              </h3>
              <p className="text-xs text-zinc-400">
                Popule seu estoque físico rapidamente para economizar tempo.
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

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 p-1.5 gap-1.5">
          <button
            onClick={() => setTab('palette')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              tab === 'palette'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Paleta Oficial (1 Clique)</span>
          </button>
          <button
            onClick={() => setTab('csv')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              tab === 'csv'
                ? 'bg-amber-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Arquivo CSV</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'palette' ? (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p leading-relaxed>
                  Essa opção cadastra automaticamente todas as cores oficiais da marca selecionada no seu inventário, evitando o trabalho de cadastrar cor por cor manualmente!
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Selecione a Paleta Oficial:
                </label>
                <select
                  value={selectedPalette}
                  onChange={(e) => setSelectedPalette(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="pindoo-standard">Pindoo Beads Standard (5.0mm Midi)</option>
                  <option value="hama-midi">Hama Beads Midi (5.0mm)</option>
                  <option value="hama-mini">Hama Beads Mini (2.6mm)</option>
                  <option value="mini-26mm-120">Estojo Mini Beads 120 Cores (2.6mm Séries A-M)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Qtd Inicial por Cor
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={defaultQuantity}
                    onChange={(e) => setDefaultQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    (ex: 1000 = 1 pct)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Custo por Bead (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={defaultUnitCost}
                    onChange={(e) => setDefaultUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    R$ {(defaultUnitCost * 1000).toFixed(2)} / pct
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePopulatePalette}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Importar Todas as Cores da Paleta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Estrutura necessária: <code className="text-amber-400 font-mono text-[11px]">codigo, nome, hex, marca, quantidade, custo_unitario, tamanho</code>
                </span>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo CSV</span>
                </button>
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Cole o conteúdo CSV aqui ou use o modelo padrão..."
                rows={6}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
              />

              <button
                type="button"
                onClick={() => {
                  alert('Para importar via CSV, você também pode colar suas linhas acima ou importar pela paleta com 1 clique!');
                }}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition"
              >
                Processar CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
