"use client";

export default function OutlinePlaceholder() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-semibold">Outline (Placeholder)</h2>
      <div className="rounded border border-dashed p-6">
        <p className="text-zinc-600 dark:text-zinc-400">
          This is a placeholder for the nested outline view. The real outline will
          show Directions, Waypoints and Steps in a hierarchical list with
          connections. For now this demonstrates layout and responsive sizing.
        </p>

        <ul className="mt-6 space-y-3">
          <li className="rounded bg-zinc-50 p-3">Direction: Build MVP</li>
          <li className="ml-4 rounded bg-zinc-50 p-3">Waypoint: Design UI</li>
          <li className="ml-8 rounded bg-zinc-50 p-3">Step: Create skeleton</li>
        </ul>
      </div>
    </section>
  );
}
