import type { Metadata } from "next";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "美股投资研究仪表盘",
  description: "中文美股投资研究 MVP，使用 mock data 构建。",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/watchlist", label: "自选股" },
  { href: "/portfolio", label: "持仓" },
  { href: "/earnings", label: "财报分析" },
  { href: "/stocks/NVDA", label: "个股详情" },
  { href: "/ai/global", label: "Global AI Map" },
  { href: "/ai/china", label: "国产替代 Map" },
  { href: "/ai/narratives", label: "Narratives" },
  { href: "/morning-brief", label: "Morning Brief" },
  { href: "/morning-brief/archive", label: "简报归档" },
  { href: "/research-memory", label: "研究记忆" },
  { href: "/reports", label: "AI日报" },
  { href: "/alerts", label: "预警中心" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <div className="terminal-grid min-h-screen">
          <header className="sticky top-0 z-20 border-b border-terminal-border/80 bg-terminal-bg/88 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded border border-terminal-cyan/35 bg-terminal-panelSoft text-sm font-semibold text-terminal-cyan">
                  US
                </div>
                <div>
                  <div className="text-base font-semibold tracking-wide text-terminal-text">
                    中文美股投资研究终端
                  </div>
                  <div className="text-xs text-terminal-muted">
                    Mock Data · Research Only · 非自动交易
                  </div>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <nav className="flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded border border-terminal-border bg-terminal-panel px-3 py-2 text-sm text-terminal-muted transition hover:border-terminal-cyan/50 hover:text-terminal-text"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <AuthButton />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-5 py-6 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
