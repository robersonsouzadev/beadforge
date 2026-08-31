'use client';

import React, { useState, useEffect } from 'react';
import { PALETTES } from '@/data/palettes';
import type { InventoryItemDTO } from '@/app/actions/inventory';
import { X, Sparkles, Plus, Check, Loader2 } from 'lucide-react';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    id?: string;
    brand: string;
    colorCode: string;
    colorName: string;
    colorHex: string;
    quantity: number;
    unitCostBrl: number;
    size: 'midi' | 'mini';
    lowStockThreshold: number;
  }) => Promise<void>;
  itemToEdit?: InventoryItemDTO | null;
}

export function InventoryItemModal({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
}: InventoryItemModalProps) {
  const [brand, setBrand] = useState('pindoo');
  const [size, setSize] = useState<'midi' | 'mini'>('midi');
  const [colorCode, setColorCode] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#FF0000');
  const [quantity, setQuantity] = useState(1000);
  const [unitCostBrl, setUnitCostBrl] = useState(0.015);
  const [lowStockThreshold, setLowStockThreshold] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<string>('pindoo-standard');

  useEffect(() => {
    if (itemToEdit) {
      setBrand(itemToEdit.brand);
      setSize(itemToEdit.size);
      setColorCode(itemToEdit.colorCode);
      setColorName(itemToEdit.colorName);
      setColorHex(itemToEdit.colorHex);
      setQuantity(itemToEdit.quantity);
      setUnitCostBrl(itemToEdit.unitCostBrl);
      setLowStockThreshold(itemToEdit.lowStockThreshold);
    } else {
      setBrand('pindoo');
      setSize('midi');
      setColorCode('');
      setColorName('');
      setColorHex('#FF0000');
      setQuantity(1000);
      setUnitCostBrl(0.015);
      setLowStockThreshold(100);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const currentPalette = PALETTES[selectedPaletteKey]?.colors || [];

  const handleSelectPaletteColor = (c: { code: string; name: string; hex: string }) => {
    setColorCode(c.code);
    setColorName(c.name);
    setColorHex(c.hex);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorCode.trim()) {
      alert('Por favor, informe o código da cor.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: itemToEdit?.id,
        brand,
        colorCode: colorCode.trim().toUpperCase(),
        colorName: colorName.trim() || `Cor ${colorCode.trim()}`,
        colorHex: colorHex.trim(),
        quantity: Number(quantity) || 0,
        unitCostBrl: Number(unitCostBrl) || 0.015,
        size,
        lowStockThreshold: Number(lowStockThreshold) || 100,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {itemToEdit ? 'Editar Cor no Estoque' : 'Adicionar Nova Cor'}
              </h3>
              <p className="text-xs text-zinc-400">
                Cadastre a quantidade física e o custo unitário do pacote.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Marca e Tamanho */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Marca dos Beads
              </label>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  if (e.target.value === 'pindoo') setSelectedPaletteKey('pindoo-standard');
                  else if (e.target.value === 'hama') setSelectedPaletteKey(size === 'mini' ? 'hama-mini' : 'hama-midi');
                  else if (e.target.value === 'artkal') setSelectedPaletteKey('mini-26mm-120');
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
              >
                <option value="pindoo">Pindoo Beads</option>
                <option value="hama">Hama Beads</option>
                <option value="artkal">Artkal</option>
                <option value="perler">Perler Beads</option>
                <option value="other">Outra / Genérica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tamanho da Peça
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as 'midi' | 'mini')}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="midi">Midi 5,0mm (Padrão)</option>
                <option value="mini">Mini 2,6mm (Alta Definição)</option>
              </select>
            </div>
          </div>

          {/* Seletor rápido de cores da paleta oficial */}
          {!itemToEdit && (
            <div className="space-y-1.5 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-300">
                  Preencher rápido a partir da paleta:
                </span>
                <select
                  value={selectedPaletteKey}
                  onChange={(e) => setSelectedPaletteKey(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] rounded px-2 py-0.5"
                >
                  <option value="pindoo-standard">Pindoo Standard</option>
                  <option value="hama-midi">Hama Midi</option>
                  <option value="hama-mini">Hama Mini</option>
                  <option value="mini-26mm-120">Estojo Mini 120 Cores</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-h-20 flex-wrap">
                {currentPalette.slice(0, 32).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectPaletteColor(c)}
                    title={`[${c.code}] ${c.name}`}
                    className="w-5 h-5 rounded-md border border-white/20 hover:scale-125 transition shrink-0 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Código, Nome e Hexadecimal */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Código Oficial
              </label>
              <input
                type="text"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                placeholder="Ex: H22, P01"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 uppercase focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome da Cor
              </label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Ex: Vermelho Natalino"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Color Picker & Preview */}
          <div className="flex items-center gap-3 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <div className="flex-1">
              <span className="text-[10px] text-zinc-400 block">Tom Hexadecimal:</span>
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="bg-transparent border-0 text-xs font-mono text-zinc-200 focus:outline-none w-24 uppercase"
              />
            </div>
            <div
              className="w-7 h-7 rounded-lg border border-zinc-600 shadow-inner"
              style={{ backgroundColor: colorHex }}
            />
          </div>

          {/* Quantidade e Custo por Bead */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Quantidade em Estoque (peças)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Ex: 1000 = 1 pacote fechado
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
                value={unitCostBrl}
                onChange={(e) => setUnitCostBrl(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                R$ {(unitCostBrl * 1000).toFixed(2)} por pacote (1000un)
              </span>
            </div>
          </div>

          {/* Alerta de Estoque Baixo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Avisar quando estoque estiver abaixo de:
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 100)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{itemToEdit ? 'Salvar Alterações' : 'Cadastrar no Estoque'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
