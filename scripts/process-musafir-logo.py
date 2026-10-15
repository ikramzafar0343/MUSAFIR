"""Make MUSAFIR geometric wordmark transparent; write maroon + beige PNG/WebP."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "Frontend" / "public" / "assets" / "images"
LOCAL_SRC = Path(__file__).resolve().parent / "_musafir-logo-src.png"

# Source is cream/white letterforms on mid-gray silver; not dark-on-white.
KEEP_LUM_MIN = 222
SOFT_LUM_MIN = 200
GRAY_CHROMA_MAX = 36


def find_source() -> Path:
    if LOCAL_SRC.exists():
        return LOCAL_SRC
    raise SystemExit(f"Missing source logo at {LOCAL_SRC}")


def trim_solid_border(im: Image.Image, match: tuple[int, int, int] = (255, 255, 255), tol: int = 2) -> Image.Image:
    """Strip solid screenshot padding (e.g. pure white rim) before cutout."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    pixels = rgba.load()

    def is_match(x: int, y: int) -> bool:
        r, g, b, a = pixels[x, y]
        if a < 8:
            return True
        return (
            abs(r - match[0]) <= tol
            and abs(g - match[1]) <= tol
            and abs(b - match[2]) <= tol
        )

    top = 0
    while top < h and all(is_match(x, top) for x in range(w)):
        top += 1
    bottom = h - 1
    while bottom >= top and all(is_match(x, bottom) for x in range(w)):
        bottom -= 1
    left = 0
    while left < w and all(is_match(left, y) for y in range(top, bottom + 1)):
        left += 1
    right = w - 1
    while right >= left and all(is_match(right, y) for y in range(top, bottom + 1)):
        right -= 1
    if left >= right or top >= bottom:
        return rgba
    return rgba.crop((left, top, right + 1, bottom + 1))


def remove_gray_bg(im: Image.Image) -> Image.Image:
    """Keep bright cream/white mark + frame; turn gray/silver field transparent."""
    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            lum = (r + g + b) / 3.0
            chroma = max(r, g, b) - min(r, g, b)

            # Bright letterforms / thin frame — keep.
            if lum >= KEEP_LUM_MIN:
                continue

            # Neutral gray/silver background — drop (soft edge into the mark).
            if chroma <= GRAY_CHROMA_MAX:
                if lum <= SOFT_LUM_MIN:
                    pixels[x, y] = (0, 0, 0, 0)
                else:
                    t = (lum - SOFT_LUM_MIN) / max(1.0, KEEP_LUM_MIN - SOFT_LUM_MIN)
                    alpha = max(0, min(255, int(255 * (t * t))))
                    pixels[x, y] = (r, g, b, alpha)
                continue

            # Leftover mid tones — treat as background.
            pixels[x, y] = (0, 0, 0, 0)
    return rgba


