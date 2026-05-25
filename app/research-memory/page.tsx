import DataStatusBar from "@/components/DataStatusBar";
import ResearchMemoryTimeline from "@/components/ResearchMemoryTimeline";
import { listResearchMemory } from "@/lib/agent/researchMemory";

export const dynamic = "force-dynamic";

export default async function ResearchMemoryPage() {
  const items = await listResearchMemory();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-terminal-cyan">
          AI Research Memory 长期研究记忆
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          AI 研究记忆时间线
        </h1>
      </div>

      <DataStatusBar />

      {items.length ? (
        <ResearchMemoryTimeline items={items} />
      ) : (
        <div className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 text-sm leading-6 text-terminal-muted shadow-panel">
          还没有研究记忆。Morning Brief 生成并保存后，会自动沉淀每日 AI 观察、风险变化、板块状态和重点股票状态。
        </div>
      )}
    </div>
  );
}
