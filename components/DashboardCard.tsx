import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({
  title,
  eyebrow,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <section
      className={`rounded-lg border border-terminal-border bg-terminal-panel/92 p-5 shadow-panel ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-lg font-semibold text-terminal-text">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
