'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getCurrentUserCreatorProfileAction,
  saveCreatorProfileAction,
} from '@/app/actions/creator';
import {
  User,
  ShoppingBag,
  MessageCircle,
  AtSign,
  Globe,
  Sparkles,
  Check,
  Loader2,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react';

export default function CreatorProfileSettingsPage() {
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserCreatorProfileAction()
      .then((profile) => {
        if (profile) {
          setHandle(profile.handle || '');
          setDisplayName(profile.displayName || '');
          setBio(profile.bio || '');
          setShopUrl(profile.shopUrl || '');
          setInstagramHandle(profile.instagramHandle || '');
          setWhatsappNumber(profile.whatsappNumber || '');
          setAvatarUrl(profile.avatarUrl);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await saveCreatorProfileAction({
        handle,
        displayName,
        bio,
        shopUrl,
        instagramHandle,
        whatsappNumber,
      });

      setSuccessMessage('Perfil público atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportUserData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      service: 'BeadForge Studio',
      legalFramework: 'LGPD (Lei 13.709/2018 - Art. 18, V)',
      profile: {
        handle,
        displayName,
        bio,
        shopUrl,
        instagramHandle,
        whatsappNumber,
      },
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beadforge-dados-perfil-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccountRequest = () => {
    const subject = encodeURIComponent('Solicitação de Exclusão de Conta e Dados (LGPD Art. 18)');
    const body = encodeURIComponent(
      `Olá equipe de privacidade do BeadForge Studio,\n\nSolicito a eliminação definitiva da minha conta e de todos os dados pessoais e projetos associados, nos termos do Artigo 18, inciso VI da LGPD.\n\nPerfil: @${handle || 'usuario'}\nNome: ${displayName || 'Usuário'}`
    );
    window.location.href = `mailto:hamabeadbrasil@gmail.com?subject=${subject}&body=${body}`;
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Carregando configurações de perfil...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Perfil Público & Branding do Ateliê</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-bold border border-amber-400/25">
                White-Label
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Seus dados aparecerão na sua página pública de criador e no cabeçalho dos seus PDFs de montagem.
            </p>
          </div>
        </div>

        {handle && (
          <Link
            href={`/creator/${handle}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold rounded-xl transition"
          >
            <span>Ver Meu Perfil</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* ── Form & Preview Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-4 text-xs">
          {successMessage && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2 animate-fade-in font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2 animate-fade-in font-medium">
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Nome de Usuário (@handle) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="meuatelie"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 lowercase"
                  required
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5 block">
                Sua URL pública: app.hamabeadsbrasil.com.br/creator/{handle || 'seu_nome'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Nome do Ateliê / Exibição *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Ateliê Pixel Art"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              Biografia / Apresentação do Ateliê
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ex: Especialista em quadros decorativos e chaveiros em Pixel Art Fuse Beads. Encomendas abertas via WhatsApp..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Links de Vendas & Contato</span>
            </h3>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">
                Link da sua Loja (Shopee, Elo7 ou Mercado Livre)
              </label>
              <input
                type="url"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                placeholder="https://shopee.com.br/sualoja"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  WhatsApp para Encomendas
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="11999998888"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Instagram (@)
                </label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="ateliegeek"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>

        {/* Live Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Pré-visualização do seu Perfil Público
          </span>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-amber-400/30 mx-auto flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-zinc-500" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {displayName || 'Nome do Ateliê'}
              </h3>
              <span className="text-xs font-mono text-amber-400 font-semibold block">
                @{handle || 'handle'}
              </span>
              <p className="text-xs text-zinc-400 mt-2 line-clamp-3">
                {bio || 'Biografia do ateliê em pixel art e fuse beads...'}
              </p>
            </div>

            {/* Simulated Buttons */}
            <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs">
              {shopUrl && (
                <div className="p-2 bg-amber-400/10 text-amber-400 border border-amber-400/25 rounded-xl font-bold flex items-center justify-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Loja Online</span>
                </div>
              )}

              {whatsappNumber && (
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl font-bold flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Encomendas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Seção de Governança & Direitos do Titular (LGPD Art. 18) ── */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Privacidade & Seus Dados (LGPD)</h3>
            <p className="text-xs text-zinc-400">
              Gerencie seus dados pessoais e exerça seus direitos garantidos pela Lei nº 13.709/2018.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/privacy" target="_blank" className="hover:text-amber-400 underline transition">
              Política de Privacidade
            </Link>
            <Link href="/terms" target="_blank" className="hover:text-amber-400 underline transition">
              Termos de Uso
            </Link>
            <Link href="/cookies" target="_blank" className="hover:text-amber-400 underline transition">
              Cookies
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportUserData}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-xl font-semibold transition flex items-center gap-1.5 border border-zinc-700"
              title="Baixar cópia de dados cadastrais (Art. 18, V)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar Dados (JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteAccountRequest}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold transition flex items-center gap-1.5"
              title="Solicitar exclusão definitiva da conta e dados (Art. 18, VI)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Conta & Dados</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
