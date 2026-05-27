import Link from "next/link";
import AiCompanyNodeCard from "@/components/AiCompanyNodeCard";
import type { AiMapDetail } from "@/lib/ai-industry/types";

type AiMarketMapViewProps = {
  map: AiMapDetail;
  eyebrow: string;
};

export default function AiMarketMapView({ map, eyebrow }: AiMarketMapViewProps) {
  const companies = map.categories.flatMap((category) => category.companies);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-terminal-cyan">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
              {map.name}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-terminal-muted">
              {map.description}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded border border-terminal-border bg-terminal-bg/50 px-4 py-3">
              <div className="text-xl font-semibold text-terminal-text">
                {companies.length}
              </div>
              <div className="mt-1 text-[11px] uppercase text-terminal-muted">
                Nodes
              </div>
            </div>
            <div className="rounded border border-terminal-border bg-terminal-bg/50 px-4 py-3">
              <div className="text-xl font-semibold text-terminal-text">
                {map.categories.length}
              </div>
              <div className="mt-1 text-[11px] uppercase text-terminal-muted">
                Lanes
              </div>
            </div>
            <div className="rounded border border-terminal-border bg-terminal-bg/50 px-4 py-3">
              <div className="text-xl font-semibold text-terminal-text">
                {map.region_scope.length}
              </div>
              <div className="mt-1 text-[11px] uppercase text-terminal-muted">
                Regions
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {map.region_scope.map((region) => (
            <span
              key={region}
              className="rounded border border-terminal-border bg-terminal-panelSoft px-2.5 py-1 text-xs text-terminal-muted"
            >
              {region}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          {map.categories.map((category) => (
            <section
              key={category.id}
              className="rounded-lg border border-terminal-border bg-terminal-panel/88 p-5 shadow-panel"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
                    {category.slug}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-terminal-text">
                    {category.name}
                  </h2>
                </div>
                <div className="text-xs text-terminal-muted">
                  {category.companies.length} nodes
                </div>
              </div>
              {category.companies.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {category.companies.map((company) => (
                    <AiCompanyNodeCard key={company.id} company={company} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-terminal-muted">
                  No MVP companies seeded in this lane yet.
                </p>
              )}
            </section>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-4 shadow-panel">
            <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              Intelligence Layer
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-terminal-muted">
              <p>
                Each card is an AI industry node with category, thesis,
                dependencies, narrative context, and future memory hooks.
              </p>
              <p>
                Public pages are read-only and consume RLS-visible market-map
                data.
              </p>
            </div>
          </section>
          <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-4 shadow-panel">
            <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              Connected Views
            </div>
            <div className="mt-3 grid gap-2">
              <Link
                href="/ai/narratives"
                className="rounded border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-muted hover:border-terminal-cyan/50 hover:text-terminal-text"
              >
                Narrative Tracker
              </Link>
              <Link
                href="/research-memory"
                className="rounded border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-muted hover:border-terminal-cyan/50 hover:text-terminal-text"
              >
                AI Research Timeline
              </Link>
              <Link
                href="/morning-brief"
                className="rounded border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-muted hover:border-terminal-cyan/50 hover:text-terminal-text"
              >
                Morning Brief
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
