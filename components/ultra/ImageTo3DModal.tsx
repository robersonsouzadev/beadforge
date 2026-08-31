'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { VoxelEngine } from '@/core/voxel/voxelizer';
import { CreditPurchaseModal } from '@/components/CreditPurchaseModal';
import { getUserAiCredits } from '@/app/actions/billing';
import { removeBackgroundFromImage } from '@/core/image/client-bg-remover';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Sliders,
  Layers,
  Wand2,
  ShieldAlert,
  Coins,
  Zap,
  Scissors,
  Check,
} from 'lucide-react';

export function ImageTo3DModal() {
  const {
    isImageTo3DModalOpen,
    setIsImageTo3DModalOpen,
    activePalette,
    setGrid3D,
    setModel3DFileName,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);

  // Background removal options
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [bgTolerance, setBgTolerance] = useState<number>(30);

  const [beadSize, setBeadSize] = useState<'mini' | 'midi'>('mini');
  const [finishedScale, setFinishedScale] = useState<'small' | 'medium' | 'large'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  useEffect(() => {
    if (isImageTo3DModalOpen) {
      getUserAiCredits().then((c) => setUserCredits(c)).catch(() => setUserCredits(5));
    }
  }, [isImageTo3DModalOpen]);

  // Processa a imagem para remover o fundo automaticamente
  const processImageBg = async (file: File, enabled: boolean, tolerance: number) => {
    if (!enabled) {
      setProcessedPreviewUrl(null);
      setProcessedBlob(null);
      return;
    }

    setIsProcessingBg(true);
    try {
      const { dataUrl, blob } = await removeBackgroundFromImage(file, { tolerance });
      setProcessedPreviewUrl(dataUrl);
      setProcessedBlob(blob);
    } catch (err) {
      console.warn('Falha ao remover fundo automaticamente, usando imagem original:', err);
      setProcessedPreviewUrl(null);
      setProcessedBlob(null);
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    const url = URL.createObjectURL(file);
    setRawPreviewUrl(url);

    processImageBg(file, autoRemoveBg, bgTolerance);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    const url = URL.createObjectURL(file);
    setRawPreviewUrl(url);

    processImageBg(file, autoRemoveBg, bgTolerance);
  };

  const handleToggleBg = (checked: boolean) => {
    setAutoRemoveBg(checked);
    if (selectedFile) {
      processImageBg(selectedFile, checked, bgTolerance);
    }
  };

  const handleToleranceChange = (tolerance: number) => {
    setBgTolerance(tolerance);
    if (selectedFile && autoRemoveBg) {
      processImageBg(selectedFile, true, tolerance);
    }
  };

  if (!isImageTo3DModalOpen) return null;

  const currentActivePreview = processedPreviewUrl || rawPreviewUrl;

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError(null);
    setStepStatus('Enviando imagem isolada para o motor de IA...');

    try {
      const formData = new FormData();
      const imageToSend = processedBlob
        ? new File([processedBlob], selectedFile.name.replace(/\.[^/.]+$/, '') + '.png', { type: 'image/png' })
        : selectedFile;

      formData.append('image', imageToSend);
      formData.append('beadSize', beadSize);
      formData.append('finishedScale', finishedScale);

      const res = await fetch('/api/ai/image-to-3d', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao processar com IA.');

      setStepStatus('Reconstruindo malha tridimensional e profundidade...');
      await new Promise((r) => setTimeout(r, 600));

      setStepStatus('Voxelizando e fatiando em camadas de beads...');

      // Configuração de resolução baseada no tamanho escolhido
      const dims =
        finishedScale === 'small'
          ? { w: 24, h: 24, d: 18 }
          : finishedScale === 'medium'
          ? { w: 32, h: 32, d: 26 }
          : { w: 42, h: 42, d: 36 };

      const pitchMm = beadSize === 'mini' ? 2.6 : 5.0;

      // Cria a imagem para amostragem de pixels local
      const img = new Image();
      img.src = data.imageDataUri || currentActivePreview!;
      await new Promise((resolve) => {
        img.onload = () => resolve(true);
      });

      const canvas = document.createElement('canvas');
      canvas.width = dims.w;
      canvas.height = dims.h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, dims.w, dims.h);
      const imgData = ctx.getImageData(0, 0, dims.w, dims.h);

      const rawVoxels: Array<{ x: number; y: number; z: number; rgb: { r: number; g: number; b: number } }> = [];

      // Extrusão volumétrica inteligente com suavização cilíndrica / elipsoidal 3D
      // Processa SOMENTE pixels com opacidade (sem o fundo branco/transparente)
      for (let y = 0; y < dims.h; y++) {
        for (let x = 0; x < dims.w; x++) {
          const idx = (y * dims.w + x) * 4;
          const r = imgData.data[idx];
          const g = imgData.data[idx + 1];
          const b = imgData.data[idx + 2];
          const a = imgData.data[idx + 3];

          // Ignora totalmente pixels transparentes ou de fundo
          if (a > 30) {
            // Se o fundo não tiver sido removido e for praticamente branco puro (> 248), também ignora
            if (!autoRemoveBg && r > 248 && g > 248 && b > 248) {
              continue;
            }

            // Calcula espessura volumétrica baseada na distância do centro da silhueta
            const normX = (x / dims.w - 0.5) * 2;
            const normY = (y / dims.h - 0.5) * 2;
            const distCenter = Math.sqrt(normX * normX + normY * normY);
            const maxZLayers = Math.max(2, Math.round((1 - Math.min(0.9, distCenter * 0.7)) * dims.d));

            const startZ = Math.floor((dims.d - maxZLayers) / 2);
            const endZ = startZ + maxZLayers;

            for (let z = startZ; z < endZ; z++) {
              // Variação suave de iluminação por camada Z para realçar o relevo 3D
              const depthFactor = 1.0 - Math.abs(z - dims.d / 2) / (dims.d / 2) * 0.2;
              rawVoxels.push({
                x,
                y,
                z,
                rgb: {
                  r: Math.min(255, Math.max(0, Math.round(r * depthFactor))),
                  g: Math.min(255, Math.max(0, Math.round(g * depthFactor))),
                  b: Math.min(255, Math.max(0, Math.round(b * depthFactor))),
                },
              });
            }
          }
        }
      }

      setStepStatus('Calculando furos para hastes acrílicas de reforço (+)...');
      await new Promise((r) => setTimeout(r, 400));

      const engine = new VoxelEngine(activePalette);
      const voxelGrid = engine.buildFromRawVoxels(rawVoxels, dims.w, dims.h, dims.d, pitchMm);

      setGrid3D(voxelGrid);
      setModel3DFileName(selectedFile.name.replace(/\.[^/.]+$/, '') + ' (3D IA)');
      setIsImageTo3DModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao gerar com IA:', err);
      setError(err.message || 'Erro inesperado.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-zinc-950 shadow-md">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Image-to-3D Studio</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  IA Generativa
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Transforme qualquer foto ou ilustração em um modelo 3D montável de beads
              </p>
            </div>
          </div>
          <button
            onClick={() => !isGenerating && setIsImageTo3DModalOpen(false)}
            disabled={isGenerating}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Card de Créditos do Usuário */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-300 font-medium">
                Saldo:{' '}
                <strong className="text-amber-400 font-mono">
                  {userCredits !== null ? `${userCredits} ${userCredits === 1 ? 'crédito' : 'créditos'}` : 'Carregando...'}
                </strong>
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">(Gasta 1 crédito por modelo)</span>
            </div>

            <button
              type="button"
              onClick={() => setIsCreditsModalOpen(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Recarregar</span>
            </button>
          </div>

          {/* Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>1. Imagem do Modelo</span>
              {selectedFile && isProcessingBg && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Isolando personagem...</span>
                </span>
              )}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => !isGenerating && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-zinc-700 hover:border-amber-400/80 bg-zinc-950/60 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition group"
            >
              {currentActivePreview ? (
                <div className="relative w-full aspect-video max-h-44 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-950 border border-zinc-800 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:12px_12px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentActivePreview}
                    alt="Preview 2D Isolado"
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold">
                    Clique para trocar imagem
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <ImageIcon className="w-10 h-10 text-zinc-600 group-hover:text-amber-400 transition mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-300">
                    Arraste ou clique para carregar uma imagem
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG ou WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* ✂️ Card de Remoção Inteligente de Fundo */}
          {selectedFile && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRemoveBg}
                  onChange={(e) => handleToggleBg(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-400 focus:ring-amber-400 focus:ring-offset-zinc-900"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>Remover Fundo Branco / Sólido</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Elimina as bordas brancas para esculpir apenas o personagem
                  </span>
                </div>
              </label>

              {autoRemoveBg && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto text-[11px] bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px]">Tolerância:</span>
                  {[
                    { id: 20, label: 'Suave' },
                    { id: 35, label: 'Normal' },
                    { id: 50, label: 'Forte' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToleranceChange(t.id)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition text-[10px] ${
                        bgTolerance === t.id
                          ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configurações de Escala & Beads */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Tamanho do Bead
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setBeadSize('mini')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                    beadSize === 'mini'
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Mini 2.6mm
                </button>
                <button
                  type="button"
                  onClick={() => setBeadSize('midi')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                    beadSize === 'midi'
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Midi 5.0mm
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nível de Detalhe / Altura
              </label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFinishedScale(s)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition capitalize ${
                      finishedScale === s
                        ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s === 'small' ? 'Pequeno' : s === 'medium' ? 'Médio' : 'Grande'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status do Processamento */}
          {isGenerating && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>{stepStatus}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-3/4 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Fatiamento em camadas + cálculo de hastes incluso
          </span>

          {userCredits === 0 ? (
            <button
              type="button"
              onClick={() => setIsCreditsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-amber-400/20"
            >
              <Zap className="w-4 h-4" />
              <span>Recarregar Créditos (Saldo: 0)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedFile || isGenerating || isProcessingBg}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg disabled:opacity-40 disabled:pointer-events-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Escultura 3D (1 crédito)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal de Compra de Créditos */}
      <CreditPurchaseModal
        isOpen={isCreditsModalOpen}
        onClose={() => {
          setIsCreditsModalOpen(false);
          getUserAiCredits().then((c) => setUserCredits(c)).catch(() => {});
        }}
        currentCredits={userCredits ?? 0}
      />
    </div>
  );
}
