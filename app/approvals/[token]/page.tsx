'use client';

import React, { useState, useEffect, use } from 'react';
import {
  getPublicApprovalAction,
  respondToApprovalAction,
  type PublicApprovalDTO,
} from '@/app/actions/approvals';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
  Layers,
  Box,
  Palette,
  ShieldCheck,
} from 'lucide-react';

interface ApprovalPageProps {
  params: Promise<{ token: string }>;
}

export default function PublicApprovalPage({ params }: ApprovalPageProps) {
  const { token } = use(params);
  const [data, setData] = useState<PublicApprovalDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const loadApproval = async () => {
    setIsLoading(true);
    try {
      const res = await getPublicApprovalAction(token);
      setData(res);
    } catch (err) {
      console.error('Failed to load approval:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApproval();
  }, [token]);

  const handleApprove = async () => {
    if (!confirm('Deseja confirmar e aprovar esta arte para o início da produção?')) return;
    setIsResponding(true);
    try {
      await respondToApprovalAction(token, 'approved');
      setFeedbackSuccess('Design aprovado com sucesso! O artesão foi notificado.');
      await loadApproval();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar design.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionComment.trim()) {
      alert('Por favor, descreva quais ajustes você gostaria de fazer na arte.');
      return;
    }

    setIsResponding(true);
    try {
      await respondToApprovalAction(token, 'revision_requested', revisionComment);
      setFeedbackSuccess('Solicitação de ajuste enviada com sucesso!');
      setShowRevisionBox(false);
      await loadApproval();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar ajuste.');
    } finally {
      setIsResponding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Carregando prova visual do pedido...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1">Link de Aprovação Não Encontrado</h1>
        <p className="text-xs text-zinc-400 max-w-sm">
          Este link pode ter expirado ou foi removido pelo ateliê responsável.
        </p>
      </div>
    );
  }

  const isApproved = data.status === 'approved';
  const isRevision = data.status === 'revision_requested';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      {/* ── Public Top Bar ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur px-4 py-3.5 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950 font-bold" />
            </div>
            <span className="text-xs font-bold tracking-tight text-white">
              Bead<span className="text-amber-400">Forge</span> &bull; Prova de Aprovação
            </span>
          </div>

          <span className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700 font-medium">
            {data.sellerName}
          </span>
        </div>
      </header>

      {/* ── Main Proof Area ── */}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1 w-full">
        {/* Status Banner */}
        {feedbackSuccess ? (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs animate-fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        ) : isApproved ? (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="block font-bold">Arte Aprovada com Sucesso!</strong>
                <span className="text-[11px] text-emerald-400/80">
                  Aprovada em {data.respondedAt ? new Date(data.respondedAt).toLocaleString('pt-BR') : 'recentemente'}. O ateliê iniciará a montagem.
                </span>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400 opacity-60 shrink-0 hidden sm:block" />
          </div>
        ) : isRevision ? (
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs shadow-lg">
            <MessageSquare className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block font-bold">Ajustes Solicitados ao Ateliê</strong>
              <span className="text-[11px] text-amber-400/80">
                "{data.clientComment || 'Alteração solicitada'}" &bull; Aguarde a nova versão.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 text-zinc-300 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>Aguardando sua avaliação visual desta peça.</span>
            </div>
            <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">
              Avaliação de Design
            </span>
          </div>
        )}

        {/* Project Header */}
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {data.orderTitle}
          </h1>
          <p className="text-xs text-zinc-400">
            Criado pelo ateliê <strong className="text-zinc-200">{data.sellerName}</strong> em Fuse Beads (Pixel Art).
          </p>
        </div>

        {/* Visual Preview Canvas */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden">
          {data.thumbnailUrl ? (
            <div className="relative max-w-full max-h-[440px] flex items-center justify-center p-4 bg-zinc-950/90 rounded-2xl border border-zinc-800/80 shadow-inner">
              <img
                src={data.thumbnailUrl}
                alt={data.orderTitle}
                className="max-h-[400px] w-auto object-contain rounded-lg drop-shadow-2xl [image-rendering:pixelated]"
              />
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-600 gap-2">
              <Layers className="w-10 h-10 opacity-40 text-amber-400/50" />
              <span className="text-xs">Pré-visualização do padrão indisponível</span>
            </div>
          )}

          {/* Specs Bar */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-md text-center text-xs">
            <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block">Total de Peças</span>
              <span className="font-mono font-bold text-white">
                {data.patternSnapshot.totalBeads.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block">Cores Utilizadas</span>
              <span className="font-mono font-bold text-amber-400">
                {data.patternSnapshot.colorCount || data.patternSnapshot.colors.length} cores
              </span>
            </div>

            <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
              <span className="text-[10px] text-zinc-500 block">Dimensões</span>
              <span className="font-mono font-bold text-zinc-300">
                {data.patternSnapshot.dimensions || '29x29'}
              </span>
            </div>
          </div>
        </div>

        {/* Color Swatches Palette Breakdown */}
        {data.patternSnapshot.colors.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2 uppercase tracking-wide">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Paleta de Cores Desta Arte</span>
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {data.patternSnapshot.colors.map((c) => (
                <div
                  key={c.code}
                  className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-4 h-4 rounded-md border border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[10px] text-zinc-300 block leading-tight">
                      {c.code}
                    </span>
                    <span className="text-[9px] text-zinc-500 truncate block">
                      {c.count} pcs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Client Decision Actions ── */}
        {!isApproved && (
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Sua Decisão:
            </h3>

            {!showRevisionBox ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isResponding}
                  className="w-full sm:flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50"
                >
                  {isResponding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Aprovar Design para Produção</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRevisionBox(true)}
                  disabled={isResponding}
                  className="w-full sm:w-auto py-3.5 px-5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white font-bold rounded-xl border border-zinc-700 text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Solicitar Ajuste</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestRevision} className="space-y-3 animate-fade-in">
                <label className="block text-xs font-semibold text-zinc-300">
                  Descreva o que deseja alterar:
                </label>
                <textarea
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Ex: Gostaria de trocar o fundo para um tom azul mais claro, ou alterar a cor do chapéu..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                  required
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionBox(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isResponding}
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  >
                    {isResponding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar Ajustes ao Ateliê</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-4 px-4 text-center text-[11px] text-zinc-500">
        Gerado pelo sistema BeadForge Studio &bull; Prova Digital Segura
      </footer>
    </div>
  );
}
