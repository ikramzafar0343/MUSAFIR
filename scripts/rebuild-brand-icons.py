"""Replace Oak & Rein horse crest icons with maroon MUSAFIR wordmark."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "Frontend" / "public"
MARK = PUBLIC / "assets" / "images" / "musafir-mark.png"
BEIGE = (244, 241, 235, 255)  # #f4f1eb


def fit_mark(mark: Image.Image, canvas_size: int, pad_ratio: float = 0.14) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), BEIGE)
    max_w = int(canvas_size * (1 - 2 * pad_ratio))
    max_h = int(canvas_size * (1 - 2 * pad_ratio))
    ratio = min(max_w / mark.width, max_h / mark.height)
    nw = max(1, int(mark.width * ratio))
    nh = max(1, int(mark.height * ratio))
    scaled = mark.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (canvas_size - nw) // 2
    y = (canvas_size - nh) // 2
    canvas.alpha_composite(scaled, (x, y))
    return canvas


def main() -> None:
    mark = Image.open(MARK).convert("RGBA")
    specs: list[tuple[str, int, float]] = [
        ("brand-mark.png", 512, 0.12),
        ("icon-512.png", 512, 0.18),
        ("icon-192.png", 192, 0.18),
        ("favicon-512.png", 512, 0.12),
        ("favicon-192.png", 192, 0.12),
        ("apple-touch-icon.png", 180, 0.12),
        ("favicon-48.png", 48, 0.10),
        ("favicon-32.png", 32, 0.08),
        ("favicon-16.png", 16, 0.06),
    ]
    for name, size, pad in specs:
        out = fit_mark(mark, size, pad)
        path = PUBLIC / name
        if name == "apple-touch-icon.png":
            out.convert("RGB").save(path, "PNG", optimize=True)
        else:
            out.save(path, "PNG", optimize=True)
        print("wrote", name, size)

    ico_sizes = [16, 32, 48]
    ico_images = [fit_mark(mark, s, 0.08) for s in ico_sizes]
    ico_images[0].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )
    print("wrote favicon.ico")

    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="2" fill="#F4F1EB"/>
  <rect x="3.5" y="3.5" width="25" height="25" stroke="#69262B" stroke-width="1.25"/>
  <path d="M8 23 V10 L12.2 18.5 L16 10 L19.8 18.5 L24 10 V23" stroke="#69262B" stroke-width="1.6" stroke-linejoin="miter" fill="none"/>
</svg>
"""
    (PUBLIC / "favicon.svg").write_text(svg, encoding="utf-8")
    print("wrote favicon.svg")


if __name__ == "__main__":
    main()
