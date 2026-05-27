import Link from "next/link";
import { getCompanyPath } from "@/lib/ai-industry/companies";
import { listAiThematicTheses } from "@/lib/ai-industry/theses";
import {
  formatBilingual,
  getCompanyDisplayName,
  getNarrativeTerm,
} from "@/lib/ai-industry/terminology";
import type { AiThesisDetail } from "@/lib/ai-industry/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    sort?: string;
    q?: string;
  }>;
};

const statusClass = (status: string): string => {
  if (status === "active") {
    return "border-terminal-green/40 text-terminal-green";
  }

  if (status === "watching") {
    return "border-terminal-amber/50 text-terminal-amber";
  }

  return "border-terminal-border text-terminal-muted";
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const sortTheses = (
  theses: AiThesisDetail[],
  sort: string | undefined,
): AiThesisDetail[] => {
  const sorted = [...theses];

  if (sort === "confidence") {
    return sorted.sort((a, b) => b.confidence - a.confidence);
  }

  if (sort === "title") {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  return sorted.sort(
    (a, b) =>
      new Date(b.updated_at ?? 0).getTime() -
      new Date(a.updated_at ?? 0).getTime(),
  );
};

export default async function AiThesesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const theses = await listAiThematicTheses();
  const query = params.q?.trim().toLowerCase() ?? "";
  const status = params.status ?? "all";

  const filtered = sortTheses(
    theses.filter((thesis) => {
      const matchesStatus = status === "all" || thesis.status === status;
      const haystack = [
        thesis.title,
        thesis.thesis,
        ...thesis.narratives.map((narrative) => narrative.name),
        ...thesis.companies.map((company) => `${company.name} ${company.ticker}`),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || haystack.includes(query));
    }),
    params.sort,
  );

  const filterHref = (next: Record<string, string>) => {
    const nextParams = new URLSearchParams();
    Object.entries({ ...params, ...next }).forEach(([key, value]) => {
      if (value && value !== "all") {
        nextParams.set(key, value);
      }
    });
    const suffix = nextParams.toString();
    return suffix ? `/ai/theses?${suffix}` : "/ai/theses";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 shadow-panel">
        <p className="text-sm text-terminal-cyan">
          Thesis Intelligence Engine
          <span className="ml-2 text-terminal-muted">投资主线引擎</span>
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-terminal-text">
              AI Investment Theses
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-terminal-muted">
              English-first institutional scanning layer for active AI industry
              theses, evidence balance, linked narratives, and exposed company
              nodes. Chinese labels provide concise analyst-side recognition.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 px-3 py-2">
              <div className="text-terminal-muted">Tracked</div>
              <div className="mt-1 text-lg font-semibold text-terminal-text">
                {theses.length}
              </div>
            </div>
            <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 px-3 py-2">
              <div className="text-terminal-muted">Active</div>
              <div className="mt-1 text-lg font-semibold text-terminal-green">
                {theses.filter((thesis) => thesis.status === "active").length}
              </div>
            </div>
            <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 px-3 py-2">
              <div className="text-terminal-muted">Avg Conf.</div>
              <div className="mt-1 text-lg font-semibold text-terminal-cyan">
                {(
                  theses.reduce((sum, thesis) => sum + thesis.confidence, 0) /
                  Math.max(theses.length, 1)
                ).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 shadow-panel">
        <div className="flex flex-col gap-3 border-b border-terminal-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "active", "watching"].map((item) => (
              <Link
                key={item}
                href={filterHref({ status: item })}
                className={`rounded border px-3 py-2 text-xs uppercase transition ${
                  status === item
                    ? "border-terminal-cyan/60 text-terminal-cyan"
                    : "border-terminal-border text-terminal-muted hover:border-terminal-cyan/50"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <form action="/ai/theses" className="flex gap-2">
              {status !== "all" ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              {params.sort ? (
                <input type="hidden" name="sort" value={params.sort} />
              ) : null}
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Filter thesis, narrative, ticker"
                className="w-64 rounded border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none transition placeholder:text-terminal-muted focus:border-terminal-cyan/60"
              />
              <button className="rounded border border-terminal-cyan/50 px-3 py-2 text-xs uppercase text-terminal-cyan transition hover:border-terminal-cyan hover:text-terminal-text">
                Filter
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {[
                ["updated", "Updated"],
                ["confidence", "Confidence"],
                ["title", "Title"],
              ].map(([value, label]) => (
                <Link
                  key={value}
                  href={filterHref({ sort: value })}
                  className={`rounded border px-3 py-2 text-xs transition ${
                    (params.sort ?? "updated") === value
                      ? "border-terminal-cyan/60 text-terminal-cyan"
                      : "border-terminal-border text-terminal-muted hover:border-terminal-cyan/50"
                  }`}
                >
                  Sort: {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-terminal-border text-xs uppercase tracking-[0.16em] text-terminal-muted">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Horizon</th>
                <th className="px-4 py-3 font-medium">Narratives</th>
                <th className="px-4 py-3 font-medium">Companies</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((thesis) => (
                <tr
                  key={thesis.id}
                  className="border-b border-terminal-border/70 transition hover:bg-terminal-panelSoft/50"
                >
                  <td className="max-w-[280px] px-4 py-4 align-top">
                    <Link
                      href={`/ai/theses/${encodeURIComponent(
                        thesis.slug ?? thesis.id,
                      )}`}
                      className="font-medium text-terminal-text hover:text-terminal-cyan"
                    >
                      {thesis.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-terminal-muted">
                      {thesis.thesis}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={`rounded border px-2.5 py-1 text-xs uppercase ${statusClass(
                        thesis.status,
                      )}`}
                    >
                      {thesis.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-semibold text-terminal-text">
                      {thesis.confidence}/5
                    </div>
                    <div className="mt-2 h-1.5 w-20 overflow-hidden rounded bg-terminal-border">
                      <div
                        className="h-full bg-terminal-cyan"
                        style={{ width: `${thesis.confidence * 20}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-terminal-muted">
                    {thesis.time_horizon}
                  </td>
                  <td className="max-w-[230px] px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {thesis.narratives.map((narrative) => (
                        <span
                          key={narrative.id}
                          className="rounded border border-terminal-border px-2 py-1 text-[11px] text-terminal-cyan"
                        >
                          {formatBilingual(getNarrativeTerm(narrative.name))}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[230px] px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {thesis.companies.slice(0, 5).map((company) => (
                        <Link
                          key={company.id}
                          href={getCompanyPath(company)}
                          className="rounded border border-terminal-border px-2 py-1 text-[11px] text-terminal-muted hover:border-terminal-cyan/50 hover:text-terminal-text"
                        >
                          {company.ticker}
                          {getCompanyDisplayName(company.name).secondary ? (
                            <span className="ml-1 text-terminal-muted">
                              {getCompanyDisplayName(company.name).secondary}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-terminal-muted">
                    {formatDate(thesis.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
