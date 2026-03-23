"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { getNextTagColour } from "@/lib/constants";
import type { Tag } from "@/lib/database.types";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTags() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setTags((data as Tag[]) ?? []);
      setIsLoading(false);
    }
    loadTags();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription
  useEffect(() => {
    let userId: string | null = null;

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel("tags-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tags", filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setTags((prev) => [...prev, payload.new as Tag]);
            } else if (payload.eventType === "UPDATE") {
              setTags((prev) =>
                prev.map((t) => (t.id === payload.new.id ? (payload.new as Tag) : t))
              );
            } else if (payload.eventType === "DELETE") {
              setTags((prev) => prev.filter((t) => t.id !== payload.old.id));
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

  const createTag = useCallback(async (name: string, category: "work" | "personal" = "work") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const colour = getNextTagColour(tags.length);
    const { data, error } = await supabase
      .from("tags")
      .insert({ name: name.trim(), colour, category, user_id: user.id })
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  }, [supabase, tags.length]);

  const renameTag = useCallback(async (id: string, newName: string) => {
    const { error } = await supabase
      .from("tags")
      .update({ name: newName.trim() })
      .eq("id", id);
    return { error: error?.message };
  }, [supabase]);

  const deleteTag = useCallback(async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) {
      return { error: error.code === "23503" ? "Tag is in use and can't be deleted" : error.message };
    }
    return { error: undefined };
  }, [supabase]);

  const recolourTag = useCallback(async (id: string, colour: string) => {
    const { error } = await supabase.from("tags").update({ colour }).eq("id", id);
    return { error: error?.message };
  }, [supabase]);

  const recategoriseTag = useCallback(async (id: string, category: "work" | "personal") => {
    const { error } = await supabase.from("tags").update({ category }).eq("id", id);
    return { error: error?.message };
  }, [supabase]);

  return { tags, createTag, renameTag, deleteTag, recolourTag, recategoriseTag, isLoading };
}
