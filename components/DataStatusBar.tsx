"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DataStatusBarProps = {
  initialLastUpdated?: string;
};

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

export default function DataStatusBar({
  initialLastUpdated = new Date().toISOString(),
}: DataStatusBarProps) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ lastUpdated?: string }>).detail;
      setLoading(false);
      setError("");
      setLastUpdated(detail?.lastUpdated ?? new Date().toISOString());
    };
    const handleError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setLoading(false);
      setError(detail?.message ?? "数据刷新失败，已使用 fallback。");
      setLastUpdated(new Date().toISOString());
    };

    window.addEventListener("app:data-updated", handleUpdated);
    window.addEventListener("app:data-error", handleError);

    return () => {
      window.removeEventListener("app:data-updated", handleUpdated);
      window.removeEventListener("app:data-error", handleError);
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    window.dispatchEvent(new CustomEvent("app:refresh-data"));
    router.refresh();

    window.setTimeout(() => {
      setLoading(false);
      setLastUpdated(new Date().toISOString());
    }, 700);
  };

  return (
    <div className="flex flex-col gap-2 rounded border border-terminal-border bg-terminal-panel px-4 py-3 text-sm text-terminal-muted md:flex-row md:items-center md:justify-between">
      <div>
        <span>最后更新：{formatDateTime(lastUpdated)}</span>
        {loading ? <span className="ml-3 text-terminal-cyan">loading</span> : null}
        {error ? <span className="ml-3 text-terminal-red">error：{error}</span> : null}
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        className="w-fit rounded-md border border-terminal-cyan/40 px-3 py-1.5 text-xs font-medium text-terminal-cyan hover:border-terminal-cyan"
      >
        刷新数据
      </button>
    </div>
  );
}
