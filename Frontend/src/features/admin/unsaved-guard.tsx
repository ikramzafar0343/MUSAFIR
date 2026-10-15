"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export const ADMIN_FORM_DIRTY_EVENT = "admin-form-dirty";

/** Notify UnsavedGuard that a programmatic field change dirtied the form. */
export function markAdminFormDirty() {
  if (typeof document === "undefined") {
    return;
  }
  document.dispatchEvent(new CustomEvent(ADMIN_FORM_DIRTY_EVENT));
}

export function UnsavedGuard({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = formRef.current;
    if (!node) {
      return undefined;
    }
    const onDirty = () => setDirty(true);
    // Publishing navigates away on purpose — the leave prompt must not block it.
    const onSubmit = () => setDirty(false);
    node.addEventListener("input", onDirty);
    node.addEventListener("change", onDirty);
    node.addEventListener("submit", onSubmit);
    document.addEventListener(ADMIN_FORM_DIRTY_EVENT, onDirty);
    return () => {
      node.removeEventListener("input", onDirty);
      node.removeEventListener("change", onDirty);
      node.removeEventListener("submit", onSubmit);
      document.removeEventListener(ADMIN_FORM_DIRTY_EVENT, onDirty);
    };
  }, []);

  useEffect(() => {
    if (!dirty) {
      return undefined;
    }
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  return <div ref={formRef}>{children}</div>;
}
