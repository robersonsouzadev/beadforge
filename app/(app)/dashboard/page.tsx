import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { getUserProjects } from '@/app/actions/projects';
import {
  LayoutGrid,
  Box,
  Plus,
  Sparkles,
  Zap,
  Clock,
  Trash2,
  FolderOpen,
  Boxes,
  ClipboardList,
  Users,
  Globe,
} from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const sub = await getUserSubscription(session.user.id);
  const projects = await getUserProjects();

  const maxProjects = sub.plan.limits.maxProjects;
  const projectCount = projects.length;
  const isLimitReached = !sub.isPro && projectCount >= maxProjects;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-8 w-full">
      {/* ── Welcome Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Olá, {session?.user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Seja bem-vindo ao seu estúdio de criação de moldes para Fuse Beads.
          </p>
        </div>

        {/* Plan status & Quick Upgrade */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800 text-xs">
            <span className="text-zinc-500 block">Seu Plano Atual:</span>
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              {sub.isPro ? 'BeadForge Pro ⚡' : 'Gratuito'}
            </span>
          </div>

          {!sub.isPro && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-zinc-950" />
              <span>Fazer Upgrade</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Project Creation Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Create 2D */}
        <Link
          href="/editor"
          className="group p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-850 transition duration-200 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                Criar Molde 2D
              </h3>
              <Plus className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Converta fotos, pixel arts e ilustrações em matrizes de beads com calibração de cor CIEDE2000.
            </p>
          </div>
        </Link>

        {/* Create 3D */}
        <Link
          href="/ultra"
          className="group p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-850 transition duration-200 flex items-start gap-4 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                Criar Escultura Ultra 3D
              </h3>
              {!sub.isPro && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Importe modelos .VOX, .STL ou .3MF e fatie em camadas montáveis de beads.
            </p>
          </div>
        </Link>
      </div>

      {/* ── Business Studio Modules Quick Access ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Link
          href="/inventory"
          className="bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 p-3.5 rounded-2xl flex flex-col justify-between space-y-2 hover:bg-zinc-850 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block group-hover:text-amber-400 transition">Estoque de Beads</span>
            <span className="text-[10px] text-zinc-400">Controle gavetas & cores</span>
          </div>
        </Link>

        <Link
          href="/orders"
          className="bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 p-3.5 rounded-2xl flex flex-col justify-between space-y-2 hover:bg-zinc-850 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block group-hover:text-emerald-400 transition">Pedidos & Provas</span>
            <span className="text-[10px] text-zinc-400">Status & links WhatsApp</span>
          </div>
        </Link>

        <Link
          href="/clients"
          className="bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 p-3.5 rounded-2xl flex flex-col justify-between space-y-2 hover:bg-zinc-850 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-105 transition">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block group-hover:text-sky-400 transition">Clientes</span>
            <span className="text-[10px] text-zinc-400">Contatos & histórico</span>
          </div>
        </Link>

        <Link
          href="/gallery"
          className="bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 p-3.5 rounded-2xl flex flex-col justify-between space-y-2 hover:bg-zinc-850 transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-105 transition">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block group-hover:text-pink-400 transition">Galeria Pública</span>
            <span className="text-[10px] text-zinc-400">Moldes & comunidade</span>
          </div>
        </Link>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-400" />
              <span>Meus Projetos</span>
            </h2>
            <p className="text-xs text-zinc-400">
              {sub.isPro
                ? `${projectCount} projetos salvos (Ilimitado)`
                : `${projectCount} de ${maxProjects} projetos utilizados no Plano Gratuito`}
            </p>
          </div>

          {!sub.isPro && (
            <div className="w-full sm:w-48 bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isLimitReached ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (projectCount / maxProjects) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-300">
              Nenhum projeto salvo ainda
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Comece criando seu primeiro molde 2D ou escultura 3D para salvar seus designs na nuvem.
            </p>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow-md hover:bg-amber-300 transition"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Molde
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((p: any) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
