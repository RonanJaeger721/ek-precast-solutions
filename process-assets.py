from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\User\Downloads")
OUT = Path(__file__).parent / "dist" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

sources = {
    "flyer": "WhatsApp Image 2026-09-28 at 10.30.13 (1).jpeg",
    "wall_dark": "WhatsApp Image 2026-09-28 at 10.30.13.jpeg",
    "cottage_build": "WhatsApp Image 2026-09-28 at 10.30.12 (2).jpeg",
    "wall_clean": "WhatsApp Image 2026-09-28 at 10.30.12 (1).jpeg",
    "cottage_done": "WhatsApp Image 2026-09-28 at 10.30.12.jpeg",
}

for key, filename in sources.items():
    image = Image.open(SRC / filename).convert("RGB")
    if key == "flyer":
        # Preserve the real installation photo while removing flyer typography.
        image = image.crop((250, 0, 1080, 700))
    elif key == "wall_dark":
        image = image.crop((0, 267, 540, 675))
    elif key == "cottage_build":
        image = image.crop((0, 264, 540, 722))
    elif key == "cottage_done":
        image = image.crop((0, 0, 720, 500))
    max_width = 1400 if key in {"flyer", "wall_clean"} else 900
    if image.width > max_width:
        h = round(image.height * max_width / image.width)
        image = image.resize((max_width, h), Image.Resampling.LANCZOS)
    image.save(OUT / f"{key}.webp", "WEBP", quality=84, method=6)

# Extract the supplied logo without redesigning it. Near-white flyer pixels become transparent.
flyer = Image.open(SRC / sources["flyer"]).convert("RGBA")
logo = flyer.crop((20, 18, 245, 190))
pixels = []
for r, g, b, a in logo.getdata():
    mx, mn = max(r, g, b), min(r, g, b)
    if mn > 235 and mx - mn < 16:
        pixels.append((255, 255, 255, 0))
    elif mn > 205 and mx - mn < 14:
        alpha = max(0, min(255, round((235 - mn) / 30 * 255)))
        pixels.append((r, g, b, alpha))
    else:
        pixels.append((r, g, b, a))
logo.putdata(pixels)
bbox = logo.getbbox()
logo = logo.crop(bbox) if bbox else logo
logo.save(OUT / "ek-logo.png", optimize=True)

# Poster from the selected on-site video.
video_poster = Image.open(SRC / sources["wall_clean"]).convert("RGB")
video_poster = video_poster.crop((55, 170, 730, 1010))
video_poster.save(OUT / "video-poster.webp", "WEBP", quality=82, method=6)

print("Created:")
for item in sorted(OUT.iterdir()):
    print(item.name, item.stat().st_size)
