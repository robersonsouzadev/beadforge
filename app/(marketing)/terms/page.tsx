import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, Scale, ArrowLeft, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso & Condições Gerais — BeadForge Studio',
  description: 'Termos e Condições Gerais de Uso do software e plataforma BeadForge Studio, incluindo direitos autorais, planos e regras de serviço.',
};

export default function TermsOfServicePage() {
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
          <Scale className="w-3.5 h-3.5" />
          <span>Termos e Condições Contratuais</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Termos de Uso do Serviço
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400">
          Última atualização: <strong>{lastUpdated}</strong> &bull; Versão 2.1
        </p>
      </div>

      {/* ── Summary Alert Box ── */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Resumo dos Principais Termos</span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Ao acessar ou utilizar a plataforma <strong>BeadForge Studio</strong> (disponível em <code className="text-amber-400 font-mono">app.hamabeadsbrasil.com.br</code>), você concorda integralmente com estes Termos de Uso e com a nossa Política de Privacidade. Caso não concorde com qualquer termo, solicitamos que não utilize a plataforma.
        </p>
      </div>

      {/* ── Detailed Clauses ── */}
      <div className="space-y-8 text-sm leading-relaxed">
        {/* Clause 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">1.</span> Objeto e Licença de Uso
          </h2>
          <p>
            O <strong>BeadForge Studio</strong> é uma plataforma SaaS (Software como Serviço) que disponibiliza ferramentas digitais para conversão de imagens, edição de matrizes de pixels, cálculo automatizado de listas de materiais (Bill of Materials - BOM) e exportação de moldes para montagem manual de artesanatos em Fuse Beads (contas fusíveis plásticas).
          </p>
          <p>
            Concedemos a você uma licença pessoal, não exclusiva, intransferível e revogável para utilizar o software de acordo com o plano contratado (Plano Gratuito, Creator Pro ou Studio Ateliê).
          </p>
        </section>

        {/* Clause 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">2.</span> Propriedade Intelectual & Seus Projetos
          </h2>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-1">Seus moldes e criações são 100% seus:</strong>
              Você mantém todos os direitos autorais, de propriedade intelectual e comerciais sobre as imagens, desenhos, arquivos exportados em PDF e criações manuais elaboradas com o auxílio do BeadForge Studio.
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Você é livre para comercializar, expor, imprimir e confeccionar fisicamente qualquer peça gerada através do software, respeitando os direitos autorais de eventuais personagens protegidos por copyright que você decida reproduzir.
          </p>
        </section>

        {/* Clause 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">3.</span> Isenção de Marcas Registradas de Terceiros
          </h2>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <p>
              <strong>Aviso Legal de Marcas:</strong> O BeadForge Studio é um software independente. Os nomes <em>&quot;Hama Beads&quot;</em>, <em>&quot;Perler Beads&quot;</em>, <em>&quot;Artkal Beads&quot;</em>, <em>&quot;Pindoo&quot;</em> e <em>&quot;Nabbi&quot;</em> são marcas comerciais registradas de seus respectivos fabricantes e detentores legais.
            </p>
            <p className="text-zinc-400">
              A menção a tais marcas na plataforma destina-se única e exclusivamente a fins de compatibilidade técnica de paletas de cores, conversão cromática e referência de insumos no mercado, não havendo qualquer relação societária, patrocínio ou endosso oficial.
            </p>
          </div>
        </section>

        {/* Clause 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">4.</span> Galeria Pública & Regras de Conduta
          </h2>
          <p>
            Ao publicar voluntariamente um molde na <strong>Galeria Pública</strong> do BeadForge Studio, você concede à plataforma uma licença não exclusiva para exibir e permitir que outros artesãos visualizem, remixem e baixem o padrão comunitário.
          </p>
          <p>
            É expressamente proibido publicar ou carregar conteúdos que contenham:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400 text-xs sm:text-sm">
            <li>Material difamatório, ofensivo, preconceituoso ou de ódio.</li>
            <li>Imagens de pornografia ou exploração de menores.</li>
            <li>Códigos maliciosos, vírus ou scripts que possam comprometer a segurança da plataforma.</li>
          </ul>
          <p className="text-xs text-zinc-400">
            A equipe de moderação do BeadForge reserva-se o direito de remover qualquer publicação que viole estas diretrizes sem aviso prévio.
          </p>
        </section>

        {/* Clause 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">5.</span> Planos de Assinatura, Cancelamento & Reembolso
          </h2>
          <div className="space-y-3 text-xs sm:text-sm">
            <p>
              <strong>Cobrança Recorrente:</strong> As assinaturas dos planos <em>Creator Pro</em> e <em>Studio Ateliê</em> são cobradas periodicamente (mensal ou anualmente) através do gateway Stripe.
            </p>
            <p>
              <strong>Cancelamento Simples:</strong> Você pode cancelar sua assinatura a qualquer momento diretamente no painel de configurações (<code className="text-amber-400">/dashboard/settings/billing</code>). O acesso aos recursos pagos permanecerá ativo até o final do período vigente já pago.
            </p>
            <p>
              <strong>Direito de Arrependimento (Art. 49 do CDC):</strong> Em conformidade com o Código de Defesa do Consumidor brasileiro, você pode solicitar o reembolso integral da sua primeira assinatura no prazo de até 7 (sete) dias corridos após a contratação inicial.
            </p>
          </div>
        </section>

        {/* Clause 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">6.</span> Limitação de Responsabilidade & Garantias
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            O BeadForge Studio é fornecido no estado em que se encontra (&quot;as is&quot;). Embora empreguemos as melhores práticas de engenharia de software e alta disponibilidade, não garantimos que a operação seja 100% ininterrupta ou isenta de erros operacionais de terceiros (como provedores de telecomunicações ou instabilidades de infraestrutura em nuvem).
          </p>
        </section>

        {/* Clause 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-mono">7.</span> Foro e Legislação Aplicável
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Estes Termos são regidos e interpretados segundo as leis da República Federativa do Brasil, em especial o Código Civil, o Marco Civil da Internet e a Lei Geral de Proteção de Dados (LGPD). Fica eleito o Foro da Comarca de São Paulo/SP para dirimir eventuais controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro.
          </p>
        </section>
      </div>

      {/* ── Footer Navigation ── */}
      <div className="pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} BeadForge Studio &bull; Todos os direitos reservados.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-zinc-400 hover:text-amber-400 transition">Política de Privacidade</Link>
          <Link href="/cookies" className="text-zinc-400 hover:text-amber-400 transition">Política de Cookies</Link>
          <Link href="/legal" className="text-zinc-400 hover:text-amber-400 transition">Central Legal</Link>
        </div>
      </div>
    </div>
  );
}
