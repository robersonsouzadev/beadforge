'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

export function NavbarAuth() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
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
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02]"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Meu Painel</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
  );
}
