"use client";

type CustomSizePanelProps = {
  name: string;
  color: string;
  notes: string;
  logoUrl: string | null;
  logoLabel: string | null;
  uploading: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onLogoFile: (file: File | null) => void;
  onClearLogo: () => void;
};

export function CustomSizePanel({
  name,
  color,
  notes,
  logoUrl,
  logoLabel,
  uploading,
  error,
  onNameChange,
  onColorChange,
  onNotesChange,
  onLogoFile,
  onClearLogo,
}: CustomSizePanelProps) {
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000";

  return (
    <div className="product-custom-box" aria-live="polite">
      <p className="product-custom-title">Custom details</p>
      <p className="product-custom-hint">Add the name, logo, and color for this piece. These details are saved with your bag and shown on the order.</p>
      <label className="product-custom-field">
        <span className="product-option-label">Name / initials</span>
        <input
          type="text"
          className="product-custom-input"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="e.g. initials or short name"
        />
      </label>
      <label className="product-custom-field">
        <span className="product-option-label">Logo file</span>
        <input
          type="file"
          className="product-custom-file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          disabled={uploading}
          key={logoUrl ?? "logo-empty"}
          onChange={(event) => onLogoFile(event.target.files?.[0] ?? null)}
        />
        {uploading ? <span className="product-custom-status">Uploading logo…</span> : null}
        {logoUrl ? (
          <span className="product-custom-logo-row">
            <span className="product-custom-status">{logoLabel || "Logo attached"}</span>
            <button type="button" className="product-custom-clear" onClick={onClearLogo}>
              Remove
            </button>
          </span>
        ) : (
          <span className="product-custom-status">Optional. PNG, JPG, or WebP up to 2 MB.</span>
        )}
      </label>
      <label className="product-custom-field">
        <span className="product-option-label">Color</span>
        <span className="product-custom-color">
          <input
            type="color"
            className="product-custom-swatch"
            value={pickerValue}
            aria-label="Custom color picker"
            onChange={(event) => onColorChange(event.target.value)}
          />
          <input
            type="text"
            className="product-custom-input"
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
            placeholder="#000000"
            spellCheck={false}
            maxLength={7}
          />
        </span>
      </label>
      <label className="product-custom-field">
        <span className="product-option-label">Notes</span>
        <textarea
          className="product-custom-input product-custom-notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Measurements, placement, or other notes"
        />
      </label>
      {error ? (
        <p className="product-custom-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
