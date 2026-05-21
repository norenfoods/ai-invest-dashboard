import DashboardCard from "@/components/DashboardCard";
import DataStatusBar from "@/components/DataStatusBar";
import PortfolioManager from "@/components/PortfolioManager";
import { getWatchlistStocks } from "@/lib/services/stockService";

export const revalidate = 300;

export default async function PortfolioPage() {
  const initialStocks = await getWatchlistStocks();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">Portfolio 持仓管理</p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          持仓风险研究
        </h1>
      </div>

      <DataStatusBar />

      <DashboardCard title="持仓管理" eyebrow="Cloud Sync · Local Fallback">
        <PortfolioManager initialStocks={initialStocks} />
      </DashboardCard>
    </div>
  );
}
