"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { EntryWithTag } from "@/lib/database.types";

interface DateRange {
  from: Date;
  to: Date;
}

export function useEntries(dateRange: DateRange) {
  const [entries, setEntries] = useState<EntryWithTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;

  const fetchEntries = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const from = dateRangeRef.current.from.toISOString();
    const to = new Date(dateRangeRef.current.to);
    to.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("entries")
      .select("*, tags(*)")
      .eq("user_id", user.id)
      .gte("started_at", from)
      .lte("started_at", to.toISOString())
      .order("started_at", { ascending: false });

    setEntries((data as EntryWithTag[]) ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    setIsLoading(true);
    fetchEntries();
  }, [fetchEntries, dateRange.from.toISOString(), dateRange.to.toISOString()]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription
  useEffect(() => {
    let userId: string | null = null;

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel("entries-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "entries", filter: `user_id=eq.${userId}` },
          async (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              // Fetch with tag data since realtime payloads don't include joins
              const { data } = await supabase
                .from("entries")
                .select("*, tags(*)")
                .eq("id", payload.new.id)
                .single();

              if (!data) return;
              const entry = data as EntryWithTag;

              setEntries((prev) => {
                const exists = prev.find((e) => e.id === entry.id);
                if (exists) {
                  return prev
                    .map((e) => (e.id === entry.id ? entry : e))
                    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
                }
                return [entry, ...prev].sort(
                  (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
                );
              });
            } else if (payload.eventType === "DELETE") {
              setEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return channel;
    }

    let channel: Awaited<ReturnType<typeof subscribe>> | undefined;
    subscribe().then((ch) => { channel = ch; });

    return () => {
      if (channel) supabase.removeChannel(channel as ReturnType<typeof supabase.channel>);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createEntry = useCallback(async (data: {
    task_name: string;
    tag_id: string;
    started_at: string;
    ended_at: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: result, error } = await supabase
      .from("entries")
      .insert({ ...data, user_id: user.id })
      .select("*, tags(*)")
      .single();

    if (error) return { error: error.message };

    const entry = result as EntryWithTag;
    setEntries((prev) =>
      [entry, ...prev].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    );

    return { data: result };
  }, [supabase]);

  const updateEntry = useCallback(async (id: string, data: {
    task_name?: string;
    tag_id?: string;
    started_at?: string;
    ended_at?: string | null;
  }) => {
    const { error } = await supabase.from("entries").update(data).eq("id", id);
    return { error: error?.message };
  }, [supabase]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    return { error: error?.message };
  }, [supabase]);

  return { entries, createEntry, updateEntry, deleteEntry, isLoading, refetch: fetchEntries };
}
