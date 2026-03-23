"use client";

import { useState, useEffect } from "react";
import Sheet from "./Sheet";
import TagPicker from "./TagPicker";
import { toDateInputValue, toTimeInputValue } from "@/lib/constants";
import type { EntryWithTag, Tag } from "@/lib/database.types";

interface EditSheetProps {
  entry: EntryWithTag | null;
  tags: Tag[];
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: { task_name: string; tag_id: string; started_at: string; ended_at: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EditSheet({ entry, tags, open, onClose, onSave, onDelete }: EditSheetProps) {
  const [taskName, setTaskName] = useState("");
  const [tagId, setTagId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (entry) {
      setTaskName(entry.task_name);
      setTagId(entry.tag_id);
      const start = new Date(entry.started_at);
      setDate(toDateInputValue(start));
      setStartTime(toTimeInputValue(start));
      if (entry.ended_at) {
        setEndTime(toTimeInputValue(new Date(entry.ended_at)));
      } else {
        setEndTime(toTimeInputValue(new Date()));
      }
      setConfirmDelete(false);
    }
  }, [entry]);

  async function handleSave() {
    if (!entry || !taskName.trim() || !tagId || !date || !startTime) return;
    setSaving(true);

    const startedAt = new Date(`${date}T${startTime}`).toISOString();
    const endedAt = endTime ? new Date(`${date}T${endTime}`).toISOString() : null;

    await onSave(entry.id, { task_name: taskName.trim(), tag_id: tagId, started_at: startedAt, ended_at: endedAt });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!entry) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await onDelete(entry.id);
    setDeleting(false);
    setConfirmDelete(false);
    onClose();
  }

  return (
    <Sheet open={open} onClose={() => { setConfirmDelete(false); onClose(); }} title="Edit entry">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Task name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Tag</label>
          <TagPicker tags={tags} selectedId={tagId} onSelect={setTagId} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <label className="block text-xs font-medium text-muted mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !taskName.trim() || !tagId}
            className="btn-primary flex-1 rounded-xl disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              confirmDelete
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "border border-border text-red-400 hover:bg-red-400/10"
            }`}
          >
            {deleting ? "Deleting…" : confirmDelete ? "Confirm" : "Delete"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
