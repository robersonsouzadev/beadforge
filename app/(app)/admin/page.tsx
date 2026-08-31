import React from 'react';
import { getAdminFullDashboardData } from '@/app/actions/admin';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default async function AdminPage() {
  const { stats, aiStats, aiConfig, projects2DCount, projects3DCount } =
    await getAdminFullDashboardData();

  return (
    <AdminDashboardClient
      stats={stats}
      aiStats={aiStats}
      aiConfig={aiConfig}
      projects2DCount={projects2DCount}
      projects3DCount={projects3DCount}
    />
  );
}
