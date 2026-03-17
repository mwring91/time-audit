"use client";

import { useState, useEffect } from "react";
import Sheet from "./Sheet";
import TaskInput from "./TaskInput";
import TagPicker from "./TagPicker";
import { toDateInputValue, toTimeInputValue } from "@/lib/constants";
import type { Tag, EntryWithTag } from "@/lib/database.types";

interface ManualEntryFormProps {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
  lastEntryToday: EntryWithTag | null;
  onSubmit: (data: { task_name: string; tag_id: string; started_at: string; ended_at: string }) => Promise<void>;
}

export default function ManualEntryForm({ open, onClose, tags, lastEntryToday, onSubmit }: ManualEntryFormProps) {
  const [taskName, setTaskName] = useState("");
  const [tagId, setTagId] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState(toTimeInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill start time when opening
  useEffect(() => {
    if (open) {
      const now = new Date();
      setDate(toDateInputValue(now));
      setEndTime(toTimeInputValue(now));

      if (lastEntryToday?.ended_at) {
        setStartTime(toTimeInputValue(new Date(lastEntryToday.ended_at)));
      } else {
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
        setStartTime(toTimeInputValue(thirtyMinsAgo));
      }

      // Keep previous selections for repeat entries
      if (!taskName) setTagId(tags[0]?.id ?? "");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim() || !tagId || !date || !startTime || !endTime) return;
    setError(null);

    const startedAt = new Date(`${date}T${startTime}`).toISOString();
    const endedAt = new Date(`${date}T${endTime}`).toISOString();

    if (new Date(endedAt) <= new Date(startedAt)) {
      setError("End time must be after start time");
      return;
    }

    setSaving(true);
    await onSubmit({ task_name: taskName.trim(), tag_id: tagId, started_at: startedAt, ended_at: endedAt });
    setSaving(false);
    setTaskName("");
    setError(null);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log manually">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Task name</label>
          <TaskInput value={taskName} onChange={setTaskName} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Tag</label>
          <TagPicker tags={tags} selectedId={tagId} onSelect={setTagId} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !taskName.trim() || !tagId || !startTime || !endTime}
          className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {saving ? "Saving…" : "Log entry"}
        </button>
      </form>
    </Sheet>
  );
}
