import DashboardCard from "@/components/DashboardCard";
import DataStatusBar from "@/components/DataStatusBar";
import WatchlistManager from "@/components/WatchlistManager";
import { getWatchlistStocks } from "@/lib/services/stockService";

export const revalidate = 300;

export default async function WatchlistPage() {
  const watchlistStocks = await getWatchlistStocks();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">Watchlist 自选股页</p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          核心科技自选股
        </h1>
      </div>

      <DataStatusBar />

      <DashboardCard title="自选股列表" eyebrow="Cloud Sync · Local Fallback">
        <WatchlistManager initialStocks={watchlistStocks} />
      </DashboardCard>
    </div>
  );
}
