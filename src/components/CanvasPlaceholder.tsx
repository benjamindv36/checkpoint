"use client";

export default function CanvasPlaceholder() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-semibold">Canvas (Placeholder)</h2>
      <div className="h-[56vh] min-h-[200px] w-full rounded border bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm dark:from-black dark:to-zinc-900">
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg font-medium">ReactFlow canvas placeholder</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Nodes and connections will appear here.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
