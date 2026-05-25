import DataStatusBar from "@/components/DataStatusBar";
import MorningBriefArchive from "@/components/MorningBriefArchive";
import { listMorningBriefs } from "@/lib/agent/saveMorningBrief";

export const dynamic = "force-dynamic";

export default async function MorningBriefArchivePage() {
  const briefs = await listMorningBriefs();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">
          Morning Brief Archive 历史归档
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          AI Morning Brief 历史日报
        </h1>
      </div>

      <DataStatusBar />

      <MorningBriefArchive briefs={briefs} />
    </div>
  );
}
