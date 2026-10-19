import type { ReactNode } from "react";

type IconProps = { className?: string | undefined };

function Svg({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconOverview({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="10" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}

export function IconInventory({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 8h14l-1 11H6L5 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconOrders({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8h4M10 12h4M10 16h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconStorefront({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 10h16v9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 10l2-5h12l2 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPromos({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12l7-7h7v7l-7 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
    </Svg>
  );
}

export function IconSignOut({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 5H6v14h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 12h9M16 8l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const ADMIN_NAV_ICONS = {
  overview: IconOverview,
  inventory: IconInventory,
  orders: IconOrders,
  storefront: IconStorefront,
  promos: IconPromos,
} as const;
