import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  // Fallbacks prevent build-time errors when env vars aren't set.
  // In production these are always real values; middleware blocks unauthenticated access.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
    { auth: { flowType: "pkce" } }
  );
}
