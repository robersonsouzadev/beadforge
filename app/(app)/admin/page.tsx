import React from 'react';
import { getAdminFullDashboardData } from '@/app/actions/admin';
import { listMerchantsAction, listProductsAction, getCommerceMetricsAction } from '@/app/actions/commerce';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default async function AdminPage() {
  const [dashboardData, initialMerchants, initialProducts, initialMetrics] = await Promise.all([
    getAdminFullDashboardData(),
    listMerchantsAction(),
    listProductsAction(),
    getCommerceMetricsAction(),
  ]);

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
