"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useTimer } from "@/lib/hooks/useTimer";
import { useTags } from "@/lib/hooks/useTags";
import { useEntries } from "@/lib/hooks/useEntries";
import TimerBar from "@/components/TimerBar";
import TaskInput from "@/components/TaskInput";
import TagPicker from "@/components/TagPicker";
import EntryList from "@/components/EntryList";
import EditSheet from "@/components/EditSheet";
import ManualEntryForm from "@/components/ManualEntryForm";
import type { EntryWithTag } from "@/lib/database.types";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { from: start, to: end };
}

export default function HomePage() {
  const [taskName, setTaskName] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [editEntry, setEditEntry] = useState<EntryWithTag | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const todayRange = useMemo(getTodayRange, []);
  const { runningEntry, elapsedSeconds, startTimer, stopTimer } = useTimer();
  const { tags } = useTags();
  const { entries, isLoading, updateEntry, deleteEntry, createEntry } = useEntries(todayRange);

  const todayEntries = entries.filter((e) => e.ended_at !== null || e.id === runningEntry?.id);
  const lastEntryToday = entries.find((e) => e.ended_at !== null) ?? null;

  async function handleStart() {
    if (!taskName.trim() || !selectedTagId) return;
    setStarting(true);
    setStartError(null);
    const result = await startTimer(taskName.trim(), selectedTagId);
    setStarting(false);
    if (result?.error) {
      setStartError(
        result.error.includes("unique")
          ? "A timer is already running — stop it first"
          : result.error
      );
    } else {
      setTaskName("");
    }
  }

  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main
      className="flex flex-col min-h-screen"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      {runningEntry && (
        <TimerBar
          runningEntry={runningEntry}
          elapsedSeconds={elapsedSeconds}
          onStop={stopTimer}
        />
      )}

      <div className="flex-1 px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Start new entry card */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <TaskInput
            value={taskName}
            onChange={setTaskName}
            placeholder="What are you working on?"
          />

          <TagPicker tags={tags} selectedId={selectedTagId} onSelect={setSelectedTagId} />

          {startError && <p className="text-xs text-red-400">{startError}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={starting || !taskName.trim() || !selectedTagId || !!runningEntry}
              className="flex-1 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              {starting ? "Starting…" : "Start timer"}
            </button>

            <button
              onClick={() => setShowManual(true)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Log manually
            </button>
          </div>
        </div>

        {/* Today's entries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{today}</h2>
            {todayEntries.length > 0 && (
              <span className="text-xs text-muted">
                {todayEntries.length} {todayEntries.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
          <EntryList
            entries={todayEntries}
            isLoading={isLoading}
            onTapEntry={(entry) => setEditEntry(entry)}
          />
        </div>
      </div>

      <EditSheet
        entry={editEntry}
        tags={tags}
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        onSave={async (id, data) => { await updateEntry(id, data); }}
        onDelete={async (id) => { await deleteEntry(id); }}
      />

      <ManualEntryForm
        open={showManual}
        onClose={() => setShowManual(false)}
        tags={tags}
        lastEntryToday={lastEntryToday}
        onSubmit={async (data) => { await createEntry(data); }}
      />
    </main>
  );
}
