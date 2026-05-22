"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const supabase = createClient();

      void supabase.auth.getUser().then(({ data }) => {
        if (isMounted) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        router.refresh();
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch {
      setUser(null);
      setIsLoading(false);
    }
  }, [router]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Keep the fallback navigation available if Supabase env is missing.
    }

    setUser(null);
    router.refresh();
    router.push("/login");
  };

  const handleGoToLogin = () => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const nextPath = currentPath.startsWith("/login") ? "/" : currentPath;
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  };

  if (isLoading) {
    return (
      <span className="rounded border border-terminal-border bg-terminal-panel px-3 py-2 text-sm text-terminal-muted">
        登录状态...
      </span>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleGoToLogin}
        className="rounded border border-terminal-cyan/40 bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-cyan transition hover:border-terminal-cyan"
      >
        登录
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="max-w-[220px] truncate rounded border border-terminal-border bg-terminal-panel px-3 py-2 text-sm text-terminal-muted">
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded border border-terminal-red/35 bg-terminal-panel px-3 py-2 text-sm text-terminal-red transition hover:border-terminal-red"
      >
        退出登录
      </button>
    </div>
  );
}
