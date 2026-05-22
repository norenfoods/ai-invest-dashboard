"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const isFailedToFetchError = (error: unknown): boolean =>
  error instanceof TypeError && String(error.message).includes("Failed to fetch");

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentOrigin =
    typeof window === "undefined" ? "浏览器加载后显示" : window.location.origin;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        console.error("Supabase signInWithOtp error:", signInError);
        setErrorMessages(
          [
            signInError.message
              ? `error.message: ${signInError.message}`
              : "error.message: 无",
            "name" in signInError && signInError.name
              ? `error.name: ${signInError.name}`
              : null,
          ].filter((item): item is string => Boolean(item)),
        );
        return;
      }

      setMessage("登录链接已发送，请检查邮箱");
    } catch (error) {
      console.error("Supabase signInWithOtp exception:", error);
      setErrorMessages([
        `exception: ${String(error)}`,
        ...(isFailedToFetchError(error)
          ? [
              "浏览器无法连接 Supabase Auth 接口，优先检查 Supabase URL、Vercel 环境变量、网络和浏览器插件。",
            ]
          : []),
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center">
      <div className="w-full rounded-lg border border-terminal-border bg-terminal-panel/92 p-6 shadow-panel">
        <div className="mb-6">
          <p className="text-sm text-terminal-cyan">Supabase Auth</p>
          <h1 className="mt-2 text-2xl font-semibold text-terminal-text">
            登录研究终端
          </h1>
          <p className="mt-3 text-sm leading-6 text-terminal-muted">
            使用邮箱接收 Magic Link。登录后自选股和持仓会同步到云端。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-terminal-muted">邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="mt-2 min-h-12 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 w-full rounded-md border border-terminal-cyan/45 bg-terminal-panelSoft px-4 text-sm font-medium text-terminal-cyan transition hover:border-terminal-cyan disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "发送中..." : "发送登录链接"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-md border border-terminal-green/35 bg-terminal-panelSoft/55 p-3 text-sm text-terminal-green">
            {message}
          </div>
        ) : null}

        {errorMessages.length ? (
          <div className="mt-4 rounded-md border border-terminal-red/35 bg-terminal-panelSoft/55 p-3 text-sm text-terminal-red">
            <div className="font-medium">登录诊断信息</div>
            <div className="mt-2 space-y-1 break-words">
              {errorMessages.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-md border border-terminal-border bg-terminal-bg/70 p-3 text-xs leading-6 text-terminal-muted">
          <div className="text-terminal-cyan">调试信息</div>
          <div>NEXT_PUBLIC_SUPABASE_URL 是否存在：{String(Boolean(supabaseUrl))}</div>
          <div className="break-words">
            NEXT_PUBLIC_SUPABASE_URL 实际值：{supabaseUrl ?? "未配置"}
          </div>
          <div>
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 是否存在：
            {String(Boolean(supabasePublishableKey))}
          </div>
          <div className="break-words">当前 location.origin：{currentOrigin}</div>
        </div>

        <Link
          href="/"
          className="mt-5 inline-flex text-sm text-terminal-muted hover:text-terminal-text"
        >
          返回 Dashboard
        </Link>
      </div>
    </div>
  );
}
