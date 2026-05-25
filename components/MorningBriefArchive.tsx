"use client";

import { useMemo, useState } from "react";

type SavedMorningBrief = {
  id: string;
  date: string;
  title: string;
  content_markdown: string;
  summary: string;
  created_at: string;
};

type MorningBriefArchiveProps = {
  briefs: SavedMorningBrief[];
};

const downloadMarkdown = (brief: SavedMorningBrief) => {
  const blob = new Blob([brief.content_markdown], {
    type: "text/markdown;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${brief.title.replace(/\s+/g, "-").toLowerCase()}.md`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function MorningBriefArchive({
  briefs,
}: MorningBriefArchiveProps) {
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(briefs[0]?.date ?? "");

  const filteredBriefs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return briefs.filter((brief) => {
      if (!normalizedQuery) {
        return true;
      }

      return `${brief.date} ${brief.title} ${brief.summary} ${brief.content_markdown}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [briefs, query]);
  const selectedBrief =
    briefs.find((brief) => brief.date === selectedDate) ?? filteredBriefs[0] ?? null;

  if (!briefs.length) {
    return (
      <div className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 text-sm leading-6 text-terminal-muted shadow-panel">
        还没有 Morning Brief 归档。配置 Supabase 表、服务端密钥和 Vercel Cron 后，系统会每天北京时间 08:00 自动生成并保存。
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-5 shadow-panel">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
            Archive
          </div>
          <h2 className="mt-1 text-lg font-semibold text-terminal-text">
            历史日报列表
          </h2>
        </div>

        <div className="space-y-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索日期、标题、摘要或正文"
            className="w-full rounded-md border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
          />
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-md border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-cyan/60"
          >
            {briefs.map((brief) => (
              <option key={brief.id} value={brief.date}>
                {brief.date} · {brief.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 space-y-3">
          {filteredBriefs.map((brief) => (
            <button
              key={brief.id}
              type="button"
              onClick={() => setSelectedDate(brief.date)}
              className={`w-full rounded-md border p-4 text-left transition ${
                selectedBrief?.id === brief.id
                  ? "border-terminal-cyan/60 bg-terminal-panelSoft"
                  : "border-terminal-border bg-terminal-panelSoft/45 hover:border-terminal-cyan/35"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-terminal-text">
                  {brief.date}
                </div>
                <div className="text-xs text-terminal-muted">
                  {new Date(brief.created_at).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-terminal-muted">
                {brief.summary}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-5 shadow-panel">
        {selectedBrief ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 border-b border-terminal-border pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
                  {selectedBrief.date}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-terminal-text">
                  {selectedBrief.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => downloadMarkdown(selectedBrief)}
                className="w-fit rounded-md border border-terminal-cyan/40 px-3 py-2 text-xs font-medium text-terminal-cyan hover:border-terminal-cyan"
              >
                导出 Markdown
              </button>
            </div>

            <article className="max-h-[720px] overflow-auto whitespace-pre-wrap rounded-md border border-terminal-border bg-terminal-bg/65 p-4 text-sm leading-7 text-terminal-muted">
              {selectedBrief.content_markdown}
            </article>
          </div>
        ) : (
          <div className="text-sm text-terminal-muted">没有匹配的日报。</div>
        )}
      </section>
    </div>
  );
}
