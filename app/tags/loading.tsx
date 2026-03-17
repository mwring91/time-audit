export default function Loading() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto w-full space-y-4">
      <div className="h-7 w-16 rounded-lg bg-surface border border-border animate-pulse" />
      <div className="h-10 rounded-xl bg-surface border border-border animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
      ))}
    </div>
  );
}
