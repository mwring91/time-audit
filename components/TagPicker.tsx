"use client";

import type { Tag } from "@/lib/database.types";

interface TagPickerProps {
  tags: Tag[];
  selectedId: string | null;
  onSelect: (tagId: string) => void;
}

export default function TagPicker({ tags, selectedId, onSelect }: TagPickerProps) {
  if (tags.length === 0) {
    return (
      <p className="text-xs text-muted">
        No tags yet — <a href="/tags" className="text-accent hover:underline">create one</a> first.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = tag.id === selectedId;
        return (
          <button
            key={tag.id}
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
      })}
    </div>
  );
}
