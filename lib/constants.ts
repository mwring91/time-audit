export const TAG_COLOURS = [
  "#6b8cba", // Slate blue
  "#c9933a", // Amber
  "#6a9e7f", // Sage green
  "#b87a85", // Dusty rose
  "#8b7ab8", // Muted violet
  "#5a9ea0", // Steel teal
  "#a89060", // Warm sand
  "#b06b55", // Terracotta
] as const;

export function getNextTagColour(existingCount: number): string {
  return TAG_COLOURS[existingCount % TAG_COLOURS.length];
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatTimeRange(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt);
  const startStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!endedAt) return `${startStr} – running`;
  const end = new Date(endedAt);
  const endStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${startStr} – ${endStr}`;
}

export function getDurationSeconds(startedAt: string, endedAt: string | null): number {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.floor((end - start) / 1000);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toTimeInputValue(date: Date): string {
  return date.toTimeString().slice(0, 5);
}
