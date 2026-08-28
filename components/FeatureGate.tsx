import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';

interface FeatureGateProps {
  isPro?: boolean;
  featureName: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'inline' | 'card' | 'modal' | 'badge';
}

export function FeatureGate({
  isPro = false,
  featureName,
  description,
  children,
  variant = 'card',
}: FeatureGateProps) {
  if (isPro) {
    return <>{children}</>;
  }

  if (variant === 'badge') {
    return (
      <div className="relative group">
        <div className="opacity-50 pointer-events-none filter blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-full shadow-lg shadow-amber-500/30 transition transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recurso Pro</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-zinc-900/60 to-zinc-950 p-6 text-center shadow-xl backdrop-blur-md">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
        <Lock className="h-6 w-6" />
      </div>
      <h4 className="text-base font-bold text-white tracking-tight">
        {featureName} é exclusivo do Plano Pro
      </h4>
      <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
        {description ||
          'Faça o upgrade para desbloquear exportação avançada em alta resolução, fatiamento 3D e projetos ilimitados.'}
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-300 transition duration-150 transform hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          Ver Planos & Upgrade
        </Link>
      </div>
    </div>
  );
}
