'use client';

import React, { useState, useEffect } from 'react';
import {
  getOrdersAction,
  createOrUpdateOrderAction,
  updateOrderStatusAction,
  deleteOrderAction,
  type OrderDTO,
  type OrderStatus,
} from '@/app/actions/orders';
import { getClientsAction, type ClientDTO } from '@/app/actions/clients';
import { getUserProjects } from '@/app/actions/projects';
import { createApprovalAction } from '@/app/actions/approvals';
import {
  ClipboardList,
  Plus,
  Search,
  MessageCircle,
  Share2,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  draft: {
    label: 'Rascunho',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
  },
  quoted: {
    label: 'Orçado',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
  },
  pending_approval: {
    label: 'Aguardando Prova',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  approved: {
    label: 'Aprovado pelo Cliente',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  in_production: {
    label: 'Em Produção',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  completed: {
    label: 'Pronto / Concluído',
    bg: 'bg-emerald-400/20',
    text: 'text-emerald-300',
    border: 'border-emerald-400/40',
  },
  delivered: {
    label: 'Entregue',
    bg: 'bg-zinc-700/50',
    text: 'text-zinc-300',
    border: 'border-zinc-600',
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrderDTO | null>(null);
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [channel, setChannel] = useState('direct');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Approval Share Modal
  const [approvalModalData, setApprovalModalData] = useState<{
    orderTitle: string;
    url: string;
    clientPhone?: string | null;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [oData, cData, pData] = await Promise.all([
        getOrdersAction(),
        getClientsAction(),
        getUserProjects(),
      ]);
      setOrders(oData);
      setClients(cData);
      setProjects(pData);
    } catch (err) {
      console.error('Failed to load orders data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenOrderModal = (ord?: OrderDTO) => {
    if (ord) {
      setOrderToEdit(ord);
      setTitle(ord.title);
      setSelectedClientId(ord.clientId || '');
      setSelectedProjectId(ord.projectId || '');
      setFinalPrice(ord.finalPriceBrl);
      setChannel(ord.channel || 'direct');
      setDueDate(
        ord.dueDate
          ? new Date(ord.dueDate).toISOString().split('T')[0]
          : ''
      );
      setNotes(ord.notes || '');
    } else {
      setOrderToEdit(null);
      setTitle('');
      setSelectedClientId(clients[0]?.id || '');
      setSelectedProjectId(projects[0]?.id || '');
      setFinalPrice(50.0);
      setChannel('direct');
      setDueDate('');
      setNotes('');
    }
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Informe o título do pedido.');
      return;
    }

    setIsSaving(true);
    try {
      await createOrUpdateOrderAction({
        id: orderToEdit?.id,
        title,
        clientId: selectedClientId || undefined,
        projectId: selectedProjectId || undefined,
        finalPriceBrl: finalPrice,
        channel,
        dueDate: dueDate || null,
        notes,
      });
      setIsOrderModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusAction(orderId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.');
    }
  };

  const handleDeleteOrder = async (orderId: string, orderTitle: string) => {
    if (!confirm(`Deseja excluir o pedido "${orderTitle}"?`)) return;
    try {
      await deleteOrderAction(orderId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir pedido.');
    }
  };

  const handleGenerateApproval = async (ord: OrderDTO) => {
    try {
      const res = await createApprovalAction(ord.id);
      const fullUrl = `${window.location.origin}${res.approvalUrl}`;
      setApprovalModalData({
        orderTitle: ord.title,
        url: fullUrl,
        clientPhone: ord.clientPhone,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar prova de aprovação.');
    }
  };

  const handleCopyApprovalLink = () => {
    if (!approvalModalData) return;
    navigator.clipboard.writeText(approvalModalData.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.clientName && o.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatBrl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Pipeline de Pedidos & Produção</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold border border-amber-400/25">
                Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Acompanhe encomendas, prazos de entrega e envie links de aprovação de arte pelo WhatsApp.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenOrderModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="space-y-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou nome do cliente..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <span className="text-xs font-mono text-zinc-400">
            Total: <strong className="text-white">{filteredOrders.length}</strong> pedidos
          </span>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'draft', label: 'Rascunho' },
            { id: 'pending_approval', label: 'Aguardando Prova' },
            { id: 'approved', label: 'Aprovados' },
            { id: 'in_production', label: 'Em Produção' },
            { id: 'completed', label: 'Concluídos' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st.id
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders Grid ── */}
      {isLoading ? (
        <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Carregando pedidos do ateliê...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">
            {orders.length === 0
              ? 'Nenhum pedido registrado no sistema'
              : 'Nenhum pedido encontrado com este filtro'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {orders.length === 0
              ? 'Cadastre suas encomendas para acompanhar status de produção e enviar links de aprovação de arte.'
              : 'Tente alterar os termos da busca.'}
          </p>
          {orders.length === 0 && (
            <button
              onClick={() => handleOpenOrderModal()}
              className="px-4 py-2 bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow hover:bg-amber-300 transition"
            >
              Criar Primeiro Pedido
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const stConfig = STATUS_CONFIG[ord.status] || STATUS_CONFIG.draft;
            const dueDateFormatted = ord.dueDate
              ? new Date(ord.dueDate).toLocaleDateString('pt-BR')
              : null;

            return (
              <div
                key={ord.id}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-5 rounded-2xl space-y-4 shadow-md flex flex-col justify-between transition group"
              >
                <div className="space-y-3">
                  {/* Top: Status Badge + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        handleStatusChange(ord.id, e.target.value as OrderStatus)
                      }
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${stConfig.bg} ${stConfig.text} ${stConfig.border} cursor-pointer focus:outline-none`}
                    >
                      <option value="draft">Rascunho</option>
                      <option value="quoted">Orçado</option>
                      <option value="pending_approval">Aguardando Prova</option>
                      <option value="approved">Aprovado</option>
                      <option value="in_production">Em Produção</option>
                      <option value="completed">Concluído</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenOrderModal(ord)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(ord.id, ord.title)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Order Title & Thumbnail */}
                  <div className="flex items-center gap-3">
                    {ord.projectThumbnail ? (
                      <img
                        src={ord.projectThumbnail}
                        alt={ord.title}
                        className="w-12 h-12 rounded-xl object-contain bg-zinc-950 border border-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white tracking-tight truncate" title={ord.title}>
                        {ord.title}
                      </h3>
                      {ord.projectName && (
                        <span className="text-[10px] text-zinc-400 block truncate">
                          Molde: {ord.projectName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Client & Financial Details */}
                  <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[11px]">Cliente:</span>
                      <span className="font-semibold text-zinc-200 truncate max-w-[140px]">
                        {ord.clientName || 'Cliente Avulso'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[11px]">Valor Acordado:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatBrl(ord.finalPriceBrl)}
                      </span>
                    </div>

                    {dueDateFormatted && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>Entrega:</span>
                        </span>
                        <span className="font-mono text-zinc-300 font-medium">
                          {dueDateFormatted}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  {ord.approvalToken ? (
                    <a
                      href={`/approvals/${ord.approvalToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Ver Prova Online</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Sem prova gerada</span>
                  )}

                  <button
                    onClick={() => handleGenerateApproval(ord)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-400/20 hover:from-amber-500/30 hover:to-amber-400/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enviar Prova WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Order Create/Edit Modal ── */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {orderToEdit ? 'Editar Pedido' : 'Novo Pedido de Encomenda'}
                </h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Título do Pedido *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Quadro Mário Bros 3D - 29x29"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Cliente
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Cliente Avulso (sem vínculo)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Molde de Beads Vinculado
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      const p = projects.find((proj) => proj.id === e.target.value);
                      if (p && !title) setTitle(`Pedido: ${p.name}`);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Nenhum (avulso)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Valor Final (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Canal de Venda
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="direct">WhatsApp / PIX</option>
                    <option value="shopee">Shopee</option>
                    <option value="mercadolivre">Mercado Livre</option>
                    <option value="elo7">Elo7</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Notas Internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções específicas para montagem..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
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
                  <span>Salvar Pedido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Approval Share Modal ── */}
      {approvalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Link de Aprovação Criado!
                </h3>
              </div>
              <button
                onClick={() => setApprovalModalData(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-300">
              Seu cliente poderá abrir este link no celular sem login para aprovar a arte oficial antes do início da montagem física:
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-2">
              <span className="font-mono text-amber-400 truncate text-[11px]">
                {approvalModalData.url}
              </span>
              <button
                onClick={handleCopyApprovalLink}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 shrink-0"
                title="Copiar Link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {approvalModalData.clientPhone && (
                <a
                  href={`https://wa.me/${approvalModalData.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Olá! Segue a prova visual do seu pedido "${approvalModalData.orderTitle}" em Pixel Art de Beads para aprovação:\n\n${approvalModalData.url}\n\nBasta abrir o link no celular para aprovar o design e iniciarmos a produção!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Direto no WhatsApp</span>
                </a>
              )}

              <button
                onClick={handleCopyApprovalLink}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiado com Sucesso!' : 'Copiar Link de Aprovação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
