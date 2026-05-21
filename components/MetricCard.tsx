type MetricCardProps = {
  label: string;
  value: string;
  subValue?: string;
  tone?: "neutral" | "positive" | "negative" | "warning";
};

const toneClass = {
  neutral: "text-terminal-text",
  positive: "text-terminal-green",
  negative: "text-terminal-red",
  warning: "text-terminal-amber",
};

export default function MetricCard({
  label,
  value,
  subValue,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/70 p-4">
      <div className="text-sm text-terminal-muted">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass[tone]}`}>
        {value}
      </div>
      {subValue ? (
        <div className="mt-1 text-xs text-terminal-muted">{subValue}</div>
      ) : null}
    </div>
  );
}
