import { DashboardPrototype } from "@/components/dashboard-prototype";
import { hasSupabaseEnv } from "@/lib/env";
import { getAssignmentSummaries } from "@/lib/queries/assignments";
import { getTeacherDashboard } from "@/lib/queries/dashboard";
import { getPaEvidences } from "@/lib/queries/pa";

export default async function AppPage() {
  const [assignments, dashboard, evidences] = await Promise.all([
    getAssignmentSummaries(),
    getTeacherDashboard(),
    getPaEvidences()
  ]);

  return (
    <DashboardPrototype
      assignments={assignments}
      dashboard={dashboard}
      evidences={evidences}
      isDemoMode={!hasSupabaseEnv()}
    />
  );
}
