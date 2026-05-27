import Link from "next/link";
import { getCompanyPath } from "@/lib/ai-industry/companies";
import type { AiIndustryQuote } from "@/lib/ai-industry/quotes";
import type { AiCompanyNode } from "@/lib/ai-industry/types";

type AiCompanyNodeCardProps = {
  company: AiCompanyNode;
  quote?: AiIndustryQuote;
  badges?: string[];
};

const formatPrice = (quote?: AiIndustryQuote): string => {
  if (!quote?.price) {
    return "—";
  }

  return quote.price.toLocaleString("en-US", {
    maximumFractionDigits: quote.price >= 100 ? 2 : 3,
    minimumFractionDigits: quote.price >= 100 ? 2 : 3,
  });
};

const statusLabel: Record<AiIndustryQuote["status"], string> = {
  realtime: "realtime",
  fallback: "fallback",
  missing: "missing",
  unsupported: "unsupported",
};

const statusClass = (status?: AiIndustryQuote["status"]): string => {
  if (status === "realtime") {
    return "border-terminal-green/50 text-terminal-green";
  }

  if (status === "fallback") {
    return "border-terminal-amber/50 text-terminal-amber";
  }

  if (status === "unsupported") {
    return "border-terminal-border text-terminal-muted";
  }

  return "border-terminal-red/50 text-terminal-red";
};

export default function AiCompanyNodeCard({
  company,
  quote,
  badges = [],
}: AiCompanyNodeCardProps) {
  const change = quote?.changePercent;

  return (
    <Link
      href={getCompanyPath(company)}
      className="group block min-h-44 rounded-md border border-terminal-border bg-terminal-panelSoft/75 p-3 transition hover:border-terminal-cyan/60 hover:bg-terminal-panelSoft"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-terminal-text">
            {company.name}
          </div>
          <div className="mt-1 text-xs text-terminal-muted">
            {company.ticker} · {company.exchange} · {company.region}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-terminal-text">
            {formatPrice(quote)}
          </div>
          <div
            className={`mt-1 rounded border px-1.5 py-0.5 text-[10px] uppercase ${statusClass(quote?.status)}`}
          >
            {quote ? statusLabel[quote.status] : "missing"}
          </div>
        </div>
      </div>
      {typeof change === "number" ? (
        <div
          className={`mt-2 text-xs font-semibold ${change >= 0 ? "text-terminal-green" : "text-terminal-red"}`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      ) : null}
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-terminal-muted">
        {company.ai_narrative}
      </p>
      {badges.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className="rounded border border-terminal-cyan/25 bg-terminal-bg/40 px-1.5 py-0.5 text-[10px] uppercase text-terminal-cyan"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 border-t border-terminal-border/70 pt-3 text-[11px] leading-5 text-terminal-muted">
        <span className="text-terminal-cyan">Dependencies:</span>{" "}
        {company.dependency_relationships.slice(0, 2).join(" · ") || "N/A"}
      </div>
    </Link>
  );
}
