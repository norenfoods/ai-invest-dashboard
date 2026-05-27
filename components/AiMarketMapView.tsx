import Link from "next/link";
import AiCompanyNodeCard from "@/components/AiCompanyNodeCard";
import { getAiIndustryQuotes } from "@/lib/ai-industry/quotes";
import {
  abbreviationTerms,
  formatBilingual,
  getCompanyDisplayName,
  getLayerTerm,
  getNarrativeTerm,
} from "@/lib/ai-industry/terminology";
import type {
  AiCompanyNode,
  AiCompanyRelationship,
  AiMapDetail,
} from "@/lib/ai-industry/types";

type AiMarketMapViewProps = {
  map: AiMapDetail;
  eyebrow: string;
};

const relationshipTypeClass = (type: string): string => {
  if (type === "dependency") {
    return "border-terminal-red/50 text-terminal-red";
  }

  if (type === "supplier") {
    return "border-terminal-cyan/50 text-terminal-cyan";
  }

  if (type === "beneficiary") {
    return "border-terminal-green/50 text-terminal-green";
  }

  if (type === "replacement_candidate") {
    return "border-terminal-amber/50 text-terminal-amber";
  }

  return "border-terminal-border text-terminal-muted";
};

const narrativeBadges = (company: AiCompanyNode, mapSlug: string): string[] => {
  const text = `${company.ai_narrative} ${company.thesis} ${company.category_id} ${mapSlug}`.toLowerCase();
  const badges: string[] = [];

  if (text.includes("capex") || text.includes("datacenter")) {
    badges.push("AI Capex Supercycle");
  }

  if (text.includes("hbm") || text.includes("memory")) {
    badges.push("HBM Shortage");
  }

  if (text.includes("china") || text.includes("国产")) {
    badges.push("China Domestic Substitution");
  }

  if (text.includes("power") || text.includes("cooling") || text.includes("电力")) {
    badges.push("Datacenter Power Bottleneck");
  }

  if (text.includes("inference") || text.includes("software")) {
    badges.push("Inference Demand Explosion");
  }

  return badges;
};

const relationshipLabel = (
  relationship: AiCompanyRelationship,
  companiesById: Map<string, AiCompanyNode>,
): string => {
  const source = companiesById.get(relationship.source_company_id);
  const target = companiesById.get(relationship.target_company_id);

  const sourceName = source
    ? formatBilingual(getCompanyDisplayName(source.name))
    : "External";
  const targetName = target
    ? formatBilingual(getCompanyDisplayName(target.name))
    : "External";

  return `${sourceName} -> ${targetName}`;
};

