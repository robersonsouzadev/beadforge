'use client';

import React, { useState, useTransition } from 'react';
import {
  Search,
  Zap,
  Gift,
  FolderOpen,
  Calendar,
  UserPlus,
  Edit2,
  Power,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Crown,
  Coins,
  Sparkles,
} from 'lucide-react';
import {
  AdminUserItem,
  toggleAdminUserStatusAction,
  deleteAdminUserAction,
} from '@/app/actions/admin';
import { AdminUserModal } from '@/components/AdminUserModal';
import { AdminUserCreditsModal } from '@/components/admin/AdminUserCreditsModal';
import { useRouter } from 'next/navigation';

export function AdminUsersTable({ users }: { users: AdminUserItem[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'studio' | 'pro' | 'free' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUserItem | null>(null);
  const [userForCredits, setUserForCredits] = useState<AdminUserItem | null>(null);

  // Transition for quick actions
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: AdminUserItem) => {
    setUserToEdit(u);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (u: AdminUserItem) => {
    const isCurrentlyActive = u.subscriptionStatus === 'active' || u.isPro;
    const targetStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionText = isCurrentlyActive ? 'inativar a assinatura' : 'ativar a assinatura';

    if (confirm(`Deseja realmente ${actionText} do usuário ${u.name} (${u.email})?`)) {
      setPendingUserId(u.id);
      startTransition(async () => {
        try {
          await toggleAdminUserStatusAction(u.id, targetStatus);
          router.refresh();
        } catch (err: any) {
          alert(err.message || 'Erro ao alterar status.');
        } finally {
          setPendingUserId(null);
        }
      });
    }
  };

  const handleDeleteUser = (u: AdminUserItem) => {
    if (confirm(`⚠️ ATENÇÃO: Deseja realmente excluir permanentemente a conta de ${u.name} (${u.email}) e todos os seus projetos? Esta ação não pode ser desfeita.`)) {
      setPendingUserId(u.id);
      startTransition(async () => {
        try {
          await deleteAdminUserAction(u.id);
          router.refresh();
        } catch (err: any) {
          alert(err.message || 'Erro ao excluir usuário.');
        } finally {
          setPendingUserId(null);
        }
      });
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'studio') return u.planId === 'studio';
    if (filterType === 'pro') return u.planId === 'pro';
    if (filterType === 'free') return u.planId === 'free' && u.subscriptionStatus !== 'inactive';
    if (filterType === 'inactive') return u.subscriptionStatus === 'inactive';
    return true;
  });

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6 select-none">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Usuários Cadastrados ({filtered.length})</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Gerencie permissões, atribua planos Studio, Creator ou Gratuitos e inative contas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="pl-9 pr-3.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 w-48 sm:w-56"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({users.length})
              </button>

              <button
                onClick={() => setFilterType('studio')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  filterType === 'studio'
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Crown className="w-3 h-3 fill-current" />
                Studio ({users.filter((u) => u.planId === 'studio').length})
              </button>

              <button
                onClick={() => setFilterType('pro')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  filterType === 'pro'
                    ? 'bg-sky-400 text-zinc-950 font-bold shadow'
                    : 'text-sky-400 hover:text-sky-300'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                Creator ({users.filter((u) => u.planId === 'pro').length})
              </button>

              <button
                onClick={() => setFilterType('free')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'free'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Free ({users.filter((u) => u.planId === 'free' && u.subscriptionStatus !== 'inactive').length})
              </button>

              <button
                onClick={() => setFilterType('inactive')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterType === 'inactive'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Inativos ({users.filter((u) => u.subscriptionStatus === 'inactive').length})
              </button>
            </div>

            {/* Add User CTA */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Usuário</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4 text-center">Créditos IA</th>
                <th className="py-3 px-4 text-center">Projetos</th>
                <th className="py-3 px-4">Data Cadastro</th>
                <th className="py-3 px-4">Status / Validade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    Nenhum usuário encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isRowPending = isPending && pendingUserId === u.id;
                  const isInactive = u.subscriptionStatus === 'inactive';
                  const isLifetime = u.currentPeriodEnd && new Date(u.currentPeriodEnd).getFullYear() >= 2090;

                  return (
                    <tr key={u.id} className="hover:bg-zinc-850/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="text-white font-bold block">{u.name || 'Sem nome'}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] text-rose-400 font-semibold font-mono">ADMIN</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="py-3 px-4">
                        {isInactive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[10px] uppercase tracking-wider">
                            INATIVO
                          </span>
                        ) : u.planId === 'studio' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-[10px] uppercase tracking-wider">
                            <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                            STUDIO
                          </span>
                        ) : u.planId === 'pro' || u.isPro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold text-[10px] uppercase tracking-wider">
                            <Zap className="w-3 h-3 fill-sky-400 text-sky-400" />
                            CREATOR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-semibold">
                            <Gift className="w-3 h-3" />
                            GRATUITO
                          </span>
                        )}
                      </td>

                      {/* Créditos IA 3D */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setUserForCredits(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-mono text-[11px] font-bold transition group"
                          title="Clique para ajustar créditos"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                          <span>{u.aiCredits}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px]">
                          <FolderOpen className="w-3 h-3 text-zinc-500" />
                          {u.projectCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3 px-4">
                        {isInactive ? (
                          <span className="text-rose-400/90 text-[11px] flex items-center gap-1 font-semibold">
                            <Power className="w-3 h-3" />
                            Suspenso / Inativo
                          </span>
                        ) : u.isPro ? (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {isLifetime
                                ? 'Vitalício (Sem expiração)'
                                : u.currentPeriodEnd
                                ? `Até ${new Date(u.currentPeriodEnd).toLocaleDateString('pt-BR')}`
                                : 'Ativo'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">
                            Sem assinatura
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            disabled={isRowPending}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition"
                            title="Editar Dados e Plano"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Botão Inativar / Ativar */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isRowPending}
                            className={`p-1.5 rounded-lg border transition ${
                              isInactive
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                            title={isInactive ? 'Reativar Plano Pro' : 'Inativar Assinatura'}
                          >
                            {isRowPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Botão Excluir (apenas para não administradores) */}
                          {u.email !== 'robersonsouza@outlook.com' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={isRowPending}
                              className="p-1.5 bg-zinc-850 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-lg border border-zinc-800 hover:border-rose-500/30 transition"
                              title="Excluir Conta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Adicionar / Editar */}
      <AdminUserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />

      {/* Modal de Gestão de Créditos de IA */}
      <AdminUserCreditsModal
        isOpen={Boolean(userForCredits)}
        onClose={() => setUserForCredits(null)}
        user={userForCredits}
      />
    </>
  );
}
