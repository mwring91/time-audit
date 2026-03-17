"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatDuration, getDurationSeconds, formatDate, formatTimeRange } from "@/lib/constants";
import type { EntryWithTag, Tag } from "@/lib/database.types";

interface ReviewByDayProps {
  entries: EntryWithTag[];
  tags: Tag[];
  from: Date;
  to: Date;
}

interface DayData {
  dateKey: string;
  date: Date;
  totalSeconds: number;
  tagBreakdown: { tagId: string; tagName: string; colour: string; seconds: number }[];
  entries: EntryWithTag[];
  isEmpty: boolean;
}

function getDaysInRange(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-gray-300">{p.name}</span>
          <span className="text-white font-medium ml-auto pl-4">{formatDuration(Math.round(p.value * 3600))}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-1.5 pt-1.5 flex justify-between">
        <span className="text-gray-400">Total</span>
        <span className="text-white font-semibold">{formatDuration(Math.round(total * 3600))}</span>
      </div>
    </div>
  );
}

export default function ReviewByDay({ entries, tags, from, to }: ReviewByDayProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const days = useMemo(() => getDaysInRange(from, to), [from, to]);

  const dayData = useMemo((): DayData[] => {
    return days.map((date) => {
      const dateKey = date.toLocaleDateString();
      const dayEntries = entries.filter((e) => {
        if (!e.ended_at) return false;
        return new Date(e.started_at).toLocaleDateString() === dateKey;
      });

      const tagMap = new Map<string, { tagName: string; colour: string; seconds: number }>();
      let totalSeconds = 0;

      for (const entry of dayEntries) {
        const secs = getDurationSeconds(entry.started_at, entry.ended_at);
        totalSeconds += secs;

        if (!tagMap.has(entry.tag_id)) {
          tagMap.set(entry.tag_id, {
            tagName: entry.tags?.name ?? "—",
            colour: entry.tags?.colour ?? "#6b7280",
            seconds: 0,
          });
        }
        tagMap.get(entry.tag_id)!.seconds += secs;
      }

      return {
        dateKey,
        date,
        totalSeconds,
        tagBreakdown: Array.from(tagMap.entries()).map(([tagId, v]) => ({ tagId, ...v })),
        entries: dayEntries.sort(
          (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        ),
        isEmpty: dayEntries.length === 0,
      };
    });
  }, [days, entries]);

  // Build chart data — one bar per day, stacked by tag
  const uniqueTagIds = useMemo(() => {
    const ids = new Set<string>();
    entries.forEach((e) => { if (e.ended_at) ids.add(e.tag_id); });
    return Array.from(ids);
  }, [entries]);

  const chartData = dayData.map((d) => {
    const row: Record<string, unknown> = {
      label: d.date.toLocaleDateString([], { weekday: "short", day: "numeric" }),
    };
    for (const tid of uniqueTagIds) {
      const breakdown = d.tagBreakdown.find((t) => t.tagId === tid);
      // Store in hours for chart axis
      row[tid] = breakdown ? breakdown.seconds / 3600 : 0;
    }
    return row;
  });

  const tagById = useMemo(() => {
    const m = new Map<string, Tag>();
    tags.forEach((t) => m.set(t.id, t));
    return m;
  }, [tags]);

  return (
    <div className="space-y-4">
      {/* Stacked bar chart */}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height={Math.max(200, days.length * 28)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                tickFormatter={(v) => `${v}h`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              {uniqueTagIds.map((tagId, i) => {
                const tag = tagById.get(tagId);
                return (
                  <Bar
                    key={tagId}
                    dataKey={tagId}
                    name={tag?.name ?? tagId}
                    stackId="a"
                    fill={tag?.colour ?? "#6b7280"}
                    radius={i === uniqueTagIds.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  >
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={tag?.colour ?? "#6b7280"} />
                    ))}
                  </Bar>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day rows */}
      <div className="space-y-2">
        {[...dayData].reverse().map((day) => {
          const isExpanded = expandedDay === day.dateKey;

          return (
            <div key={day.dateKey} className="rounded-xl border border-border bg-surface overflow-hidden">
              <button
                onClick={() => !day.isEmpty && setExpandedDay(isExpanded ? null : day.dateKey)}
                className={`w-full text-left px-4 py-3 ${!day.isEmpty ? "hover:bg-white/5 cursor-pointer" : "cursor-default"} transition-colors`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {formatDate(day.date)}
                  </span>

                  {day.isEmpty ? (
                    <span className="text-xs text-muted">No entries</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDuration(day.totalSeconds)}
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
                  )}
                </div>

                {/* Tag breakdown pills */}
                {!day.isEmpty && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {day.tagBreakdown.map((t) => (
                      <span
                        key={t.tagId}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${t.colour}28`,
                          color: t.colour,
                        }}
                      >
                        {t.tagName} · {formatDuration(t.seconds)}
                      </span>
                    ))}
                  </div>
                )}
              </button>

              {/* Expanded entry list */}
              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {day.entries.map((entry) => (
                    <div key={entry.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: entry.tags?.colour ?? "#6b7280" }}
                        />
                        <span className="text-xs text-foreground truncate">{entry.task_name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted">
                        <span>{formatTimeRange(entry.started_at, entry.ended_at)}</span>
                        <span className="font-medium text-foreground">
                          {formatDuration(getDurationSeconds(entry.started_at, entry.ended_at))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
