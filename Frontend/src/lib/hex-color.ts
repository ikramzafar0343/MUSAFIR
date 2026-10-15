export function asHexColor(value: unknown, fallback = "#d0d5d2"): string {
  const text = String(value ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : fallback;
}

export function asHexColorOrNull(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : null;
}
