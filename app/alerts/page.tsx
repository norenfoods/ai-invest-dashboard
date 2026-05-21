import AlertsList from "@/components/AlertsList";
import DashboardCard from "@/components/DashboardCard";
import DataStatusBar from "@/components/DataStatusBar";
import { getAlertsForWatchlist } from "@/lib/services/alertService";

export const revalidate = 300;

export default async function AlertsPage() {
  const alerts = await getAlertsForWatchlist();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">Alerts 预警中心</p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          风险预警中心
        </h1>
      </div>

      <DataStatusBar />

      <DashboardCard title="预警列表" eyebrow="Risk Alerts">
        <AlertsList initialAlerts={alerts} />
      </DashboardCard>
    </div>
  );
}
