import DataStatusBar from "@/components/DataStatusBar";
import MorningBriefPanel from "@/components/MorningBriefPanel";
import { generateAndSaveMorningBrief } from "@/lib/agent/saveMorningBrief";

export const revalidate = 300;

export default async function MorningBriefPage() {
  const { brief, saved, alreadyGenerated } = await generateAndSaveMorningBrief();

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
            {alreadyGenerated || saved ? "已生成并归档" : "已生成，等待归档配置"}
          </span>
        </div>
      </div>

      <DataStatusBar initialLastUpdated={brief.generatedAt} />

      <MorningBriefPanel initialBrief={brief} />
    </div>
  );
}
