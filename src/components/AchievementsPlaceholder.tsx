"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";

type Achievement = {
  id: string;
  text?: string;
  points?: number;
  completed_at?: string | null;
};

export default function AchievementsPlaceholder() {
  const [items, setItems] = useState<Achievement[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const client = getSupabaseClient();
        if (!client) {
          // Supabase not configured — return empty list but don't throw.
          setItems([]);
          return;
        }

        const { data, error } = await client
          .from("achievement_log")
          .select("*")
          .limit(20)
          .order("completed_at", { ascending: false });

        if (error) {
          console.warn("Supabase fetch error:", error.message);
          setItems([]);
        } else if (mounted) {
          setItems((data as Achievement[]) || []);
        }
      } catch (e) {
        console.warn("Fetch failed", e);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-semibold">Achievements (Placeholder)</h2>
      <div className="rounded border p-4">
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : items && items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between rounded bg-zinc-50 p-3">
                <div>
                  <div className="font-medium">{it.text || "(no text)"}</div>
                  <div className="text-sm text-zinc-500">{it.completed_at || "—"}</div>
                </div>
                <div className="ml-4 font-semibold">+{it.points ?? 0}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-zinc-600">No achievements found in `achievement_log`. You can seed data via Supabase or local migration utilities.</div>
        )}
      </div>
    </section>
  );
}
