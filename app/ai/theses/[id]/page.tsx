import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardCard from "@/components/DashboardCard";
import { getCompanyPath } from "@/lib/ai-industry/companies";
import { getAiThematicThesis } from "@/lib/ai-industry/theses";
import {
  formatBilingual,
  getCompanyDisplayName,
  getNarrativeTerm,
} from "@/lib/ai-industry/terminology";
import type { AiThesisDetail } from "@/lib/ai-industry/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const confidenceImpact = (value: number): string => {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
};

export default async function AiThesisDetailPage({ params }: PageProps) {
  const { id } = await params;
  const thesis = await getAiThematicThesis(decodeURIComponent(id));

  if (!thesis) {
    notFound();
  }

  const supportingEvidence = thesis.evidence.filter(
    (evidence) => evidence.evidence_type === "support",
  );
  const contradictingEvidence = thesis.evidence.filter(
    (evidence) => evidence.evidence_type === "contradict",
  );
  const timeline = [...thesis.evidence].sort(
    (a, b) =>
      new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 shadow-panel">
        <Link
          href="/ai/theses"
          className="text-sm text-terminal-cyan hover:text-terminal-text"
        >
          Back to theses
        </Link>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="text-sm text-terminal-muted">
              Thesis Statement
              <span className="ml-2">投资主线陈述</span>
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
              {thesis.title}
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-terminal-muted">
              {thesis.thesis}
            </p>
          </div>
          <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-terminal-muted">
                  Confidence
                </div>
                <div className="mt-2 text-2xl font-semibold text-terminal-cyan">
                  {thesis.confidence}/5
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-terminal-muted">
                  Status
                </div>
                <div className="mt-2 text-sm uppercase text-terminal-green">
                  {thesis.status}
                </div>
              </div>
              <div className="col-span-2 border-t border-terminal-border pt-3">
                <div className="text-xs uppercase tracking-[0.16em] text-terminal-muted">
                  Horizon
                </div>
                <div className="mt-2 text-sm text-terminal-text">
                  {thesis.time_horizon}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Supporting Evidence" eyebrow="positive">
          <div className="space-y-3">
            {supportingEvidence.map((evidence) => (
              <EvidenceItem key={evidence.id} evidence={evidence} />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Contradicting Evidence" eyebrow="negative">
          <div className="space-y-3">
            {contradictingEvidence.map((evidence) => (
              <EvidenceItem key={evidence.id} evidence={evidence} />
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <DashboardCard title="Linked Narratives" eyebrow="narratives">
          <div className="space-y-3">
            {thesis.narratives.map((narrative) => (
              <Link
                key={narrative.id}
                href="/ai/narratives"
                className="block rounded border border-terminal-border bg-terminal-panelSoft/70 p-3 transition hover:border-terminal-cyan/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-terminal-text">
                    {formatBilingual(getNarrativeTerm(narrative.name))}
                  </div>
                  <div className="text-xs uppercase text-terminal-cyan">
                    {narrative.status}
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-terminal-muted">
                  {narrative.description}
                </p>
              </Link>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Linked Companies" eyebrow="company nodes">
          <div className="grid gap-2 sm:grid-cols-2">
            {thesis.companies.map((company) => (
              <Link
                key={company.id}
                href={getCompanyPath(company)}
                className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-3 transition hover:border-terminal-cyan/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-terminal-text">
                    {getCompanyDisplayName(company.name).primary}
                    {getCompanyDisplayName(company.name).secondary ? (
                      <span className="ml-1.5 text-xs font-normal text-terminal-muted">
                        {getCompanyDisplayName(company.name).secondary}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-terminal-cyan">
                    {company.ticker}
                  </div>
                </div>
                <p className="mt-2 text-xs text-terminal-muted">
                  {company.exchange} · {company.region}
                </p>
              </Link>
            ))}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Thesis Timeline" eyebrow="evidence chronology">
        <div className="space-y-4">
          {timeline.map((event) => (
            <div
              key={event.id}
              className="grid gap-3 border-l-2 border-terminal-border pl-4 md:grid-cols-[140px_1fr]"
            >
              <div>
                <div className="text-sm font-medium text-terminal-text">
                  {formatDate(event.event_date)}
                </div>
                <div
                  className={`mt-1 text-xs uppercase ${
                    event.evidence_type === "support"
                      ? "text-terminal-green"
                      : "text-terminal-amber"
                  }`}
                >
                  {event.evidence_type}
                </div>
              </div>
              <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-3">
                <p className="text-sm leading-6 text-terminal-muted">
                  {event.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase text-terminal-muted">
                  <span className="rounded border border-terminal-border px-2 py-1">
                    {event.source_type}
                  </span>
                  <span className="rounded border border-terminal-border px-2 py-1">
                    Impact {confidenceImpact(event.confidence_impact)}
                  </span>
                  {event.related_company ? (
                    <span className="rounded border border-terminal-border px-2 py-1">
                      {event.related_company.ticker}
                    </span>
                  ) : null}
                  {event.related_narrative ? (
                    <span className="rounded border border-terminal-border px-2 py-1">
                      {getNarrativeTerm(event.related_narrative.name).primary}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}

function EvidenceItem({
  evidence,
}: {
  evidence: AiThesisDetail["evidence"][number];
}) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-[0.14em] text-terminal-cyan">
          {evidence.source_type}
        </span>
        <span
          className={`text-xs ${
            evidence.confidence_impact >= 0
              ? "text-terminal-green"
              : "text-terminal-amber"
          }`}
        >
          Impact {confidenceImpact(evidence.confidence_impact)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-terminal-muted">
        {evidence.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-terminal-muted">
        <span>{formatDate(evidence.event_date)}</span>
        {evidence.related_company ? (
          <span>{evidence.related_company.ticker}</span>
        ) : null}
        {evidence.related_narrative ? (
          <span>{getNarrativeTerm(evidence.related_narrative.name).primary}</span>
        ) : null}
      </div>
    </div>
  );
}
