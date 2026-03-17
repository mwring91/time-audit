"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-sm w-full rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-foreground mb-1">Something went wrong</p>
        <p className="text-xs text-muted mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-xl bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
