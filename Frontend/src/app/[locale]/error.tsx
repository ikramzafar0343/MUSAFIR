"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      <h1 className="text-2xl tracking-[0.16em] uppercase">Something went wrong</h1>
      <p className="mt-4 text-text-sub">
        Please try again or continue shopping. If this continues, write to support.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 border border-current px-6 py-3 text-sm tracking-[0.12em] uppercase"
      >
        Retry
      </button>
    </div>
  );
}
