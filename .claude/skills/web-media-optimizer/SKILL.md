---
name: web-media-optimizer
description: |
  Optimize images and videos for web delivery. Use when a project ships large
  media assets (mp4/png/jpg) over a CDN, when total media weight exceeds ~5MB,
  when duplicate files exist in upload folders, or when the user mentions
  "slow load", "huge videos", "Netlify build", "page weight", "mp4 too big",
  "compress media", or "ffmpeg".
  Covers: deduplication by content hash, ffmpeg recipes for H.264/H.265/AV1,
  poster frame generation, lazy loading patterns (`preload="metadata"`,
  `data-src` swapping), and a measurement-first workflow.
---

# Web Media Optimizer

A pragmatic checklist for shrinking a project's shipped media weight without
visible quality loss. Always **measure first, optimize second, verify third**.

## Mandatory order of operations

1. **Inventory** — what's there, what's referenced, what's orphaned.
2. **Dedupe** — identical bytes → keep one, redirect references.
3. **Compress** — ffmpeg with sane defaults, target 1080p/CRF 23 for web hero video.
4. **Lazy-load** — `preload="metadata"`, `data-src` swap on intersection.
5. **Verify** — open the page, confirm playback, compare before/after.

Skipping step 1 leads to deleting referenced files. Skipping step 5 leads to
broken pages that "looked fine" in your head.

## Step 1 — Inventory

```bash
# Total media weight
du -sh uploads/ assets/ public/ 2>/dev/null

# Per-file size, sorted
find uploads -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.mov" \) \
  -exec ls -la {} + | awk '{print $5, $NF}' | sort -rn

# Duplicate detection by content hash (NOT filename)
find uploads -type f \( -name "*.mp4" -o -name "*.png" -o -name "*.jpg" \) \
  -exec shasum -a 256 {} + | sort | awk '
  {
    if ($1 == prev_hash) print prev_file " == " $2;
    prev_hash = $1; prev_file = $2;
  }'

# Orphan detection — which files are not referenced from any HTML/CSS/JS
for f in uploads/*; do
  base=$(basename "$f")
  if ! grep -rq "$base" --include="*.html" --include="*.css" --include="*.js" --include="*.jsx" .; then
    echo "ORPHAN: $f"
  fi
done
```

## Step 2 — Dedupe

When two files share a SHA-256, keep the one with the cleaner filename
(ASCII, short, no spaces) and update references in HTML/CSS/JS to point at
the kept file. Then delete the duplicate.

**Never delete before grepping references.** A file you think is unused may
be referenced from a JSX `data-src` that grep missed because of a template
literal — search both raw filenames and basenames.

## Step 3 — Compress

### Hero / background video (autoplay, muted, looping)

Web background loops should be **silent, short, low-bitrate**. Audio doubles
file size for nothing.

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset slow -crf 23 \
  -vf "scale=1920:-2,fps=30" \
  -movflags +faststart \
  -an \
  -pix_fmt yuv420p \
  output-h264.mp4
```

- `-crf 23` — visually lossless for most footage. Bump to 26 for further savings on noisy/abstract content.
- `-preset slow` — better compression at the cost of encode time. Worth it for one-off web assets.
- `-movflags +faststart` — moves the moov atom to the front so playback starts before full download.
- `-an` — strip audio (only if the video is muted in HTML).
- `-pix_fmt yuv420p` — required for Safari/iOS compatibility.

### Modern codec (H.265 / HEVC) — ~30% smaller, narrower support

```bash
ffmpeg -i input.mp4 \
  -c:v libx265 -preset slow -crf 26 -tag:v hvc1 \
  -vf "scale=1920:-2" -movflags +faststart -an \
  output-h265.mp4
```

Use `<source>` fallback in HTML:

```html
<video autoplay loop muted playsinline preload="metadata">
  <source src="output-h265.mp4" type="video/mp4; codecs=hvc1">
  <source src="output-h264.mp4" type="video/mp4">
</video>
```

### Poster frame

```bash
ffmpeg -i input.mp4 -ss 00:00:01 -frames:v 1 -q:v 2 poster.jpg
```

Reference via `<video poster="poster.jpg">` — gives users a frame to look at
during the metadata fetch and improves perceived performance.

### Images

```bash
# JPEG → optimized JPEG
cjpeg -quality 80 -progressive input.jpg > output.jpg

# PNG → optimized PNG (lossless)
oxipng -o 4 --strip safe input.png

# Anything → WebP (broad support now)
cwebp -q 80 input.png -o output.webp
```

## Step 4 — Lazy-load patterns

For multi-video pages (like a 6-scene tunnel), only the visible scene's video
should be downloading. Pattern:

```html
<video class="scene-video" autoplay loop muted playsinline
       preload="metadata"
       data-src="uploads/heavy.mp4"></video>
```

```javascript
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting && !e.target.src) {
      e.target.src = e.target.dataset.src;
    }
  }
}, { rootMargin: '200px' });

document.querySelectorAll('.scene-video[data-src]').forEach(v => io.observe(v));
```

`preload="metadata"` instead of `auto` saves 5–20MB per video on initial load.

## Step 5 — Verify

```bash
# Before/after comparison
ls -la uploads/*.mp4 | awk '{sum+=$5} END {print sum/1024/1024 " MB"}'

# Playback test — must check in actual browser, not just file size
# 1. Open the page locally
# 2. Confirm each video plays without stutter
# 3. Confirm autoplay still triggers (some encoders break this)
# 4. Check Network tab — initial load should fetch only first scene
```

## Common pitfalls

- **Filename in non-ASCII** (Hebrew, emoji, spaces) — Netlify URL-encodes
  these and some clients fail. Rename to ASCII before deploy.
- **Stripping audio from a video that wasn't muted in HTML** — silent playback
  surprise. Confirm `<video muted>` first.
- **Not running `+faststart`** — first frame doesn't show until the whole file
  downloads. Always include it.
- **Re-encoding already-compressed files** — quality compounds downward. Keep
  originals in a separate `originals/` folder, never optimize on top of an
  optimized file.
- **Forgetting cache-bust** — if a CDN already cached the old large file at
  the same URL, users won't get the new one. Either change the filename or
  bump a query string (`?v=N`).

## Project-specific notes (Strategic_AI)

This project ships ~98MB across `uploads/` with confirmed duplicates:
- `1.mp4` ≡ `יצירת_סרטוני_VIMEO_ל_Claude_Design.mp4`
- `2.mp4` ≡ `יצירת_סרטונים_לטופ_.mp4`
- `3.mp4` ≡ `סרטון_MCP_מוכן_המשך_לפרויקט.mp4`

The Hebrew-named copies are not referenced from `AI Evolution 2026.html`.
Verify with grep before deleting, then re-encode the kept three plus
`bio-hoops.mp4` per the recipe above. Expect ~50–60% savings.

Bump `tunnel.css?v=22` → `?v=23` after deploy so styles refresh; videos use
new filenames if you re-encode (e.g. `1-h264.mp4`), so they cache-bust naturally.
