"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/generate", label: "Generate" },
  { href: "/bank", label: "Question Bank" },
  { href: "/papers", label: "Papers" },
  { href: "/documents", label: "Documents" },
  { href: "/settings", label: "Settings" },
];

export default function Nav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold text-[var(--primary)]">
            AI Question Generator
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-[var(--primary)] text-white" : "text-[var(--foreground)] hover:bg-[#eef0f6]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[var(--muted)] sm:inline">{userName}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-2 py-1.5 sm:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-md px-3 py-1 text-sm">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
