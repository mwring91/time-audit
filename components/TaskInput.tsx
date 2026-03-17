"use client";

import { useState, useRef, useEffect } from "react";
import { useAutoComplete } from "@/lib/hooks/useAutoComplete";

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function TaskInput({ value, onChange, placeholder = "What are you working on?", autoFocus }: TaskInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { getSuggestions, refresh } = useAutoComplete();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = getSuggestions(value);

  // Refresh autocomplete after new entries
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[activeIndex]);
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface z-10 overflow-hidden shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                // Use onMouseDown to fire before onBlur
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-accent/10 text-accent"
                    : "text-foreground hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
