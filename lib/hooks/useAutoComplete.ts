"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export function useAutoComplete() {
  const [recentTasks, setRecentTasks] = useState<string[]>([]);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch recent entries, deduplicate task names
    const { data } = await supabase
      .from("entries")
      .select("task_name")
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(200);

    if (!data) return;

    const rows = data as { task_name: string }[];
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const row of rows) {
      if (!seen.has(row.task_name)) {
        seen.add(row.task_name);
        unique.push(row.task_name);
        if (unique.length >= 20) break;
      }
    }
    setRecentTasks(unique);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getSuggestions = useCallback(
    (query: string): string[] => {
      if (!query.trim()) return recentTasks.slice(0, 8);
      const q = query.toLowerCase();
      return recentTasks.filter((t) => t.toLowerCase().includes(q)).slice(0, 8);
    },
    [recentTasks]
  );

  return { getSuggestions, refresh };
}
