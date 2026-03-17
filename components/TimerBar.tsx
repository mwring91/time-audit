"use client";

import { formatElapsed } from "@/lib/constants";
import type { EntryWithTag } from "@/lib/database.types";

interface TimerBarProps {
  runningEntry: EntryWithTag;
  elapsedSeconds: number;
  onStop: () => void;
}

export default function TimerBar({ runningEntry, elapsedSeconds, onStop }: TimerBarProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-accent/10 border-b border-accent/20">
      <div className="flex items-center gap-2 min-w-0">
        {/* Tag colour dot */}
        <span
          className="flex-shrink-0 w-2 h-2 rounded-full"
          style={{ backgroundColor: runningEntry.tags?.colour ?? "#3b82f6" }}
        />
        <span className="truncate text-sm font-medium text-foreground">
          {runningEntry.task_name}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-mono text-sm font-semibold text-accent tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </span>
        <button
          onClick={onStop}
          className="rounded-lg bg-accent hover:bg-accent-hover px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
