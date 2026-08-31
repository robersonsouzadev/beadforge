import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';
import { AppHeader } from '@/components/AppHeader';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const sub = session?.user
    ? await getUserSubscription(session.user.id)
    : null;

  const isGuest = !session?.user;
  const isPro = sub?.isPro ?? false;
  const isStudio = sub?.isStudio ?? false;
  const isTrial = sub?.isTrial ?? false;
  const trialDaysRemaining = sub?.trialDaysRemaining ?? 0;

  const userData = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        isGuest: false,
      }
    : {
        name: 'Visitante',
        email: '',
        image: null,
        isGuest: true,
      };

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-400/30 selection:text-amber-200">
      <AppHeader
        user={userData}
        isPro={isPro}
        isStudio={isStudio}
        isTrial={isTrial}
        trialDaysRemaining={trialDaysRemaining}
      />
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
