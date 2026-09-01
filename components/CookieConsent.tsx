'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Check, X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('beadforge_cookie_consent');
      if (!consent) {
        // Mostra após 1.5s para não colidir com o carregamento inicial
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignora erro de localStorage desabilitado
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('beadforge_cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem('beadforge_cookie_consent', 'essential');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up select-none">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs sm:text-sm">Privacidade & Cookies</h4>
          </div>

          <button
            type="button"
            onClick={handleAcceptEssential}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Utilizamos cookies essenciais para salvar seus projetos e links de afiliados parceiros (Shopee / Mercado Livre) para você comprar seus materiais com segurança e sem custo extra.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Link
            href="/legal"
            className="text-[11px] text-zinc-400 hover:text-amber-400 underline transition"
          >
            Termos & LGPD
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold rounded-xl transition"
            >
              Essenciais
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aceitar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
