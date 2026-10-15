import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center border px-10 py-4 font-[family-name:var(--font-brand)] text-[11px] font-semibold tracking-[0.3em] uppercase transition-colors duration-500 rounded-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-brand-primary bg-brand-primary text-brand-white hover:bg-transparent hover:text-brand-primary",
        outline:
          "border-brand-primary bg-brand-white text-brand-primary hover:bg-brand-primary hover:text-brand-white",
        accent:
          "border-brand-accent bg-brand-accent text-brand-white hover:border-brand-primary hover:bg-brand-primary",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
