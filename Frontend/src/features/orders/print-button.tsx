"use client";

import { cn } from "@/lib/cn";

export function PrintButton({ label = "Print receipt", className }: { label?: string; className?: string | undefined }) {
  return (
    <button type="button" className={cn(className ?? "luxury-button-outline", "no-print")} onClick={() => window.print()}>
      {label}
    </button>
  );
}
