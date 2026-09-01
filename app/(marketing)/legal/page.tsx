import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Cookie, Scale, Mail, ArrowRight, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Central Legal & Conformidade LGPD — BeadForge Studio',
  description: 'Portal de transparência, documentos jurídicos, termos de serviço e canal de atendimento do Encarregado de Dados (DPO) do BeadForge Studio.',
};

export default function LegalHubPage() {
  const documents = [
    {
      title: 'Política de Privacidade & LGPD',
      description: 'Como tratamos seus dados pessoais, bases legais, direitos do titular e medidas de segurança.',
      href: '/privacy',
      badge: 'Lei 13.709/2018',
      icon: ShieldCheck,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    },
    {
      title: 'Termos de Uso do Serviço',
      description: 'Regras de licença do software, propriedade autoral dos moldes, planos de assinatura e regras da galeria.',
      href: '/terms',
      badge: 'Contrato',
      icon: Scale,
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    },
    {
      title: 'Política de Cookies',
      description: 'Classificação dos cookies essenciais de sessão, preferências e rastreamento de afiliados parceiros.',
      href: '/cookies',
      badge: 'Transparência',
      icon: Cookie,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 text-zinc-300 select-none">
      {/* ── Header ── */}
      <div className="space-y-4 border-b border-zinc-800 pb-8 text-center sm:text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Início</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Portal de Governança & Compliance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Central Legal & Privacidade
        </h1>

        <p className="text-xs sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Reunimos todos os termos, políticas e canais de atendimento para garantir transparência total e segurança jurídica em sua experiência com o BeadForge Studio.
        </p>
      </div>

      {/* ── Legal Docs Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {documents.map((doc) => {
          const Icon = doc.icon;
          return (
            <Link
              key={doc.href}
              href={doc.href}
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-900 transition duration-200 flex flex-col justify-between space-y-4 group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${doc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {doc.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                  {doc.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
                <span>Acessar documento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Direct DPO Contact Channel ── */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
              <Mail className="w-4 h-4" />
              <span>Canal do Titular de Dados & DPO</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Precisa exercer seus direitos da LGPD?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
              Nossa equipe de compliance está à disposição para responder solicitações de portabilidade, retificação, confirmação de tratamento e eliminação de dados.
            </p>
          </div>

          <a
            href="mailto:contato@hamabeadsbrasil.com.br?subject=Solicita%C3%A7%C3%A3o%20LGPD%20-%20BeadForge%20Studio"
            className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition flex items-center gap-2 shrink-0"
          >
            <Mail className="w-4 h-4" />
            <span>Falar com o Encarregado</span>
          </a>
        </div>
      </div>

      {/* ── Trademark Disclaimer Box ── */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-500 space-y-2 leading-relaxed">
        <strong className="text-zinc-400 block font-semibold">Aviso Legal de Marcas & Compatibilidade:</strong>
        <p>
          BeadForge Studio é uma ferramenta digital independente desenvolvida para criadores e artesãos de Pixel Art. &quot;Hama&quot;, &quot;Perler&quot;, &quot;Artkal&quot;, &quot;Pindoo&quot; e &quot;Nabbi&quot; são marcas registradas de seus respectivos detentores de direitos, mencionadas estritamente para compatibilidade de paletas e indicação de produtos em programas de afiliados oficiais.
        </p>
      </div>
    </div>
  );
}
