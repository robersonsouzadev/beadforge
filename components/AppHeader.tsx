'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import {
  Sparkles,
  LayoutGrid,
  Box,
  FolderKanban,
  CreditCard,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  isPro: boolean;
}

export function AppHeader({ user, isPro }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/dashboard', label: 'Meus Projetos', icon: FolderKanban },
    { href: '/editor', label: 'Editor 2D', icon: LayoutGrid },
    { href: '/ultra', label: 'Ultra 3D', icon: Box, requiresPro: true },
  ];

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between z-40 shrink-0">
      {/* Brand & Nav */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4 text-zinc-950 font-bold" />
          </div>
          <span className="text-base font-black tracking-tight text-white hidden sm:inline">
            Bead<span className="text-amber-400">Forge</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.requiresPro && !isPro && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}

          {user.email?.toLowerCase().includes('robersonsouza@outlook.com') && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                pathname.startsWith('/admin')
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Right side: Upgrade CTA + Profile */}
      <div className="flex items-center gap-3">
        {!isPro ? (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-lg shadow-md shadow-amber-500/20 transition transform hover:scale-105"
          >
            <Zap className="w-3.5 h-3.5 fill-zinc-950" />
            <span className="hidden sm:inline">Assinar</span> PRO
          </Link>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Membro PRO</span>
          </div>
        )}

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 transition focus:outline-none"
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-zinc-700"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="text-xs font-medium text-zinc-200 hidden md:inline max-w-[120px] truncate">
              {user.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs font-medium">
              <div className="px-3.5 py-2 border-b border-zinc-800/80">
                <p className="text-white font-semibold truncate">{user.name}</p>
                <p className="text-zinc-400 text-[11px] truncate">{user.email}</p>
              </div>

              <Link
                href="/dashboard/settings/billing"
                onClick={() => setShowUserMenu(false)}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Assinatura & Faturamento</span>
              </Link>

              {user.email?.toLowerCase().includes('robersonsouza@outlook.com') && (
                <Link
                  href="/admin"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 font-semibold transition"
                >
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Painel do Administrador</span>
                </Link>
              )}

              <div className="border-t border-zinc-800/80 my-1" />

              <button
                onClick={handleLogout}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
