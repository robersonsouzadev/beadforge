'use client';

import React, { useState } from 'react';
import { publishPatternToGalleryAction } from '@/app/actions/gallery';
import {
  Globe,
  Sparkles,
  Check,
  X,
  Loader2,
  Layers,
  Palette,
  ExternalLink,
} from 'lucide-react';

interface PublishPatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultTitle: string;
  thumbnailUrl?: string | null;
  beadCount?: number;
  colorCount?: number;
}

export function PublishPatternModal({
  isOpen,
  onClose,
  projectId,
  defaultTitle,
  thumbnailUrl,
  beadCount,
  colorCount,
}: PublishPatternModalProps) {
  const [title, setTitle] = useState(defaultTitle || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('geek');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Informe o título do molde.');
      return;
    }

    setIsPublishing(true);
    try {
      const res = await publishPatternToGalleryAction(projectId, {
        title,
        description,
        category,
      });
      setPublishedSlug(res.slug);
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar na galeria.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Publicar Molde na Galeria Pública
              </h3>
              <p className="text-xs text-zinc-400">
                Compartilhe sua criação com a comunidade e ganhe visibilidade.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {publishedSlug ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">Molde Publicado com Sucesso!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Sua arte agora está indexada na galeria pública e disponível para outros criadores remixarem e baixarem.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href={`/gallery/${publishedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition"
              >
                <span>Ver Molde na Galeria</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="p-5 space-y-4 text-xs overflow-y-auto">
            {/* Preview Banner */}
            <div className="flex items-center gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-12 h-12 rounded-lg object-contain bg-zinc-900 border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="font-bold text-white block truncate">{title || 'Sem título'}</span>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                  {beadCount !== undefined && <span>{beadCount.toLocaleString('pt-BR')} beads</span>}
                  {colorCount !== undefined && <span>&bull; {colorCount} cores</span>}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Título do Padrão *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Super Mario Bros Pixel Art 29x29"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="games">Games / Jogos</option>
                <option value="anime">Anime & Mangá</option>
                <option value="geek">Geek & Cultura Pop</option>
                <option value="cartoons">Desenhos & Animações</option>
                <option value="decor">Decoração & Quadros</option>
                <option value="animals">Animais & Fofos</option>
                <option value="other">Outros</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Descrição / Dicas de Montagem (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Dica: use fita térmica antes de passar o ferro para evitar que as peças se soltem..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPublishing}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                <span>Publicar na Galeria</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
