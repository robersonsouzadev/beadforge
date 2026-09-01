import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';
import { CookieConsent } from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'BeadForge Studio — Gerador Profissional de Moldes para Beads',
  description: 'Crie e converta imagens em moldes de montagem para Fuse Beads (2.6mm e 5.0mm) com exportação em PDF vetorial, HD PNG e lista de materiais.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400/30 selection:text-amber-200">
        <LanguageProvider>
          {children}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}

