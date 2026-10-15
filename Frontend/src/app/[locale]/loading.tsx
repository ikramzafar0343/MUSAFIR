export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center pt-28" aria-busy="true" aria-live="polite">
      <div className="h-10 w-10 animate-pulse rounded-full border border-brand-accent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
