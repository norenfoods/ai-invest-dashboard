import { unstable_noStore as noStore } from "next/cache";
import DataStatusBar from "@/components/DataStatusBar";
import MorningBriefPanel from "@/components/MorningBriefPanel";
import {
  emptyMorningBrief,
  getLatestMorningBrief,
  getMorningBriefByDate,
  getShanghaiDate,
  savedMorningBriefToBrief,
} from "@/lib/agent/saveMorningBrief";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MorningBriefPage() {
  noStore();

  const saved =
    (await getMorningBriefByDate(getShanghaiDate())) ?? (await getLatestMorningBrief());
  const brief = saved ? savedMorningBriefToBrief(saved) : emptyMorningBrief();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-terminal-cyan">
            AI Morning Brief 日度市场简报
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
            AI 美股晨间研究简报
          </h1>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-panel px-4 py-2 text-sm text-terminal-muted">
          今日状态：
          <span className="text-terminal-cyan">
            {saved ? "已生成并归档" : "尚未生成"}
          </span>
        </div>
      </div>

      <DataStatusBar initialLastUpdated={brief.generatedAt} />

      <MorningBriefPanel initialBrief={brief} />
    </div>
  );
}
