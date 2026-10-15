import { CmsImage } from "@/features/media/cms-image";
import type { LineCustomization } from "@/schemas/order";

export function CustomizationDetails({
  customization,
  showLogo = false,
}: {
  customization: LineCustomization | null | undefined;
  showLogo?: boolean;
}) {
  if (!customization) {
    return null;
  }
  return (
    <div className="custom-details">
      <p>Name: {customization.name}</p>
      {customization.color ? (
        <p className="custom-details-color">
          Color:{" "}
          <span className="custom-details-swatch" style={{ background: customization.color }} aria-hidden="true" />
          {customization.color}
        </p>
      ) : null}
      {customization.logoUrl ? (
        showLogo ? (
          <p className="custom-details-logo">
            Logo:{" "}
            <CmsImage src={customization.logoUrl} alt="Custom logo" width={56} height={56} className="custom-details-logo-image" />
          </p>
        ) : (
          <p>Logo attached</p>
        )
      ) : null}
      {customization.notes ? <p>Notes: {customization.notes}</p> : null}
    </div>
  );
}
