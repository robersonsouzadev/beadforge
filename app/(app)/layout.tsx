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

  if (!session?.user) {
    redirect('/login');
  }

  const sub = await getUserSubscription(session.user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-400/30 selection:text-amber-200">
      <AppHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        isPro={sub.isPro}
      />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
