'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { useEditorStore } from '@/store/editor-store';
import { saveProjectAction } from '@/app/actions/projects';
import { createProjectThumbnail } from '@/lib/thumbnail';
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
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Save,
  Loader2,
  CheckCircle2,
  Layers,
  Boxes,
} from 'lucide-react';

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    isGuest?: boolean;
  };
  isPro: boolean;
}

export function AppHeader({ user, isPro }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const {
    currentProjectId,
    setCurrentProjectId,
    projectName,
    setProjectName,
    grid,
    summary,
    paletteId,
    multiBoardConfig,
    selectedPegboardTemplateId,
    boardsHorizontal,
    boardsVertical,
    ditherMode,
    contrast,
    saturation,
    brightness,
    systemMode,
    grid3D,
    activeLayerZ,
    imageBase64,
    imagePreviewUrl,
  } = useEditorStore();

  const isEditorRoute = pathname === '/editor' || pathname === '/ultra';

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSave = () => {
    if (user.isGuest) {
      router.push('/register?redirect=/editor');
      return;
    }

    if (systemMode === 'ultra' && !grid3D) return;
    if (systemMode === '2d' && !grid) return;

    startSave(async () => {
      try {
        const mode = systemMode === 'ultra' ? 'ultra' : '2d';

        // 1. Generate thumbnail (prefers original uploaded image, falls back to bead grid)
        const thumbnail = await createProjectThumbnail({
          originalImage: imageBase64 || imagePreviewUrl,
          grid,
          grid3D,
          activeLayerZ,
        });

        // 2. Build full project data payload
        const projectData =
          systemMode === 'ultra'
            ? {
                grid3D,
                paletteId,
                originalImage: imageBase64 || imagePreviewUrl,
              }
            : {
                grid,
                paletteId,
                originalImage: imageBase64 || imagePreviewUrl,
                selectedPegboardTemplateId,
                boardsHorizontal,
                boardsVertical,
                ditherMode,
                contrast,
                saturation,
                brightness,
              };

        const res = await saveProjectAction({
          id: currentProjectId || undefined,
          name: projectName,
          mode,
          projectData,
          thumbnail,
        });

        if (res.id) {
          setCurrentProjectId(res.id);
          // Sync URL if this was a new project without id in URL
          if (!currentProjectId && typeof window !== 'undefined') {
            const nextUrl = `/${mode === 'ultra' ? 'ultra' : 'editor'}?project=${res.id}`;
            window.history.replaceState(null, '', nextUrl);
          }
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err: any) {
        alert(err.message || 'Erro ao salvar projeto.');
        setSaveStatus('error');
      }
    });
  };

  const handleExportPdf = async () => {
    if (systemMode === 'ultra' && !grid3D) {
      alert('Voxelize ou crie um modelo 3D antes de exportar.');
      return;
    }
    if (systemMode === '2d' && !grid) {
      alert('Gere uma prancha de beads antes de exportar o PDF.');
      return;
    }

    setIsExportingPdf(true);
    try {
      if (systemMode === 'ultra' && grid3D) {
        const targetGrid = grid3D.layers[activeLayerZ]?.grid || grid;
        if (!targetGrid) throw new Error('Camada 3D não encontrada.');

        const payload = {
          projectName: `${projectName} - Camada ${activeLayerZ + 1}`,
          title: `${projectName} - Camada ${activeLayerZ + 1}`,
          grid: targetGrid,
          summary,
          paletteId,
          metadata: {
            scaleMode: 'fit',
            pegboardConfig: `Ultra 3D - Camada ${activeLayerZ + 1} de ${grid3D.layers.length} (${grid3D.layers[activeLayerZ]?.heightMm}mm)`,
            physicalSizeCm: `${(grid3D.width * 0.26).toFixed(1)} x ${(grid3D.height * 0.26).toFixed(1)} cm`,
          },
        };

        const res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao gerar arquivo PDF da camada.');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_camada_${activeLayerZ + 1}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (grid) {
        const payload = {
          projectName,
          title: projectName,
          grid,
          summary,
          paletteId,
          metadata: {
            scaleMode: 'fit',
            pegboardConfig: `${multiBoardConfig.template.name} (${multiBoardConfig.boardsHorizontal}x${multiBoardConfig.boardsVertical} placas)`,
            physicalSizeCm: `${multiBoardConfig.totalWidthCm} x ${multiBoardConfig.totalHeightCm} cm`,
          },
        };

        const res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao gerar arquivo PDF.');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_molde.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar PDF.');
    } finally {
      setIsExportingPdf(false);
      setShowExportMenu(false);
    }
  };

  const handleExportPng = () => {
    const activeTargetGrid =
      systemMode === 'ultra' && grid3D ? grid3D.layers[activeLayerZ]?.grid : grid;

    if (!activeTargetGrid) {
      alert('Nenhum molde de beads carregado para exportar imagem.');
      return;
    }

    try {
      const cellSize = 32;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = activeTargetGrid.width * cellSize;
      offCanvas.height = activeTargetGrid.height * cellSize;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível inicializar contexto 2D.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

      for (let r = 0; r < activeTargetGrid.height; r++) {
        for (let c = 0; c < activeTargetGrid.width; c++) {
          const cell = activeTargetGrid.cells[r][c];
          const x = c * cellSize;
          const y = r * cellSize;

          if (cell.isEmpty) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            ctx.fillStyle = cell.hex;
            ctx.fillRect(x, y, cellSize, cellSize);

            ctx.fillStyle = cell.textColor || '#000000';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.beadCode, x + cellSize / 2, y + cellSize / 2);
          }

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      offCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const suffix = systemMode === 'ultra' ? `_camada_${activeLayerZ + 1}` : '';
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}${suffix}_hd.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      });
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar imagem PNG.');
    } finally {
      setShowExportMenu(false);
    }
  };

  const handleExportCsv = () => {
    if (!summary || summary.length === 0) {
      alert('Nenhum resumo de beads disponível para exportar.');
      return;
    }

    try {
      const header = 'Código,Nome da Cor,Hexadecimal,Quantidade de Beads,Pacotes Sugeridos (1000un)\n';
      const rows = summary
        .map((item) => {
          const packs = Math.ceil(item.count / 1000);
          return `"${item.code}","${item.name}","${item.hex}",${item.count},${packs}`;
        })
        .join('\n');

      const csvContent = '\uFEFF' + header + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_lista_materiais.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar CSV.');
    } finally {
      setShowExportMenu(false);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Meus Projetos', icon: FolderKanban },
    { href: '/editor', label: 'Editor 2D', icon: LayoutGrid },
    { href: '/inventory', label: 'Estoque', icon: Boxes },
    { href: '/ultra', label: 'Ultra 3D', icon: Box, requiresPro: true },
  ];

  return (
    <header className="h-12 bg-zinc-900/95 border-b border-zinc-800 px-3 sm:px-4 flex items-center justify-between z-40 shrink-0 select-none backdrop-blur">
      {/* Brand & Nav */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
            <Sparkles className="w-3.5 h-3.5 text-zinc-950 font-bold" />
          </div>
          <span className="text-sm font-black tracking-tight text-white hidden md:inline">
            Bead<span className="text-amber-400">Forge</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}

          {user.email?.toLowerCase().includes('robersonsouza@outlook.com') && (
            <Link
              href="/admin"
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                pathname.startsWith('/admin')
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Admin</span>
            </Link>
          )}
        </nav>

        {/* Input de Nome do Projeto no Editor */}
        {isEditorRoute && (
          <>
            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border border-transparent hover:border-zinc-700/80 focus:border-amber-400 rounded px-1.5 py-0.5 text-xs text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800/40 focus:outline-none transition-colors max-w-[130px] sm:max-w-[200px] truncate hidden sm:block"
              title="Clique para renomear o projeto"
            />
          </>
        )}
      </div>

      {/* Centro: Informações da Placa / Camadas (apenas no Editor) */}
      {isEditorRoute && (
        <div className="hidden lg:flex items-center gap-2 text-xs bg-zinc-800/70 px-2.5 py-1 rounded-lg border border-zinc-700/60 font-mono shadow-sm shrink-0">
          {systemMode === 'ultra' && grid3D ? (
            <>
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-300 font-bold">Ultra 3D</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">
                Camada <strong className="text-amber-400">{activeLayerZ + 1}</strong>/{grid3D.layers.length}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-400 font-bold">{grid3D.totalBeads.toLocaleString()} beads</span>
            </>
          ) : grid ? (
            <>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-300">
                {multiBoardConfig.boardsHorizontal}×{multiBoardConfig.boardsVertical} Placas
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-300 font-semibold">{grid.width}×{grid.height} pinos</span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-400 font-bold">{grid.totalBeads.toLocaleString()} beads</span>
            </>
          ) : null}
        </div>
      )}

      {/* Right side: Salvar + Exportar + Upgrade CTA + Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Botão de Salvar no Editor */}
        {isEditorRoute && (
          <div className="flex items-center gap-1">
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 hidden xl:flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                Salvo!
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs shadow transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">Salvar</span>
            </button>
          </div>
        )}

        {/* Menu Dropdown de Exportação */}
        {isEditorRoute && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExportingPdf}
              className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1 text-xs shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 animate-scale-in text-xs font-sans">
                <button
                  onClick={handleExportPdf}
                  className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <div>
                    <span className="font-semibold block">PDF Vetorial de Impressão</span>
                    <span className="text-[10px] text-zinc-400">Escala 1:1 pronta para montagem</span>
                  </div>
                </button>

                <button
                  onClick={handleExportPng}
                  className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 text-left transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="font-semibold block">Imagem PNG em Alta Resolução</span>
                    <span className="text-[10px] text-zinc-400">Com grade e códigos das cores</span>
                  </div>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-800 text-zinc-200 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold block">Lista de Materiais (CSV)</span>
                    <span className="text-[10px] text-zinc-400">Contagem de peças para compras</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Member Pro Badge */}
        {isPro && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-extrabold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>PRO</span>
          </div>
        )}

        {/* User Dropdown or Guest Auth CTA */}
        {user.isGuest ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login?redirect=/editor"
              className="px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              Entrar
            </Link>
            <Link
              href="/register?redirect=/editor"
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-lg shadow transition"
            >
              Criar Conta
            </Link>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-zinc-800 text-zinc-300 transition focus:outline-none"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-6 h-6 rounded-md object-cover ring-1 ring-zinc-700"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-amber-400">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-zinc-400" />
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
        )}
      </div>
    </header>
  );
}
