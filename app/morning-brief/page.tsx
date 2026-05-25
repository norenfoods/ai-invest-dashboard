import DataStatusBar from "@/components/DataStatusBar";
import MorningBriefPanel from "@/components/MorningBriefPanel";
import { generateMorningBrief } from "@/lib/agent/morningBrief";

export const revalidate = 300;

export default async function MorningBriefPage() {
  const brief = await generateMorningBrief();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">
          AI Morning Brief 日度市场简报
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          AI 美股晨间研究简报
        </h1>
      </div>

      <DataStatusBar initialLastUpdated={brief.generatedAt} />

      <MorningBriefPanel initialBrief={brief} />
    </div>
  );
}
