"use client";

import { useId, useState } from "react";

import { asHexColor } from "@/lib/hex-color";

export type ColorPreset = {
  label: string;
  color: string;
};

export function ColorField({
  name,
  label,
  defaultValue,
  presets = [],
}: {
  name: string;
  label: string;
  defaultValue: string;
  presets?: ColorPreset[];
}) {
  const textId = useId();
  const fallback = asHexColor(defaultValue);
  const [value, setValue] = useState(fallback);
  const hex = asHexColor(value, fallback);

  return (
    <div className="admin-product-field">
      <label className="admin-product-label" htmlFor={textId}>
        {label}
      </label>
      {presets.length > 0 ? (
        <span className="admin-storefront-presets">
          {presets.map((preset) => {
            const selected = hex.toLowerCase() === preset.color.toLowerCase();
            return (
              <button
                key={preset.label}
                type="button"
                className={`admin-storefront-preset${selected ? " is-selected" : ""}`}
                style={{ background: preset.color }}
                aria-pressed={selected}
                onClick={() => setValue(asHexColor(preset.color, fallback))}
              >
                {preset.label}
              </button>
            );
          })}
        </span>
      ) : null}
      <span className="admin-storefront-color">
        <input type="hidden" name={name} value={hex} />
        <input
          type="color"
          className="admin-storefront-swatch"
          value={hex.toLowerCase()}
          aria-label={`${label} picker`}
          onChange={(event) => setValue(event.target.value)}
        />
        <input
          id={textId}
          type="text"
          className="admin-product-soft"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
        />
      </span>
    </div>
  );
}
