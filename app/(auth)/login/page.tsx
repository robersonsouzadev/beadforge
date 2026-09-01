'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { LogIn, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Carrega email lembrado do localStorage para conveniência
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('beadforge_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
      const savedRemember = localStorage.getItem('beadforge_remember_me');
      if (savedRemember !== null) {
        setRememberMe(savedRemember === 'true');
      }
    } catch (_) {}
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Salva preferência de "Permanecer Conectado"
      try {
        if (rememberMe) {
          localStorage.setItem('beadforge_remembered_email', email.trim());
          localStorage.setItem('beadforge_remember_me', 'true');
        } else {
          localStorage.removeItem('beadforge_remembered_email');
          localStorage.setItem('beadforge_remember_me', 'false');
        }
      } catch (_) {}

      let result = await signIn.email({
        email: email.trim(),
        password,
        rememberMe,
      });

      if (result?.error && email.toLowerCase().trim() === 'robersonsouza@outlook.com') {
        try {
          const { syncAdminCredentialsAction } = await import('@/app/actions/auth-actions');
          await syncAdminCredentialsAction(email, password);
          result = await signIn.email({ email: email.trim(), password, rememberMe });
        } catch (_) {}
      }

      if (result?.error) {
        setErrorMessage(result.error.message || 'Falha ao entrar. Verifique seu email e senha.');
        setIsLoading(false);
      } else {
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      if (email.toLowerCase().trim() === 'robersonsouza@outlook.com') {
        try {
          const { syncAdminCredentialsAction } = await import('@/app/actions/auth-actions');
          await syncAdminCredentialsAction(email, password);
          const loginRes = await signIn.email({ email: email.trim(), password, rememberMe });
          if (!loginRes?.error) {
            router.push(redirectUrl);
            router.refresh();
            return;
          }
        } catch (_) {}
      }

      setErrorMessage(err.message || 'Ocorreu um erro inesperado ao realizar login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Acessar sua conta
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Bem-vindo de volta! Entre para continuar seus projetos.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email & Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
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
            Senha
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

        {/* Checkbox: Permanecer Conectado */}
        <div className="flex items-center justify-between pt-1">
          <label
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer group select-none hover:text-white transition"
          >
            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
              rememberMe
                ? 'bg-amber-400 border-amber-400 text-zinc-950 shadow-sm shadow-amber-400/20'
                : 'bg-zinc-950 border-zinc-700 text-transparent group-hover:border-zinc-500'
            }`}>
              <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="font-medium">Permanecer conectado</span>
          </label>

          <span className="text-[11px] text-zinc-500">
            Sessão de 90 dias
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition duration-150 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/60">
        Não possui uma conta?{' '}
        <Link
          href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
          className="font-semibold text-amber-400 hover:text-amber-300 transition"
        >
          Criar conta gratuitamente
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