export default async function AiMarketMapView({
  map,
  eyebrow,
}: AiMarketMapViewProps) {
  const companies = map.categories.flatMap((category) => category.companies);
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const quotes = await getAiIndustryQuotes(companies);
  const supportedQuotes = Object.values(quotes).filter(
    (quote) => quote.status === "realtime" || quote.status === "fallback",
  );
  const missingQuotes = Object.values(quotes).filter(
    (quote) => quote.status === "missing",
  );
  const unsupportedQuotes = Object.values(quotes).filter(
    (quote) => quote.status === "unsupported",
  );
  const visibleRelationships = map.relationships.filter(
    (relationship) =>
      companiesById.has(relationship.source_company_id) ||
      companiesById.has(relationship.target_company_id),
  );

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
              {map.description} English is the primary research label; Chinese
              terms are used as a secondary recognition layer for institutional
              cross-border coverage.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center lg:grid-cols-4">
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
                {visibleRelationships.length}
              </div>
              <div className="mt-1 text-[11px] uppercase text-terminal-muted">
                Links
              </div>
            </div>
            <div className="rounded border border-terminal-border bg-terminal-bg/50 px-4 py-3">
              <div className="text-xl font-semibold text-terminal-green">
                {supportedQuotes.length}
              </div>
              <div className="mt-1 text-[11px] uppercase text-terminal-muted">
                Priced
              </div>
            </div>
            <div className="rounded border border-terminal-border bg-terminal-bg/50 px-4 py-3">
              <div className="text-xl font-semibold text-terminal-muted">
                {missingQuotes.length + unsupportedQuotes.length}
              </div>
              <div className="mt-1 text-[11px] uppercase text-terminal-muted">
                Gaps
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "AI Capex Supercycle",
            "HBM Shortage",
            "China Domestic Substitution",
            "Datacenter Power Bottleneck",
            "Inference Demand Explosion",
          ].map(
            (badge) => (
              <span
                key={badge}
                className="rounded border border-terminal-cyan/30 bg-terminal-bg/50 px-2.5 py-1 text-xs text-terminal-cyan"
              >
                {formatBilingual(getNarrativeTerm(badge))}
              </span>
            ),
          )}
          {abbreviationTerms.slice(0, 4).map((term) => (
            <span
              key={term.primary}
              className="rounded border border-terminal-border bg-terminal-bg/40 px-2.5 py-1 text-xs text-terminal-muted"
            >
              {formatBilingual(term)}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-terminal-border bg-terminal-panel/90 p-5 shadow-panel">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              Connected Supply Chain Lanes
            </div>
            <h2 className="mt-1 text-lg font-semibold text-terminal-text">
              Layered AI Industry Flow
            </h2>
          </div>
          <div className="text-xs text-terminal-muted">
            Lanes are grouped by category; explicit direction appears only in relationships below.
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1180px] auto-cols-[15rem] grid-flow-col gap-4">
            {map.categories.map((category, index) => (
              <section
                key={category.id}
                className="relative rounded-lg border border-terminal-border bg-terminal-bg/45 p-3"
              >
                {index < map.categories.length - 1 ? (
                  <div className="pointer-events-none absolute right-[-0.9rem] top-6 z-10 h-[calc(100%-3rem)] w-px bg-terminal-border/80">
                    <div className="absolute left-[-2px] top-0 h-1.5 w-1.5 rounded-full bg-terminal-border" />
                    <div className="absolute bottom-0 left-[-2px] h-1.5 w-1.5 rounded-full bg-terminal-border" />
                  </div>
                ) : null}
                <div className="mb-3 border-b border-terminal-border pb-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-terminal-cyan">
                    Layer {index + 1}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-terminal-text">
                    {formatBilingual(getLayerTerm(category.slug))}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-terminal-muted">
                    {category.companies.length} nodes ·{" "}
                    {
                      category.companies.filter(
                        (company) =>
                          quotes[company.id]?.status === "realtime" ||
                          quotes[company.id]?.status === "fallback",
                      ).length
                    }{" "}
                    priced
                  </p>
                </div>
                <div className="space-y-3">
                  {category.companies.map((company) => (
                    <AiCompanyNodeCard
                      key={company.id}
                      company={company}
                      quote={quotes[company.id]}
                      badges={narrativeBadges(company, map.slug)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-lg border border-terminal-border bg-terminal-panel/90 p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
                Directional Relationship Lines
              </div>
              <h2 className="mt-1 text-lg font-semibold text-terminal-text">
                Dependency / Supplier / Beneficiary Map
              </h2>
            </div>
            <div className="text-xs text-terminal-muted">
              {visibleRelationships.length} links
            </div>
          </div>
          {visibleRelationships.length ? (
            <div className="space-y-3">
              {visibleRelationships.map((relationship) => (
                <div
                  key={relationship.id}
                  className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-semibold text-terminal-text">
                      {relationshipLabel(relationship, companiesById)}
                    </div>
                    <span
                      className={`w-fit rounded border px-2 py-1 text-xs ${relationshipTypeClass(
                        relationship.relationship_type,
                      )}`}
                    >
                      {relationship.relationship_type} · {relationship.strength}/5
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-terminal-muted">
                    <div className="h-px flex-1 bg-terminal-border" />
                    <span>directional line</span>
                    <div className="h-px flex-1 bg-terminal-cyan/50" />
                    <span className="text-terminal-cyan">→</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-terminal-muted">
                    {relationship.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-terminal-muted">
              No relationship lines seeded for this map yet.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-4 shadow-panel">
            <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              Category Summary
            </div>
            <div className="mt-3 space-y-2">
              {map.categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded border border-terminal-border bg-terminal-panelSoft/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-terminal-text">
                      {formatBilingual(getLayerTerm(category.slug))}
                    </span>
                    <span className="text-xs text-terminal-cyan">
                      {category.companies.length}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-terminal-muted">
                    {category.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-4 shadow-panel">
            <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              Quote Coverage
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded border border-terminal-green/30 px-3 py-2 text-terminal-green">
                {supportedQuotes.length} realtime/fallback
              </div>
              <div className="rounded border border-terminal-red/30 px-3 py-2 text-terminal-red">
                {missingQuotes.length} missing
              </div>
              <div className="rounded border border-terminal-border px-3 py-2 text-terminal-muted">
                {unsupportedQuotes.length} unsupported
              </div>
              <div className="rounded border border-terminal-border px-3 py-2 text-terminal-muted">
                {map.region_scope.length} regions
              </div>
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
