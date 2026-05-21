"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
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
        setError("登录链接发送失败，请稍后重试。");
        return;
      }

      setMessage("登录链接已发送，请检查邮箱");
    } catch {
      setError("Supabase 登录服务暂不可用，请检查环境变量配置。");
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

        {error ? (
          <div className="mt-4 rounded-md border border-terminal-red/35 bg-terminal-panelSoft/55 p-3 text-sm text-terminal-red">
            {error}
          </div>
        ) : null}

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
