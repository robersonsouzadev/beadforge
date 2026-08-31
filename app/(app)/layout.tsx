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

  const isGuest = !session?.user;
  const isPro = session?.user
    ? (await getUserSubscription(session.user.id)).isPro
    : false;

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
      <AppHeader user={userData} isPro={isPro} />
      <main className="flex-1 flex flex-col h-[calc(100vh-48px)] overflow-hidden w-full max-w-full">{children}</main>
    </div>
  );
}
