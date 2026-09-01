import React from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies & Tecnologias de Rastreamento — BeadForge Studio',
  description: 'Entenda como utilizamos cookies essenciais, preferências e links de parceiros afiliados no BeadForge Studio em conformidade com a LGPD.',
};

export default function CookiesPolicyPage() {
  const lastUpdated = '01 de Setembro de 2026';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 text-zinc-300 select-none">
      {/* ── Header ── */}
      <div className="space-y-4 border-b border-zinc-800 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Início</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Cookie className="w-3.5 h-3.5" />
          <span>Transparência de Cookies</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Política de Cookies
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400">
          Última atualização: <strong>{lastUpdated}</strong> &bull; Versão 2.1
        </p>
      </div>

      {/* ── Summary Box ── */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>O que são Cookies?</span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles servem para lembrar suas preferências, manter sua sessão conectada com segurança e garantir o correto funcionamento da plataforma.
        </p>
      </div>

      {/* ── Cookies Classification Table / Grid ── */}
      <div className="space-y-8 text-sm leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">1.</span> Categorias de Cookies Utilizados
          </h2>

          <div className="space-y-4">
            {/* Essential */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cookies Estritamente Necessários (Essenciais)</span>
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Sempre Ativos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Imprescindíveis para que a plataforma funcione. Permitem a autenticação segura (sessão persistente de login com Better Auth), proteção contra ataques CSRF e salvamento temporário do seu progresso no editor de moldes.
              </p>
            </div>

            {/* Preferences */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Cookies de Preferências & LocalStorage</span>
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Otimização UX
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Guardam suas preferências de idioma (Português, Inglês, Espanhol), dimensões favoritas de placas de montagem (pegboards) e a preferência da caixa &quot;Permanecer conectado&quot;.
              </p>
            </div>

            {/* Affiliate */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-sky-400" />
                  <span>Cookies de Parceiros & Programas de Afiliados</span>
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  Recomendação
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Quando você clica em botões para comprar insumos e kits recomendados (Mercado Livre, Shopee ou Amazon), um cookie anônimo de rastreamento de parceiro pode ser registrado pelo marketplace de destino para atribuir a comissão de afiliado sem qualquer custo adicional para você.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">2.</span> Como Gerenciar ou Desativar Cookies
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Você pode a qualquer momento alterar ou revogar seu consentimento de cookies através das configurações do seu navegador de internet. A maioria dos navegadores permite bloquear ou excluir cookies existentes:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400 text-xs sm:text-sm">
            <li><strong>Google Chrome:</strong> Configurações &gt; Privacidade e Segurança &gt; Cookies e outros dados do site.</li>
            <li><strong>Mozilla Firefox:</strong> Opções &gt; Privacidade e Segurança &gt; Cookies e dados de sites.</li>
            <li><strong>Apple Safari:</strong> Preferências &gt; Privacidade &gt; Bloquear todos os cookies.</li>
            <li><strong>Microsoft Edge:</strong> Configurações &gt; Cookies e permissões de site.</li>
          </ul>
          <p className="text-xs text-amber-300/80 pt-1">
            <em>Nota: A desativação de cookies essenciais pode impedir o funcionamento da autenticação e do salvamento de moldes na nuvem.</em>
          </p>
        </section>
      </div>

      {/* ── Footer Navigation ── */}
      <div className="pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} BeadForge Studio &bull; Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-zinc-400 hover:text-amber-400 transition">Termos de Uso</Link>
          <Link href="/privacy" className="text-zinc-400 hover:text-amber-400 transition">Política de Privacidade</Link>
          <Link href="/legal" className="text-zinc-400 hover:text-amber-400 transition">Central Legal</Link>
        </div>
      </div>
    </div>
  );
}
