import Link from "next/link";
import DashboardCard from "@/components/DashboardCard";
import { getCompanyPath } from "@/lib/ai-industry/companies";
import { listAiNarratives } from "@/lib/ai-industry/narratives";

export const dynamic = "force-dynamic";

const statusClass = (status: string): string => {
  if (status === "accelerating") {
    return "border-terminal-green/40 text-terminal-green";
  }

  if (status === "emerging") {
    return "border-terminal-cyan/40 text-terminal-cyan";
  }

  return "border-terminal-border text-terminal-muted";
};

export default async function AiNarrativesPage() {
  const narratives = await listAiNarratives();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 shadow-panel">
        <p className="text-sm text-terminal-cyan">Narrative Tracker</p>
        <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
          AI Narrative Intelligence
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-terminal-muted">
          Tracks capital-cycle narratives, linked companies, likely winners,
          second-order beneficiaries, risks, and regime relevance.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {narratives.map((narrative) => (
          <DashboardCard
            key={narrative.id}
            title={narrative.name}
            eyebrow={narrative.slug}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2.5 py-1 text-xs uppercase ${statusClass(
                    narrative.status,
                  )}`}
                >
                  {narrative.status}
                </span>
                <span className="rounded border border-terminal-border px-2.5 py-1 text-xs text-terminal-muted">
                  {narrative.companies.length} linked nodes
                </span>
              </div>
              <p className="text-sm leading-6 text-terminal-muted">
                {narrative.description}
              </p>
              <p className="border-l-2 border-terminal-cyan/50 pl-3 text-xs leading-5 text-terminal-muted">
                {narrative.regime_relevance}
              </p>
              <div className="space-y-2">
                {narrative.companies.map((company) => (
                  <Link
                    key={`${narrative.id}-${company.id}-${company.role}`}
                    href={getCompanyPath(company)}
                    className="flex items-center justify-between gap-3 rounded border border-terminal-border bg-terminal-panelSoft/70 px-3 py-2 text-sm transition hover:border-terminal-cyan/50"
                  >
                    <span className="text-terminal-text">
                      {company.name}
                      <span className="ml-2 text-xs text-terminal-muted">
                        {company.ticker}
                      </span>
                    </span>
                    <span className="text-xs text-terminal-cyan">
                      {company.role}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-terminal-border pt-3">
                {narrative.risks.map((risk) => (
                  <span
                    key={risk}
                    className="rounded border border-terminal-border px-2 py-1 text-[11px] text-terminal-muted"
                  >
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}
