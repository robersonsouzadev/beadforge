import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-400/30 selection:text-amber-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-200">
              <Sparkles className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Bead<span className="text-amber-400">Forge</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="/gallery" className="hover:text-white transition text-amber-400 font-semibold flex items-center gap-1">
              <span>Galeria de Moldes</span>
            </Link>
            <Link href="/#features" className="hover:text-white transition">
              Recursos
            </Link>
            <Link href="/#3d" className="hover:text-white transition">
              Ultra 3D
            </Link>
            <Link href="/pricing" className="hover:text-white transition">
              Planos & Preços
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="px-3 py-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02]"
            >
              <span>Começar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-zinc-950" />
              </div>
              <span className="text-sm font-bold text-white">
                BeadForge Studio
              </span>
            </div>
            <p className="text-xs text-zinc-400 text-center sm:text-right">
              &copy; {new Date().getFullYear()} BeadForge Studio &bull; O sistema de produção para arte em Beads.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-6">
            <p className="text-[11px] text-zinc-600 text-center leading-relaxed max-w-4xl mx-auto">
              <strong>Aviso Legal de Compatibilidade:</strong> BeadForge Studio é uma ferramenta independente. &quot;Hama&quot;, &quot;Perler&quot;, &quot;Artkal&quot;, &quot;Pindoo&quot; e &quot;Nabbi&quot; são marcas registradas de seus respectivos proprietários, citadas neste aplicativo exclusivamente para fins de compatibilidade, mapeamento de paletas e indicação de insumos. BeadForge não possui afiliação oficial com estas marcas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
