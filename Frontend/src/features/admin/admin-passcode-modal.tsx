"use client";

import { useEffect, useRef, useState } from "react";

import { IconClose } from "@/components/icons/icons";

const PASSCODE_LENGTH = 4;

function digitsFromValue(value: string): string[] {
  const chars = value.replace(/\D/g, "").slice(0, PASSCODE_LENGTH).split("");
  return Array.from({ length: PASSCODE_LENGTH }, (_, index) => chars[index] ?? "");
}

export function AdminPasscodeModal({
  open,
  challengeId,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  challengeId: string;
  error?: string | undefined;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  if (!open) {
    return null;
  }

  // Remount on each open/challenge so digit state starts clean without setState-in-effect.
  return (
    <AdminPasscodeModalInner
      key={challengeId}
      challengeId={challengeId}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function AdminPasscodeModalInner({
  challengeId,
  error,
  onClose,
  onSubmit,
}: {
  challengeId: string;
  error?: string | undefined;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const lastAttemptRef = useRef("");
  const [digits, setDigits] = useState<string[]>(() => digitsFromValue(""));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      inputsRef.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const passcode = digits.join("");
    if (passcode.length !== PASSCODE_LENGTH || passcode === lastAttemptRef.current) {
      return;
    }
    lastAttemptRef.current = passcode;
    formRef.current?.requestSubmit();
  }, [digits]);

  const passcode = digits.join("");

  function updateDigits(next: string[]) {
    setDigits(next);
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    updateDigits(next);
    if (digit && index < PASSCODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      updateDigits(next);
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    updateDigits(digitsFromValue(event.clipboardData.getData("text")));
    inputsRef.current[PASSCODE_LENGTH - 1]?.focus();
  }

  return (
    <div className="admin-modal-root" role="presentation">
      <button type="button" className="admin-modal-overlay" aria-label="Close passcode dialog" onClick={onClose} />
      <div className="admin-modal-panel" role="dialog" aria-modal="true" aria-labelledby="admin-passcode-title">
        <header className="admin-modal-header">
          <div>
            <h2 id="admin-passcode-title" className="admin-modal-title">
              Enter passcode
            </h2>
            <p className="admin-passcode-copy">Enter the 4-digit admin passcode to finish signing in.</p>
          </div>
          <button type="button" className="admin-modal-close" aria-label="Close" onClick={onClose}>
            <IconClose />
          </button>
        </header>
        <form ref={formRef} className="admin-passcode-form" action={onSubmit}>
          <input type="hidden" name="challengeId" value={challengeId} />
          <input type="hidden" name="otp" value={passcode} />
          <div className="admin-modal-body">
            <div className="admin-passcode-grid" role="group" aria-label="4-digit passcode">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    inputsRef.current[index] = node;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  pattern="[0-9]*"
                  className="admin-passcode-digit"
                  value={digit}
                  aria-label={`Passcode digit ${index + 1}`}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event.key)}
                  onPaste={handlePaste}
                />
              ))}
            </div>
            {error ? (
              <p className="auth-form-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
