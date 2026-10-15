type IconProps = {
  className?: string | undefined;
};

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeart({ className }: IconProps) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconBag({ className }: IconProps) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg className={className} width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg className={className} width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg className={className} width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 7V5h4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFile({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4h7l5 5v11H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 4v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTile({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconMinus({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronUp({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCaret({ className }: IconProps) {
  return (
    <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 6l8 6-8 6V6Z" />
    </svg>
  );
}

export function IconMap({ className }: IconProps) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2 2C9 20 4 15 4 5a2 2 0 0 1 3-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconEnvelope({ className }: IconProps) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h11v9H3V7Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 10h4l3 3v3h-7v-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="7" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6L16 12h-3V10c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPinterest({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10.2 18.2 11.4 13c-.8-.2-1.4-1-1.4-1.9 0-1.2 1-2.2 2.2-2.2.8 0 1.4.3 1.7.9.3-.6.8-.9 1.5-.9 1.3 0 2.2 1.2 2.2 2.8 0 2.4-1.5 4.1-3.6 4.1-.7 0-1.4-.3-1.7-.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSparkle({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.6 13.7 9.4 22 12 13.7 14.6 12 22.4 10.3 14.6 2 12l8.3-2.6L12 1.6Z" />
    </svg>
  );
}

export function IconGlowFace({ className }: IconProps) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13.2" r="6.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.4 14.1c.7.9 1.7 1.35 2.6 1.35s1.9-.45 2.6-1.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9.8" cy="12.1" r="0.75" fill="currentColor" />
      <circle cx="14.2" cy="12.1" r="0.75" fill="currentColor" />
      <path d="M16.8 4.2 17.4 6.4 19.6 7 17.4 7.6 16.8 9.8 16.2 7.6 14 7l2.2-.6L16.8 4.2Z" fill="currentColor" />
      <path d="M6.2 5.1 6.55 6.4 7.85 6.75 6.55 7.1 6.2 8.4 5.85 7.1 4.55 6.75 5.85 6.4 6.2 5.1Z" fill="currentColor" />
    </svg>
  );
}

export function IconStarBurst({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.8 13.2 8.4 18.8 5.2 15.6 10.8 22.2 12 15.6 13.2 18.8 18.8 13.2 15.6 12 22.2 10.8 15.6 5.2 18.8 8.4 13.2 1.8 12 8.4 10.8 5.2 5.2 10.8 8.4 12 1.8Z" />
    </svg>
  );
}

export function IconSketchArrow({ className }: IconProps) {
  return (
    <svg className={className} width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M10 8c8 3 16 9 20 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M24 22c2.4 3.2 5.4 6.2 9.2 8.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M28.2 32.6c2.4-.2 4.8-.8 7.2-1.8-1.1 2.4-2 4.8-2.4 7.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFlower({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 4.5c1.6 2.2 1.6 4.6 0 6.8-1.6-2.2-1.6-4.6 0-6.8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12.7c1.6 2.2 1.6 4.6 0 6.8-1.6-2.2-1.6-4.6 0-6.8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 12c2.2-1.6 4.6-1.6 6.8 0-2.2 1.6-4.6 1.6-6.8 0Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.7 12c2.2-1.6 4.6-1.6 6.8 0-2.2 1.6-4.6 1.6-6.8 0Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconDrop({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5s6 7.2 6 11.2A6 6 0 1 1 6 14.7C6 10.7 12 3.5 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconDropper({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 3h4v3l1.5 1.5v2.5H8.5V7.5L10 6V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M9 10h6v8.5a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 9 18.5V10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLeafMark({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19C8 8 16 5 20 5c0 8-5 14-15 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 16.5C11 13 15 9 20 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconRabbit({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 11c0-4 1.2-8 2.6-8 .8 0 1.4 2.4 1.4 5.2 0 1.4-.2 2.8-.5 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 11c0-4-1.2-8-2.6-8-.8 0-1.4 2.4-1.4 5.2 0 1.4.2 2.8.5 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.2" r="5.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconFlask({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 3h6M10 3v6.2L6.4 18.2A2.6 2.6 0 0 0 8.8 22h6.4a2.6 2.6 0 0 0 2.4-3.8L14 9.2V3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeartLeaf({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20s-7-4.2-7-9.4A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.6C19 15.8 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 11.5c1.2-2.4 3.4-3.6 5.6-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Horse head mark — brand/heritage accents. */
export function IconHorse({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 16.5c1.2-3.2 3.4-5.4 6.2-6.2.6-2.4 2.2-4.3 4.8-5.3.4 1.5.2 3-.6 4.2 2.2.6 3.6 2.2 4.1 4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.2 11.8c.8.4 1.4 1.2 1.6 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.8 17.8c1.6.8 3.4 1.1 5.2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14.2" cy="10.2" r="0.7" fill="currentColor" />
    </svg>
  );
}

/** Side-profile saddle silhouette. */
export function IconSaddle({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 15.5c1.2-2.8 3.2-4.2 6-4.2 1.4 0 2.4-.8 2.8-2 .3-.8 1.1-1.3 2-.9 1.6.7 2.7 2.4 3.2 4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 15.8c.4 1.6 1.8 2.7 3.5 2.7h2.2c1.5 0 2.8-.9 3.3-2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.2 11.5V8.8M15.6 12.2v5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Classic horseshoe. */
export function IconHorseshoe({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.2 5.5c-2.4 1.4-3.7 4.2-3.2 7.2.5 3.2 2.8 5.5 5.2 5.8M16.8 5.5c2.4 1.4 3.7 4.2 3.2 7.2-.5 3.2-2.8 5.5-5.2 5.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M8.2 7.2h1.6M14.2 7.2h1.6M7.4 10h1.6M14.8 10h1.6M7.6 13h1.6M14.6 13h1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Bridle / bit ring mark. */
export function IconBridle({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="14.5" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 4.5v6M8.5 7.2 12 10.5l3.5-3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 14.5h7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Halter / headstall ring. */
export function IconHalter({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 9.5c0-2.8 2.2-5 5-5s5 2.2 5 5v2.2c0 1.4-.6 2.6-1.6 3.4L12 19.2 8.6 15.1A4.5 4.5 0 0 1 7 11.7V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.2 10.2h5.6M9.6 13h4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Leather hide / material mark. */
export function IconLeather({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 7.5c2-2.8 5-4 8.2-3.2 2.4.6 4 2.4 4.3 4.8.4 3.2-1.2 6.2-3.8 7.8-2.4 1.5-5.4 1.4-7.6-.2C5.2 15 4.4 11.4 6.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.2 10.5c1.4-.8 3-.8 4.4 0M10 13.8c1-.5 2.2-.5 3.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Hand-stitch / artisan craft mark. */
export function IconStitch({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5 12.2 5.8l2.4 1.3L7.4 19.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12.4 6.2 18.8 4.8l.6 2.4-5.2 3.1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.2 14.2h2.2M9.4 16.4h2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Balance / fit mark. */
export function IconBalance({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.5v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 8.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 8.5 4.8 14.2h4.4L7 8.5ZM17 8.5l-2.2 5.7h4.4L17 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 19.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

