import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Missing Supabase env should not break the research dashboard shell.
  }

  redirect("/login");
}

export default async function AuthButton() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return (
        <Link
          href="/login"
          className="rounded border border-terminal-cyan/40 bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-cyan transition hover:border-terminal-cyan"
        >
          登录
        </Link>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="max-w-[220px] truncate rounded border border-terminal-border bg-terminal-panel px-3 py-2 text-sm text-terminal-muted">
          {user.email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-terminal-red/35 bg-terminal-panel px-3 py-2 text-sm text-terminal-red transition hover:border-terminal-red"
          >
            退出登录
          </button>
        </form>
      </div>
    );
  } catch {
    return (
      <Link
        href="/login"
        className="rounded border border-terminal-cyan/40 bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-cyan transition hover:border-terminal-cyan"
      >
        登录
      </Link>
    );
  }
}
