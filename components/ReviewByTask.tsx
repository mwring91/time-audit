"use client";

import { useState, useMemo } from "react";
import { formatDuration, getDurationSeconds, formatDate, formatTimeRange } from "@/lib/constants";
import type { EntryWithTag, Tag } from "@/lib/database.types";

interface ReviewByTaskProps {
  entries: EntryWithTag[];
  tags: Tag[];
  onTapEntry: (entry: EntryWithTag) => void;
}

interface TaskGroup {
  taskName: string;
  totalSeconds: number;
  tagId: string;
  tagName: string;
  tagColour: string;
  dayBreakdown: { date: string; seconds: number }[];
}

export default function ReviewByTask({ entries, tags, onTapEntry }: ReviewByTaskProps) {
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const taskGroups = useMemo(() => {
    const map = new Map<string, TaskGroup>();

    for (const entry of entries) {
      if (!entry.ended_at) continue;
      if (filterTagId && entry.tag_id !== filterTagId) continue;

      const secs = getDurationSeconds(entry.started_at, entry.ended_at);
      const dateKey = new Date(entry.started_at).toLocaleDateString();

      if (!map.has(entry.task_name)) {
        map.set(entry.task_name, {
          taskName: entry.task_name,
          totalSeconds: 0,
          tagId: entry.tag_id,
          tagName: entry.tags?.name ?? "—",
          tagColour: entry.tags?.colour ?? "#6b7280",
          dayBreakdown: [],
        });
      }

      const group = map.get(entry.task_name)!;
      group.totalSeconds += secs;

      const existing = group.dayBreakdown.find((d) => d.date === dateKey);
      if (existing) {
        existing.seconds += secs;
      } else {
        group.dayBreakdown.push({ date: dateKey, seconds: secs });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [entries, filterTagId]);

  const maxSeconds = taskGroups[0]?.totalSeconds ?? 1;
  const totalSeconds = taskGroups.reduce((s, g) => s + g.totalSeconds, 0);

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTagId(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterTagId === null
              ? "bg-accent text-white"
              : "border border-border text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setFilterTagId(tag.id === filterTagId ? null : tag.id)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              backgroundColor: tag.id === filterTagId ? tag.colour : `${tag.colour}28`,
              border: `1px solid ${tag.id === filterTagId ? tag.colour : `${tag.colour}60`}`,
              color: tag.id === filterTagId ? "#fff" : tag.colour,
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Total */}
      {taskGroups.length > 0 && (
        <p className="text-xs text-muted">
          {taskGroups.length} tasks · {formatDuration(totalSeconds)} total
        </p>
      )}

      {/* Task list */}
      {taskGroups.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted">No entries in this range</p>
        </div>
      ) : (
        <div className="space-y-2">
          {taskGroups.map((group) => {
            const pct = Math.round((group.totalSeconds / maxSeconds) * 100);
            const isExpanded = expandedTask === group.taskName;

            return (
              <div key={group.taskName} className="rounded-xl border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setExpandedTask(isExpanded ? null : group.taskName)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: group.tagColour }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">
                        {group.taskName}
                      </span>
                      <span
                        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${group.tagColour}28`,
                          color: group.tagColour,
                        }}
                      >
                        {group.tagName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDuration(group.totalSeconds)}
                      </span>
                      <svg
                        width="14" height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Inline proportion bar */}
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: group.tagColour }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    {Math.round((group.totalSeconds / totalSeconds) * 100)}% of total
                  </p>
                </button>

                {/* Individual entries */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {entries
                      .filter((e) => e.task_name === group.taskName && e.ended_at)
                      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                      .map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => onTapEntry(entry)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                        >
                          <span className="text-xs text-muted">
                            {formatDate(new Date(entry.started_at))} · {formatTimeRange(entry.started_at, entry.ended_at)}
                          </span>
                          <span className="text-xs font-medium text-foreground ml-3 flex-shrink-0">
                            {formatDuration(getDurationSeconds(entry.started_at, entry.ended_at))}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
