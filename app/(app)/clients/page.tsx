'use client';

import React, { useState, useEffect } from 'react';
import {
  getClientsAction,
  createOrUpdateClientAction,
  deleteClientAction,
  type ClientDTO,
} from '@/app/actions/clients';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  AtSign,
  Mail,
  Edit2,
  Trash2,
  Package,
  X,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientDTO | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClientsAction();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleOpenModal = (client?: ClientDTO) => {
    if (client) {
      setClientToEdit(client);
      setName(client.name);
      setPhone(client.phone || '');
      setInstagram(client.instagram || '');
      setEmail(client.email || '');
      setNotes(client.notes || '');
    } else {
      setClientToEdit(null);
      setName('');
      setPhone('');
      setInstagram('');
      setEmail('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    setIsSaving(true);
    try {
      await createOrUpdateClientAction({
        id: clientToEdit?.id,
        name,
        phone,
        instagram,
        email,
        notes,
      });
      setIsModalOpen(false);
      await loadClients();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Deseja remover o cliente "${clientName}"?`)) return;
    try {
      await deleteClientAction(id);
      await loadClients();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cliente.');
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.instagram && c.instagram.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-8 select-none w-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Carteira de Clientes</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold border border-amber-400/25">
                CRM Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Cadastre contatos, envie mensagens diretas no WhatsApp e vincule encomendas.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, WhatsApp ou @instagram..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Total: <strong className="text-white">{filteredClients.length}</strong> clientes
        </span>
      </div>

      {/* ── Clients List / Grid ── */}
      {isLoading ? (
        <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Carregando carteira de clientes...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">
            {clients.length === 0
              ? 'Nenhum cliente cadastrado ainda'
              : 'Nenhum cliente encontrado'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {clients.length === 0
              ? 'Cadastre seus clientes para acompanhar pedidos e enviar links de aprovação de arte.'
              : 'Tente alterar os termos da busca.'}
          </p>
          {clients.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow hover:bg-amber-300 transition"
            >
              Adicionar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const rawPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : null;
            const waLink = rawPhone
              ? `https://wa.me/${rawPhone.startsWith('55') ? rawPhone : '55' + rawPhone}`
              : null;

            return (
              <div
                key={client.id}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl space-y-4 shadow-md flex flex-col justify-between transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {client.name}
                      </h3>
                      <span className="text-[11px] text-zinc-500 block">
                        Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    {client.phone && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp:</span>
                        </span>
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-emerald-400 hover:underline font-semibold"
                          >
                            {client.phone}
                          </a>
                        ) : (
                          <span className="font-mono">{client.phone}</span>
                        )}
                      </div>
                    )}

                    {client.instagram && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <AtSign className="w-3.5 h-3.5 text-pink-400" />
                          <span>Instagram:</span>
                        </span>
                        <a
                          href={`https://instagram.com/${client.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:underline font-medium"
                        >
                          @{client.instagram}
                        </a>
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-center justify-between truncate">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span>Email:</span>
                        </span>
                        <span className="text-zinc-300 truncate max-w-[140px]">{client.email}</span>
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-zinc-400 italic line-clamp-2 px-1">
                      "{client.notes}"
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>{client.totalOrdersCount || 0} encomendas</span>
                  </div>

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Conversar</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Client Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Amanda Souza"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="usuario"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Observações / Preferências
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Gosta de personagens de Pokémon, prefere peças com acabamento flat..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