def remove_rectangular_frame(im: Image.Image, min_alpha: int = 40) -> Image.Image:
    """Strip the thin rectangular box around the wordmark — letters only."""
    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    full = max(8, int(w * 0.45))

    def row_opaque_xs(y: int) -> list[int]:
        return [x for x in range(w) if pixels[x, y][3] >= min_alpha]

    # 1) Wipe near-full-width top/bottom bars.
    for y in range(h):
        xs = row_opaque_xs(y)
        if len(xs) >= full:
            for x in range(w):
                pixels[x, y] = (0, 0, 0, 0)

    # 2) Columns that show up on sparse rows are the vertical frame sides.
    sparse_hits = [0] * w
    for y in range(h):
        xs = row_opaque_xs(y)
        if 0 < len(xs) <= 12:
            for x in xs:
                sparse_hits[x] += 1

    side_min = max(4, int(h * 0.08))
    side_cols = {x for x, hits in enumerate(sparse_hits) if hits >= side_min}
    for x in side_cols:
        for y in range(h):
            if pixels[x, y][3] >= min_alpha:
                pixels[x, y] = (0, 0, 0, 0)

    # 3) Clear any remaining sparse-only rows (orphaned frame fragments).
    for y in range(h):
        xs = row_opaque_xs(y)
        if 0 < len(xs) <= 12:
            for x in xs:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def keep_main_letter_band(im: Image.Image, min_alpha: int = 20) -> Image.Image:
    """Keep the largest contiguous letter band; wipe orphan blobs above/below."""
    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    dense = max(8, int(w * 0.12))
    row_counts = [
        sum(1 for x in range(w) if pixels[x, y][3] >= min_alpha) for y in range(h)
    ]

    bands: list[tuple[int, int, int]] = []
    start: int | None = None
    weight = 0
    for y, n in enumerate(row_counts + [0]):
        if n >= dense:
            if start is None:
                start = y
                weight = 0
            weight += n
        elif start is not None:
            bands.append((start, y - 1, weight))
            start = None
            weight = 0

    if not bands:
        return rgba

    best_start, best_end, _ = max(bands, key=lambda b: b[2])
    pad = 2
    keep_lo = max(0, best_start - pad)
    keep_hi = min(h - 1, best_end + pad)
    for y in range(h):
        if y < keep_lo or y > keep_hi:
            for x in range(w):
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def crop_transparent(im: Image.Image, pad: int = 6, min_alpha: int = 24) -> Image.Image:
    """Crop to opaque content; ignore barely-visible soft fringe."""
    rgba = im.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] >= min_alpha:
                xs.append(x)
                ys.append(y)
    if not xs:
        return rgba
    l = max(0, min(xs) - pad)
    t = max(0, min(ys) - pad)
    r = min(w, max(xs) + 1 + pad)
    b = min(h, max(ys) + 1 + pad)
    return rgba.crop((l, t, r, b))


def recolor_opaque(im: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Recolor non-transparent pixels to solid brand color, preserve alpha."""
    out = im.copy()
    pixels = out.load()
    w, h = out.size
    cr, cg, cb = rgb
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            pixels[x, y] = (cr, cg, cb, a)
    return out


def main() -> None:
    src = find_source()
    print(f"source path {src}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    raw = Image.open(src)
    print(f"source {raw.size} {raw.mode}")
    trimmed = trim_solid_border(raw)
    print(f"trimmed {trimmed.size}")
    cut = crop_transparent(
        keep_main_letter_band(remove_rectangular_frame(remove_gray_bg(trimmed))),
        pad=4,
    )
    print(f"cropped {cut.size}")

    opaque = sum(1 for p in cut.getdata() if p[3] > 0)  # noqa: DEPRECATED ok for script
    print(f"opaque pixels {opaque}")
    if opaque < 200:
        raise SystemExit("Logo cutout too empty — check gray-bg thresholds")

    # Maroon for light/cream surfaces (scrolled header, cards, admin).
    dark = recolor_opaque(cut, (105, 38, 43))  # #69262B
    # Beige for dark/overlay surfaces.
    light = recolor_opaque(cut, (244, 241, 235))  # #f4f1eb

    dark_png = OUT_DIR / "musafir-mark.png"
    dark_webp = OUT_DIR / "musafir-mark.webp"
    light_png = OUT_DIR / "musafir-mark-on-dark.png"
    light_webp = OUT_DIR / "musafir-mark-on-dark.webp"

    dark.save(dark_png, "PNG", optimize=True)
    dark.save(dark_webp, "WEBP", quality=92, method=6)
    light.save(light_png, "PNG", optimize=True)
    light.save(light_webp, "WEBP", quality=92, method=6)

    black = recolor_opaque(cut, (0, 0, 0))
    black.save(OUT_DIR / "musafir-mark-black.png", "PNG", optimize=True)

    print("wrote", dark_png.name, dark_webp.name, light_png.name, light_webp.name)
    print("aspect", round(dark.width / dark.height, 3))


if __name__ == "__main__":
    main()
