'use client';

import React, { useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';
import {
  X,
  Upload,
  Eye,
  EyeOff,
  Sliders,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

export function ReferenceOverlayModal() {
  const {
    isReferenceModalOpen,
    setIsReferenceModalOpen,
    referenceImageUrl,
    referenceOpacity,
    isReferenceOverlayActive,
    setReferenceImage,
    setReferenceOpacity,
    toggleReferenceOverlay,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isReferenceModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setReferenceImage(file, url);
  };

  const handleRemove = () => {
    setReferenceImage(null, null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Modo Calque / Imagem de Guia
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Projete uma foto semitransparente sob a prancha para decalcar manualmente.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReferenceModalOpen(false)}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-5">
          {/* Upload / Preview */}
          {!referenceImageUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-amber-400/60 bg-zinc-950/40 hover:bg-zinc-800/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 rounded-full bg-zinc-800 group-hover:bg-amber-400/20 text-zinc-400 group-hover:text-amber-400 transition">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-200">
                Escolher Imagem de Referência
              </span>
              <span className="text-[11px] text-zinc-500">
                PNG, JPG ou WebP para colocar no fundo
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950/50 aspect-video flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={referenceImageUrl}
                  alt="Imagem de Referência"
                  className="max-h-full max-w-full object-contain"
                  style={{ opacity: isReferenceOverlayActive ? referenceOpacity : 0.2 }}
                />

                <div className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-900/90 backdrop-blur p-1 rounded-xl border border-zinc-700">
                  <button
                    onClick={toggleReferenceOverlay}
                    title={isReferenceOverlayActive ? 'Ocultar Calque' : 'Exibir Calque'}
                    className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                  >
                    {isReferenceOverlayActive ? (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>
                  <button
                    onClick={handleRemove}
                    title="Remover Imagem"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slider de Opacidade */}
              <div className="space-y-2 bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Opacidade do Calque
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {Math.round(referenceOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={referenceOpacity}
                  onChange={(e) => setReferenceOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
          <button
            onClick={() => setIsReferenceModalOpen(false)}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
