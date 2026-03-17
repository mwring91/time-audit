"use client";

import { formatDuration, formatTimeRange, getDurationSeconds } from "@/lib/constants";
import type { EntryWithTag } from "@/lib/database.types";

interface EntryCardProps {
  entry: EntryWithTag;
  onTap: (entry: EntryWithTag) => void;
}

export default function EntryCard({ entry, onTap }: EntryCardProps) {
  const durationSecs = getDurationSeconds(entry.started_at, entry.ended_at);
  const isRunning = entry.ended_at === null;

  return (
    <button
      onClick={() => onTap(entry)}
      className="w-full text-left flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-white/5 transition-colors min-h-[56px]"
    >
      {/* Tag colour bar */}
      <span
        className="flex-shrink-0 w-1 h-8 rounded-full"
        style={{ backgroundColor: entry.tags?.colour ?? "#3b82f6" }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{entry.task_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Tag pill */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${entry.tags?.colour ?? "#3b82f6"}28`,
              color: entry.tags?.colour ?? "#3b82f6",
            }}
          >
            {entry.tags?.name ?? "—"}
          </span>
          <span className="text-xs text-muted">{formatTimeRange(entry.started_at, entry.ended_at)}</span>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        {isRunning ? (
          <span className="text-xs font-semibold text-accent">Running</span>
        ) : (
          <span className="text-sm font-semibold text-foreground">{formatDuration(durationSecs)}</span>
        )}
      </div>
    </button>
  );
}
