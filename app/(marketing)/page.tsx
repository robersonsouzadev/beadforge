import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Layers,
  Box,
  FileSpreadsheet,
  FileDown,
  Palette,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-20">
      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            O Sistema de Produção para Arte em Beads
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Transforme qualquer imagem em{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              arte perfeita de Beads
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Gere moldes com as cores reais da sua gaveta (Hama, Artkal, Pindoo), exporte PDFs vetoriais 1:1 com gabarito de montagem e calcule sua lista de materiais em segundos.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/editor"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-base font-bold rounded-2xl shadow-xl shadow-amber-500/25 transition duration-200 transform hover:scale-[1.03]"
            >
              <span>Criar Molde Grátis (Sem Cadastro)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/gallery"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-base font-semibold rounded-2xl transition duration-200"
            >
              <span>Explorar Galeria de Moldes</span>
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-base font-semibold rounded-2xl transition duration-200"
            >
              <span>Preços</span>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Sem cadastro para criar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>PDF 1:1 e Lista CSV inclusos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Paletas Hama, Artkal e Pindoo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tudo o que você precisa para produzir com perfeição
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base">
            Desenvolvido para artesãos, hobbistas e ateliês profissionais de Fuse Beads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Cores Reais da sua Gaveta
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Mapeamento visual exato para paletas Hama, Artkal e Pindoo (Mini 2,6mm e Midi 5,0mm) com dithering suave para transições naturais.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                PDF Vetorial 1:1 com Gabarito
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Gere PDFs em escala real para colocar embaixo da sua pegboard transparente. Inclui numeração de linhas, réguas e legenda de códigos.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Lista de Materiais & Modo Ultra 3D
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Saiba a contagem exata de pacotes para comprar sem sobras. Escale para a terceira dimensão com fatiamento de modelos 3D em camadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D Highlight Section ── */}
      <section id="3d" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 p-8 sm:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase mb-4">
              <Zap className="w-3.5 h-3.5" />
              Exclusivo Plano Pro
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Escale para a Terceira Dimensão com o Modo Ultra 3D
            </h2>
            <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
              Crie chaveiros, miniaturas e esculturas volumétricas. O sistema voxeliza seu modelo 3D, divide em camadas montáveis e sugere a quantidade exata de beads por cor.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/30 transition transform hover:scale-105"
              >
                Conhecer o Plano Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Preview Section ── */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Planos Transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Escolha o Plano Ideal para seu Momento
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            De entusiastas criando os primeiros moldes a ateliês profissionais com encomendas diárias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Free */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Gratuito</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">R$ 0</span>
                <span className="text-xs text-zinc-500">/mês</span>
              </div>
              <p className="text-xs text-zinc-400">Para começar a desenhar e exportar seus primeiros moldes 2D.</p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Editor 2D sem login obrigatório</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>PDF 1:1 e CSV inclusos (com marca d&apos;água)</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Paletas Hama, Artkal e Pindoo</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Multi-placas até 4×4</span></li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/editor" className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs rounded-xl flex items-center justify-center transition border border-zinc-700">
                Criar Molde Grátis
              </Link>
            </div>
          </div>

          {/* Creator Pro */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Creator Pro</h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">Hobby Pro</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">R$ 19,90</span>
                <span className="text-xs text-zinc-500">/mês</span>
              </div>
              <p className="text-xs text-zinc-400">Para criadores e hobbistas que querem PDFs limpos e projetos na nuvem.</p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>PDFs 1:1 sem marca d&apos;água</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Projetos ilimitados na nuvem</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Assistente de Montagem Bead-a-Bead</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> <span>Galeria Pública & Perfil de Criador</span></li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/pricing" className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl flex items-center justify-center transition">
                Assinar Creator Pro
              </Link>
            </div>
          </div>

          {/* Studio Ateliê */}
          <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Studio Ateliê</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-extrabold">Recomendado</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400">R$ 79,00</span>
                <span className="text-xs text-zinc-400">/mês</span>
              </div>
              <p className="text-xs text-zinc-300">O sistema completo para quem vende e atende encomendas.</p>
              <ul className="space-y-2 text-xs text-zinc-200 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Estoque Físico Multi-Marca & Baixa</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Calculadora de Custos com Taxas Shopee/ML</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Pipeline de Pedidos & Provas WhatsApp</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">PDF White-Label com seu Ateliê</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="font-semibold">Modo Ultra 3D Voxel Completo</span></li>
              </ul>
            </div>
            <div className="pt-6">
              <Link href="/pricing" className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition">
                <span>Quero o Studio Completo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Pronto para criar moldes profissionais?
        </h2>
        <p className="mt-4 text-zinc-400 text-sm sm:text-base">
          Crie sua conta em segundos e comece a desenhar agora mesmo.
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-base font-bold rounded-2xl shadow-xl shadow-amber-500/30 transition duration-150 transform hover:scale-105"
          >
            <span>Começar Gratuitamente</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
