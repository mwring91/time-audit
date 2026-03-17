"use client";

import EntryCard from "./EntryCard";
import type { EntryWithTag } from "@/lib/database.types";

interface EntryListProps {
  entries: EntryWithTag[];
  isLoading: boolean;
  onTapEntry: (entry: EntryWithTag) => void;
}

export default function EntryList({ entries, isLoading, onTapEntry }: EntryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted">No entries today yet</p>
        <p className="mt-1 text-xs text-muted">Start a timer or log manually to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onTap={onTapEntry} />
      ))}
    </div>
  );
}
