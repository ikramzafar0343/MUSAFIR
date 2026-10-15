import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-2" htmlFor={inputId}>
      <span className="font-[family-name:var(--font-ui)] text-[11px] tracking-[0.2em] uppercase text-text-sub">
        {label}
      </span>
      <input
        id={inputId}
        className={cn(
          "border border-brand-border bg-brand-white px-4 py-3 text-sm text-text-main outline-none focus-visible:border-brand-accent",
          className,
        )}
        {...props}
      />
      {error ? (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
