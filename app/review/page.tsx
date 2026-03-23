"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import dynamicImport from "next/dynamic";
import { useEntries } from "@/lib/hooks/useEntries";
import { useTags } from "@/lib/hooks/useTags";
import ReviewByTask from "@/components/ReviewByTask";
import EditSheet from "@/components/EditSheet";
import { toDateInputValue } from "@/lib/constants";
import type { EntryWithTag } from "@/lib/database.types";

// Recharts uses window — must be SSR-disabled
const ReviewByDay = dynamicImport(() => import("@/components/ReviewByDay"), { ssr: false });

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 13);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export default function ReviewPage() {
  const defaults = useMemo(getDefaultRange, []);
  const [fromStr, setFromStr] = useState(toDateInputValue(defaults.from));
  const [toStr, setToStr] = useState(toDateInputValue(defaults.to));
  const [view, setView] = useState<"task" | "day">("task");
  const [category, setCategory] = useState<"all" | "work" | "personal">("all");

  const dateRange = useMemo(() => ({
    from: new Date(fromStr),
    to: new Date(toStr + "T23:59:59"),
  }), [fromStr, toStr]);

  const { entries, isLoading, updateEntry, deleteEntry } = useEntries(dateRange);
  const { tags } = useTags();
  const [editEntry, setEditEntry] = useState<EntryWithTag | null>(null);

  const filteredEntries = useMemo(() =>
    category === "all" ? entries : entries.filter((e) => e.tags?.category === category),
    [entries, category]
  );

  return (
    <main
      className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">Review</h1>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="date"
          value={fromStr}
          onChange={(e) => setFromStr(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
        />
        <span className="text-xs text-muted flex-shrink-0">to</span>
        <input
          type="date"
          value={toStr}
          onChange={(e) => setToStr(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
        />
      </div>

      {/* Category toggle */}
      <div className="flex rounded-xl border border-border bg-surface p-1 mb-3 gap-1">
        {(["all", "work", "personal"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors capitalize ${
              category === cat
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex rounded-xl border border-border bg-surface p-1 mb-5 gap-1">
        {(["task", "day"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors capitalize ${
              view === v
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            By {v}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : view === "task" ? (
        <ReviewByTask entries={filteredEntries} tags={tags} onTapEntry={setEditEntry} />
      ) : (
        <ReviewByDay entries={filteredEntries} tags={tags} from={dateRange.from} to={dateRange.to} />
      )}
      <EditSheet
        entry={editEntry}
        tags={tags}
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        onSave={async (id, data) => { await updateEntry(id, data); }}
        onDelete={async (id) => { await deleteEntry(id); }}
      />
    </main>
  );
}
