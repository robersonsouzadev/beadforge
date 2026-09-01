'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp, signIn } from '@/lib/auth-client';
import { ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result?.error) {
        // Se for o email do administrador que já existe no seed inicial, sincroniza a nova senha escolhida
        if (email.toLowerCase().trim() === 'robersonsouza@outlook.com') {
          const { syncAdminCredentialsAction } = await import('@/app/actions/auth-actions');
          await syncAdminCredentialsAction(email, password, name);
          const loginRes = await signIn.email({ email, password });
          if (!loginRes?.error) {
            router.push(redirectUrl);
            router.refresh();
            return;
          }
        }

        setErrorMessage(result.error.message || 'Falha ao criar conta.');
        setIsLoading(false);
      } else {
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      if (email.toLowerCase().trim() === 'robersonsouza@outlook.com') {
        try {
          const { syncAdminCredentialsAction } = await import('@/app/actions/auth-actions');
          await syncAdminCredentialsAction(email, password, name);
          const loginRes = await signIn.email({ email, password });
          if (!loginRes?.error) {
            router.push(redirectUrl);
            router.refresh();
            return;
          }
        } catch (_) {}
      }

      setErrorMessage(err.message || 'Ocorreu um erro ao criar a conta.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Criar sua conta
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Comece a criar seus moldes e projetos de beads hoje mesmo.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Nome Completo
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu Nome ou Nome do Ateliê"
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Senha (mínimo 6 caracteres)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition duration-150 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Criar Conta Gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/60">
        Já tem uma conta?{' '}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
          className="font-semibold text-amber-400 hover:text-amber-300 transition"
        >
          Fazer Login
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
