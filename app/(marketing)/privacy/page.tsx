import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, UserCheck, Server, ArrowLeft, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade & LGPD — BeadForge Studio',
  description: 'Conheça nossa Política de Privacidade e Tratamento de Dados Pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD).',
};

export default function PrivacyPolicyPage() {
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
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Conformidade com a Lei 13.709/2018 (LGPD)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Política de Privacidade & Proteção de Dados
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400">
          Última atualização: <strong>{lastUpdated}</strong> &bull; Versão 2.1
        </p>
      </div>

      {/* ── Summary Box ── */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Compromisso de Privacidade BeadForge Studio</span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          O <strong>BeadForge Studio</strong> preza pela segurança, confidencialidade e privacidade dos dados de seus usuários. Esta Política descreve de forma clara e transparente como coletamos, tratamos, armazenamos e protegemos seus dados pessoais, em estrita observância à Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) e ao Marco Civil da Internet (Lei nº 12.965/2014).
        </p>
      </div>

      {/* ── Content Sections ── */}
      <div className="space-y-8 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">1.</span> Dados Pessoais Coletados
          </h2>
          <p>
            Coletamos apenas os dados estritamente necessários para a prestação e personalização dos nossos serviços de geração de moldes e gestão de projetos para Fuse Beads:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400 text-xs sm:text-sm">
            <li><strong>Dados Cadastrais:</strong> Nome completo, endereço de e-mail e credenciais de acesso criptografadas com algoritmos de hash seguros (scrypt/bcrypt).</li>
            <li><strong>Dados de Uso e Criação:</strong> Moldes criados, histórico de paletas selecionadas, matrizes de cores, projetos salvos na nuvem e itens publicados na Galeria Pública.</li>
            <li><strong>Dados de Faturamento:</strong> As transações de assinatura (Cartão de Crédito e PIX) são processadas diretamente pelo gateway seguro <strong>Stripe Inc.</strong>. O BeadForge Studio <em>não armazena números de cartão de crédito</em> em seus servidores.</li>
            <li><strong>Dados Técnicos e Navegação:</strong> Endereço IP, tipo de navegador, sistema operacional e registros de acesso (logs) exigidos pelo Art. 15 do Marco Civil da Internet.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">2.</span> Finalidades e Bases Legais do Tratamento (Art. 7º LGPD)
          </h2>
          <p>
            O tratamento de seus dados pessoais fundamenta-se nas seguintes bases legais:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 block uppercase">Execução de Contrato</span>
              <p className="text-xs text-zinc-400">
                Permitir o uso do editor 2D, conversão de imagens, cálculo automático de beads (BOM), exportação de PDFs e controle de assinaturas.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 block uppercase">Consentimento Inequívoco</span>
              <p className="text-xs text-zinc-400">
                Fornecido no momento do cadastro ou no envio de projetos voluntários para a Galeria Pública comunitária.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 block uppercase">Legítimo Interesse</span>
              <p className="text-xs text-zinc-400">
                Aprimoramento da estabilidade do software, prevenção a fraudes e suporte técnico ao usuário.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 block uppercase">Obrigação Legal</span>
              <p className="text-xs text-zinc-400">
                Guarda de registros de conexão conforme determinação do Marco Civil da Internet.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">3.</span> Compartilhamento de Dados com Terceiros
          </h2>
          <p>
            O BeadForge Studio <strong>não vende, aluga ou comercializa dados pessoais</strong> de seus usuários. O compartilhamento ocorre exclusivamente com parceiros tecnológicos essenciais:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400 text-xs sm:text-sm">
            <li><strong>Stripe:</strong> Processamento seguro de pagamentos e emissão de cobranças de assinaturas.</li>
            <li><strong>Provedores de Nuvem & Banco de Dados:</strong> Hospedagem criptografada e servidores em data centers com certificação ISO 27001 e SOC 2.</li>
            <li><strong>Programas de Afiliados (Mercado Livre, Shopee, Amazon):</strong> Ao clicar em links de compra de materiais, o usuário é redirecionado ao marketplace parceiro com um identificador de campanha anônimo. <em>Nenhum dado pessoal do usuário é transmitido ao lojista pelo BeadForge</em>.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">4.</span> Direitos do Titular de Dados (Art. 18 LGPD)
          </h2>
          <p>
            Em conformidade com o Artigo 18 da LGPD, você possui os seguintes direitos garantidos e pode exercê-los a qualquer momento:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Confirmação & Acesso</span>
              <p className="text-zinc-400">Saber se tratamos seus dados e solicitar uma cópia dos mesmos.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Correção de Dados</span>
              <p className="text-zinc-400">Atualizar dados incompletos, inexatos ou desatualizados no seu perfil.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Eliminação (Esquecimento)</span>
              <p className="text-zinc-400">Solicitar a exclusão definitiva de sua conta e dados pessoais armazenados.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Portabilidade</span>
              <p className="text-zinc-400">Exportar todos os seus projetos e moldes em formato estruturado (JSON/PDF).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Revogação do Consentimento</span>
              <p className="text-zinc-400">Revogar autorizações concedidas a qualquer momento de forma simples.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Informação sobre Compartilhamento</span>
              <p className="text-zinc-400">Obter detalhes sobre as entidades públicas e privadas com quem compartilhamos dados.</p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">5.</span> Segurança da Informação
          </h2>
          <p>
            Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acessos não autorizados, incidentes de segurança, destruição ou alteração:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400 text-xs sm:text-sm">
            <li>Criptografia de ponta a ponta em trânsito com protocolo HTTPS / TLS 1.3.</li>
            <li>Senhas armazenadas com algoritmos de derivação de chaves resistentes a ataques de força bruta.</li>
            <li>Controles rigorosos de permissões de acesso administrativo baseados no princípio do menor privilégio.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">6.</span> Canal de Contato com o Encarregado de Dados (DPO)
          </h2>
          <p>
            Para exercer seus direitos de titular, tirar dúvidas sobre o tratamento de seus dados pessoais ou registrar uma solicitação relacionada à LGPD, entre em contato diretamente com o nosso Encarregado de Proteção de Dados:
          </p>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 block uppercase font-bold">Encarregado de Proteção de Dados (DPO)</span>
              <p className="text-sm font-bold text-white">Equipe de Privacidade & Compliance BeadForge</p>
              <p className="text-xs text-amber-400 font-mono">contato@hamabeadsbrasil.com.br</p>
            </div>

            <a
              href="mailto:contato@hamabeadsbrasil.com.br?subject=Solicita%C3%A7%C3%A3o%20LGPD%20-%20BeadForge%20Studio"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl shadow transition flex items-center gap-2 shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar Solicitação LGPD</span>
            </a>
          </div>
        </section>
      </div>

      {/* ── Footer Navigation ── */}
      <div className="pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} BeadForge Studio &bull; Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-zinc-400 hover:text-amber-400 transition">Termos de Uso</Link>
          <Link href="/cookies" className="text-zinc-400 hover:text-amber-400 transition">Política de Cookies</Link>
          <Link href="/legal" className="text-zinc-400 hover:text-amber-400 transition">Central Legal</Link>
        </div>
      </div>
    </div>
  );
}
