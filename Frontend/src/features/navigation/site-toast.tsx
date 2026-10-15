"use client";

import { useEffect, useState } from "react";

import { TOAST_EVENT, type ToastDetail } from "@/lib/bag-events";

export function SiteToast() {
  const [toast, setToast] = useState<ToastDetail | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) {
        return;
      }
      setToast(detail);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <p className={`site-toast site-toast--${toast.tone ?? "ok"}`} role="status">
      {toast.message}
    </p>
  );
}
