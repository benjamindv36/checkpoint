"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white/60 backdrop-blur-sm dark:bg-black/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold">
            Waypoint
          </Link>
          <nav className="hidden sm:flex gap-2 text-sm">
            <Link href="/outline" className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Outline
            </Link>
            <Link href="/canvas" className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Canvas
            </Link>
            <Link href="/achievements" className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Achievements
            </Link>
            <Link href="/settings" className="rounded px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
