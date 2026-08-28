import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-amber-400/30 selection:text-amber-200">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-200">
              <Sparkles className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Bead<span className="text-amber-400">Forge</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-400 mt-2 font-medium tracking-wide uppercase">
            Studio Profissional de Fuse Beads
          </p>
        </div>

        {/* Content Container */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          &copy; {new Date().getFullYear()} BeadForge Studio &bull; Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
