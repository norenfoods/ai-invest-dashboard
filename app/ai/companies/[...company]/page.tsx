import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardCard from "@/components/DashboardCard";
import {
  findUniqueAiCompanyByTicker,
  getAiCompanyByExchangeAndTicker,
  getCompanyPath,
} from "@/lib/ai-industry/companies";

export const dynamic = "force-dynamic";

type AiCompanyPageProps = {
  params: Promise<{ company: string[] }>;
};

export default async function AiCompanyPage({ params }: AiCompanyPageProps) {
  const { company: routeParts } = await params;

  if (routeParts.length === 1) {
    const match = await findUniqueAiCompanyByTicker(routeParts[0]);

    if (!match) {
      notFound();
    }

    redirect(getCompanyPath(match));
  }

  if (routeParts.length !== 2) {
    notFound();
  }

  const [exchange, ticker] = routeParts;
  const company = await getAiCompanyByExchangeAndTicker(exchange, ticker);

  if (!company) {
    notFound();
  }

  const mapHref =
    company.map?.slug === "china-domestic-substitution" ? "/ai/china" : "/ai/global";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-terminal-cyan">AI Industry Node</p>
            <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
              {company.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {[company.ticker, company.exchange, company.region, company.category?.name]
                .filter(Boolean)
                .map((item) => (
                  <span
                    key={item}
                    className="rounded border border-terminal-border bg-terminal-panelSoft px-2.5 py-1 text-xs text-terminal-muted"
                  >
                    {item}
                  </span>
                ))}
            </div>
          </div>
          <Link
            href={mapHref}
            className="rounded-md border border-terminal-cyan/40 px-3 py-2 text-xs font-medium text-terminal-cyan hover:border-terminal-cyan"
          >
            Back to Map
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <DashboardCard title="Node Thesis" eyebrow="Thesis">
            <p className="text-sm leading-6 text-terminal-muted">{company.thesis}</p>
          </DashboardCard>

          <DashboardCard title="AI Narrative" eyebrow="Narrative">
            <p className="text-sm leading-6 text-terminal-muted">
              {company.ai_narrative}
            </p>
          </DashboardCard>

          <DashboardCard title="Relationships" eyebrow="Supply Chain">
            {company.relationships.length ? (
              <div className="space-y-3">
                {company.relationships.map((relationship) => {
                  const peer =
                    relationship.source_company_id === company.id
                      ? relationship.target
                      : relationship.source;

                  return (
                    <Link
                      key={relationship.id}
                      href={peer ? getCompanyPath(peer) : "#"}
                      className="block rounded border border-terminal-border bg-terminal-panelSoft/70 p-3 hover:border-terminal-cyan/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-terminal-text">
                          {relationship.relationship_type}
                          {peer ? (
                            <span className="ml-2 text-terminal-muted">
                              · {peer.name}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-terminal-cyan">
                          Strength {relationship.strength}/5
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-terminal-muted">
                        {relationship.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-terminal-muted">
                No MVP relationships seeded yet.
              </p>
            )}
          </DashboardCard>

          <DashboardCard title="Thesis Tracker" eyebrow="Active Theses">
            {company.theses.length ? (
              <div className="space-y-3">
                {company.theses.map((thesis) => (
                  <div
                    key={thesis.id}
                    className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-terminal-text">
                        {thesis.title}
                      </div>
                      <div className="text-xs text-terminal-cyan">
                        {thesis.confidence}/5
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-terminal-muted">
                      {thesis.thesis}
                    </p>
                    <div className="mt-3 text-[11px] uppercase text-terminal-muted">
                      {thesis.status} · {thesis.time_horizon}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-terminal-muted">
                No MVP thesis seeded for this node yet.
              </p>
            )}
          </DashboardCard>
        </div>

        <aside className="space-y-6">
          <DashboardCard title="Market Regime" eyebrow="Regime Relevance">
            <p className="text-sm leading-6 text-terminal-muted">
              {company.market_regime_relevance}
            </p>
          </DashboardCard>

          <DashboardCard title="Valuation Context" eyebrow="Context">
            <p className="text-sm leading-6 text-terminal-muted">
              {company.valuation_context}
            </p>
          </DashboardCard>

          <DashboardCard title="Earnings Memory" eyebrow="Memory Hook">
            <p className="text-sm leading-6 text-terminal-muted">
              {company.earnings_memory}
            </p>
          </DashboardCard>

          <DashboardCard title="Narrative Links" eyebrow="Narratives">
            <div className="space-y-2">
              {company.narratives.map((narrative) => (
                <Link
                  key={`${narrative.id}-${narrative.role}`}
                  href="/ai/narratives"
                  className="block rounded border border-terminal-border bg-terminal-panelSoft px-3 py-2 hover:border-terminal-cyan/50"
                >
                  <div className="text-sm text-terminal-text">
                    {narrative.name}
                  </div>
                  <div className="mt-1 text-xs text-terminal-cyan">
                    {narrative.role}
                  </div>
                </Link>
              ))}
            </div>
          </DashboardCard>
        </aside>
      </div>
    </div>
  );
}
