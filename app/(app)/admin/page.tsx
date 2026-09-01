import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { isUserAdmin } from '@/lib/admin';
import { getAdminFullDashboardData } from '@/app/actions/admin';
import { listMerchantsAction, listProductsAction, getCommerceMetricsAction } from '@/app/actions/commerce';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const email = session?.user?.email?.toLowerCase().trim();
  const isAdmin = isUserAdmin(email) || (session?.user as any)?.role === 'admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  const dashboardData = await getAdminFullDashboardData();

  let initialMerchants: any[] = [];
  let initialProducts: any[] = [];
  let initialMetrics: any = null;

  try {
    const [mRes, pRes, metricsRes] = await Promise.allSettled([
      listMerchantsAction(),
      listProductsAction(),
      getCommerceMetricsAction(),
    ]);

    if (mRes.status === 'fulfilled') initialMerchants = mRes.value;
    if (pRes.status === 'fulfilled') initialProducts = pRes.value;
    if (metricsRes.status === 'fulfilled') initialMetrics = metricsRes.value;
  } catch (err) {
    console.error('Commerce initial load note:', err);
  }

  return (
    <AdminDashboardClient
      stats={dashboardData.stats}
      aiStats={dashboardData.aiStats}
      aiConfig={dashboardData.aiConfig}
      projects2DCount={dashboardData.projects2DCount}
      projects3DCount={dashboardData.projects3DCount}
      initialMerchants={initialMerchants}
      initialProducts={initialProducts}
      initialMetrics={initialMetrics}
    />
  );
}
