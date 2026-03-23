"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useTags } from "@/lib/hooks/useTags";
import { TAG_COLOURS } from "@/lib/constants";
import type { Tag } from "@/lib/database.types";

function TagRow({ tag, onRename, onDelete, onRecolour, onRecategorise }: {
  tag: Tag;
  onRename: (id: string, name: string) => Promise<{ error: string | undefined }>;
  onDelete: (id: string) => Promise<{ error: string | undefined }>;
  onRecolour: (id: string, colour: string) => Promise<{ error: string | undefined }>;
  onRecategorise: (id: string, category: "work" | "personal") => Promise<{ error: string | undefined }>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tag.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showColours, setShowColours] = useState(false);
  const colourRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColours) return;
    function handleClick(e: MouseEvent) {
      if (colourRef.current && !colourRef.current.contains(e.target as Node)) {
        setShowColours(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColours]);

  async function save() {
    if (!value.trim() || value.trim() === tag.name) {
      setValue(tag.name);
      setEditing(false);
      return;
    }
    setSaving(true);
    await onRename(tag.id, value.trim());
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await onDelete(tag.id);
    setDeleting(false);
    if (result.error) setDeleteError(result.error);
  }

  async function handleRecolour(colour: string) {
    setShowColours(false);
    await onRecolour(tag.id, colour);
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 min-h-[56px]">
      <div className="flex items-center gap-3">
        {/* Colour swatch — click to open picker */}
        <div ref={colourRef} className="relative flex-shrink-0">
          <button
            onClick={() => setShowColours((v) => !v)}
            className="w-5 h-5 rounded-full ring-2 ring-offset-2 ring-offset-surface ring-transparent hover:ring-border transition-all"
            style={{ backgroundColor: tag.colour }}
            aria-label="Change colour"
          />
          {showColours && (
            <div className="absolute left-0 top-7 z-10 flex gap-2 p-2 rounded-xl border border-border bg-surface shadow-lg">
              {TAG_COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleRecolour(c)}
                  className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: c === tag.colour ? "2px solid white" : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          )}
        </div>

        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setValue(tag.name); setEditing(false); }
            }}
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-accent"
            disabled={saving}
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-foreground">{tag.name}</span>
        )}

        {!editing && (
          <>
            <button
              onClick={() => onRecategorise(tag.id, tag.category === "work" ? "personal" : "work")}
              className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1"
              title={`Move to ${tag.category === "work" ? "personal" : "work"}`}
            >
              {tag.category === "work" ? "Personal" : "Work"}
            </button>
            <button
              onClick={() => { setEditing(true); setDeleteError(null); }}
              className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1"
            >
              Rename
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-muted hover:text-red-400 transition-colors px-2 py-1 disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
        {editing && saving && (
          <span className="text-xs text-muted">Saving…</span>
        )}
      </div>
      {deleteError && (
        <p className="mt-1.5 text-xs text-red-400 pl-8">{deleteError}</p>
      )}
    </div>
  );
}

export default function TagsPage() {
  const { tags, createTag, renameTag, deleteTag, recolourTag, recategoriseTag, isLoading } = useTags();
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<"work" | "personal">("work");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setCreating(true);
    setError(null);
    const result = await createTag(newTagName.trim(), newTagCategory);
    setCreating(false);
    if (result.error) {
      setError(result.error);
    } else {
      setNewTagName("");
    }
  }

  const workTags = tags.filter((t) => t.category === "work");
  const personalTags = tags.filter((t) => t.category === "personal");

  return (
    <main
      className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Tags</h1>
        <p className="mt-1 text-sm text-muted">
          Tags group your time entries. Every entry needs one.
        </p>
      </div>

      {/* Add new tag */}
      <form onSubmit={handleCreate} className="space-y-2 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name…"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={creating || !newTagName.trim()}
            className="btn-primary rounded-xl disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {creating ? "Adding…" : "Add"}
          </button>
        </div>
        <div className="flex rounded-xl border border-border bg-surface p-1 gap-1">
          {(["work", "personal"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setNewTagCategory(cat)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors capitalize ${
                newTagCategory === cat
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      {/* Tag list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted">No tags yet</p>
          <p className="mt-1 text-xs text-muted">Add your first tag above to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(newTagCategory === "work" ? workTags : personalTags).map((tag) => (
            <TagRow key={tag.id} tag={tag} onRename={renameTag} onDelete={deleteTag} onRecolour={recolourTag} onRecategorise={recategoriseTag} />
          ))}
          {(newTagCategory === "work" ? workTags : personalTags).length === 0 && (
            <p className="py-6 text-center text-sm text-muted">No {newTagCategory} tags yet</p>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        Renaming a tag updates all historical entries automatically.
      </p>
    </main>
  );
}
