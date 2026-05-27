import Link from "next/link";
import { getCompanyPath } from "@/lib/ai-industry/companies";
import type { AiCompanyNode } from "@/lib/ai-industry/types";

type AiCompanyNodeCardProps = {
  company: AiCompanyNode;
};

export default function AiCompanyNodeCard({ company }: AiCompanyNodeCardProps) {
  return (
    <Link
      href={getCompanyPath(company)}
      className="group block rounded-md border border-terminal-border bg-terminal-panelSoft/70 p-4 transition hover:border-terminal-cyan/60 hover:bg-terminal-panelSoft"
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
        <div className="rounded border border-terminal-cyan/35 px-2 py-1 text-[11px] uppercase text-terminal-cyan">
          Core
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-terminal-muted">
        {company.ai_narrative}
      </p>
      <div className="mt-4 border-t border-terminal-border/70 pt-3 text-[11px] leading-5 text-terminal-muted">
        <span className="text-terminal-cyan">Dependencies:</span>{" "}
        {company.dependency_relationships.slice(0, 2).join(" · ") || "N/A"}
      </div>
    </Link>
  );
}
