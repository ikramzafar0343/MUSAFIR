"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
          <h1 className="text-2xl tracking-[0.16em] uppercase">Something went wrong</h1>
          <p className="mt-4 text-neutral-600">
            Please try again. If this continues, refresh the page or write to support.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 border border-neutral-900 px-6 py-3 text-sm tracking-[0.12em] uppercase"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
