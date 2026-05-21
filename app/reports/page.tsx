import DataStatusBar from "@/components/DataStatusBar";
import DailyReportPanel from "@/components/DailyReportPanel";
import { generateDailyReport } from "@/lib/ai/dailyReport";
import { riskAlerts } from "@/lib/mockData";
import { getIndexQuotes, getWatchlistStocks } from "@/lib/services/stockService";

export const revalidate = 300;

export default async function ReportsPage() {
  const [indexQuotes, watchlistStocks] = await Promise.all([
    getIndexQuotes(),
    getWatchlistStocks(),
  ]);
  const dailyReport = await generateDailyReport(
    indexQuotes,
    watchlistStocks,
    riskAlerts,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">AI Daily Report AI日报页</p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          AI 今日研究日报
        </h1>
      </div>

      <DataStatusBar />

      <DailyReportPanel
        initialReport={dailyReport}
        initialStocks={watchlistStocks}
      />
    </div>
  );
}
