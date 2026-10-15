"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const KEY = "musafir-cookie-ok";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return window.localStorage.getItem(KEY) !== "1";
}

function getServerSnapshot() {
  return false;
}

export function CookieBanner() {
  const storedVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  if (!storedVisible || dismissed) {
    return null;
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie notice">
      <p>
        We use essential cookies for your session, bag, and wishlist. See our{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
      <button
        type="button"
        className="luxury-button-solid"
        onClick={() => {
          window.localStorage.setItem(KEY, "1");
          setDismissed(true);
        }}
      >
        Accept
      </button>
    </div>
  );
}
