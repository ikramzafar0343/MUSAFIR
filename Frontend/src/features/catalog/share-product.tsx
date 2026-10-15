"use client";

import { useState } from "react";

export function ShareProduct({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="product-share-btn" onClick={() => void share()}>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
