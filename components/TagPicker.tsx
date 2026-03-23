"use client";

import type { Tag } from "@/lib/database.types";

interface TagPickerProps {
  tags: Tag[];
  selectedId: string | null;
  onSelect: (tagId: string) => void;
}

function TagPill({ tag, selected, onSelect }: { tag: Tag; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tag.id)}
      className="rounded-full px-3 py-1 text-xs font-medium transition-all"
      style={{
        backgroundColor: selected ? tag.colour : `${tag.colour}28`,
        border: `1px solid ${selected ? tag.colour : `${tag.colour}60`}`,
        color: selected ? "#fff" : tag.colour,
      }}
    >
      {tag.name}
    </button>
  );
}

export default function TagPicker({ tags, selectedId, onSelect }: TagPickerProps) {
  if (tags.length === 0) {
    return (
      <p className="text-xs text-muted">
        No tags yet — <a href="/tags" className="text-accent hover:underline">create one</a> first.
      </p>
    );
  }

  const workTags = tags.filter((t) => t.category === "work");
  const personalTags = tags.filter((t) => t.category === "personal");
  const hasGroups = workTags.length > 0 && personalTags.length > 0;

  if (!hasGroups) {
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} selected={tag.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workTags.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Work</p>
          <div className="flex flex-wrap gap-2">
            {workTags.map((tag) => (
              <TagPill key={tag.id} tag={tag} selected={tag.id === selectedId} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
      {personalTags.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Personal</p>
          <div className="flex flex-wrap gap-2">
            {personalTags.map((tag) => (
              <TagPill key={tag.id} tag={tag} selected={tag.id === selectedId} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
