"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { EntryWithTag } from "@/lib/database.types";

export function useTimer() {
  const [runningEntry, setRunningEntry] = useState<EntryWithTag | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = createClient();

  const startTick = useCallback((startedAt: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setElapsedSeconds(elapsed);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, []);

  const stopTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsedSeconds(0);
  }, []);

  // Load running entry on mount
  useEffect(() => {
    async function loadRunningEntry() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data } = await supabase
        .from("entries")
        .select("*, tags(*)")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .single();

      if (data) {
        const entry = data as unknown as EntryWithTag;
        setRunningEntry(entry);
        startTick(entry.started_at);
      }
      setIsLoading(false);
    }
    loadRunningEntry();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription
  useEffect(() => {
    let userId: string | null = null;

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel("timer-entries")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "entries",
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const row = payload.new as EntryWithTag;
            if (row.ended_at === null) {
              // Fetch with tag data
              const { data } = await supabase
                .from("entries")
                .select("*, tags(*)")
                .eq("id", row.id)
                .single();
              if (data) {
                const entry = data as unknown as EntryWithTag;
                setRunningEntry(entry);
                startTick(entry.started_at);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "entries",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as EntryWithTag;
            if (row.ended_at !== null) {
              setRunningEntry((prev) => {
                if (prev?.id === row.id) {
                  stopTick();
                  return null;
                }
                return prev;
              });
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
      stopTick();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startTimer = useCallback(async (taskName: string, tagId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const startedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("entries")
      .insert({ task_name: taskName, tag_id: tagId, started_at: startedAt, user_id: user.id })
      .select("*, tags(*)")
      .single();

    if (error) return { error: error.message };
    setRunningEntry(data as unknown as EntryWithTag);
    startTick(startedAt);
    return { data };
  }, [supabase, startTick]);

  const stopTimer = useCallback(async () => {
    if (!runningEntry) return;
    const endedAt = new Date().toISOString();
    const { error } = await supabase
      .from("entries")
      .update({ ended_at: endedAt })
      .eq("id", runningEntry.id);

    if (!error) {
      stopTick();
      setRunningEntry(null);
    }
    return { error: error?.message };
  }, [runningEntry, supabase, stopTick]);

  return { runningEntry, elapsedSeconds, startTimer, stopTimer, isLoading };
}
