# Strategic_AI — AI Evolution 2026

Bilingual (Hebrew/English, RTL-aware) 3D scrollytelling presentation site.
Deployed on Netlify, source on GitHub.

## Resources

- **Repo:** https://github.com/litb47/strategic-ai (default branch: `main`)
- **Netlify:** https://app.netlify.com/projects/strategic-ai-60fa7ccd/overview
- **Active page filename in production:** `index.html` (Netlify serves this at `/`).
  The file in the repo named `index.html` was a development name —
  in the synced working tree it is renamed to `index.html`.

## What this project is

A single-page narrative experience about the state of AI in 2026. The user
scrolls through a fixed 3D "tunnel" viewport — scenes are positioned along the
Z-axis and pulled toward the camera via a spring-damped scroll model.

Scenes (in Z order, defined in `index.html`):
1. **Hero** (Z=0) — portal title, scroll cue
2. **Executive Summary** (Z=-1800) — RTL Hebrew copy over looping video bridge
3. **Model Nexus / Orrery** (Z=-3800) — central neural Earth + 6 orbiting worlds; click → side panel; click Earth → orchestration hub overlay
4. **Pillars** (Z=-6200) — three glass cards: Agents / Skills / MCP
5. **Bio-Foundation Horizon** (Z=-8600) — 4 revolving glass cards over `bio-hoops.mp4`
6. **Closing** (Z=-10400)

Total Z distance: `TOTAL_Z = 11000`. Spring constants: `STIFF=0.085`, `DAMP=0.78`,
overridable live via the on-screen Tweaks panel (`tweaks.jsx`).

## Stack

- **Pure static** — HTML + CSS + JSX. No bundler, no `package.json`, no build step.
- **React 18 + Babel standalone** loaded from `unpkg.com` CDN at runtime (used only
  for the small Tweaks panel; the tunnel engine is vanilla JS).
- **Hosting** — Netlify (static). GitHub repo is the source of truth.

## File map

| File | Role |
|---|---|
| `index.html` | **Active page.** Tunnel engine, scenes, orrery, hub overlay, world panel. |
| `tunnel.css` | Main stylesheet for the active page (linked as `tunnel.css?v=45` — bump the query string when shipping CSS changes to bust cache). |
| `tweaks-panel.jsx` | Reusable Tweaks shell: panel chrome, controls, host protocol (postMessage edit-mode). |
| `tweaks.jsx` | This page's Tweaks instance — exposes `STIFF`, `DAMP`, ring visibility, grain. Writes to `window.__TUNNEL`. |
| `uploads/*.mp4` | Scene background videos (`1.mp4`, `2.mp4`, `3.mp4`, `bio-hoops.mp4`, `hero-portal.mp4`). |
| `netlify.toml` | Build + headers config (HTML no-cache, CSS/JS/MP4 immutable, security headers). |

## Working in this codebase

### Editing scenes
Each scene is a `<div class="scene ..." data-z="...">`. The `data-z` value
positions the scene in 3D space; the engine reads it at init (`index.html`
around the bottom `<script>` block, near the `scenes.forEach` loop). To add a
scene: insert a new `.scene` block, give it a `data-z`, extend `TOTAL_Z` if it
falls beyond the current end.

### Editing Hebrew copy
Scenes 2–5 are RTL Hebrew (`dir="rtl"` on the scene root). Scene 1 and 6 are LTR
English. Keep `dir` attributes intact when editing — they affect punctuation,
`<em>` direction, and panel layout.

### Cache busting CSS
The active page links `tunnel.css?v=22`. **Increment the query string** every
time you ship a CSS change so Netlify's CDN and returning visitors don't serve
stale styles.

### The orrery
6 satellite "worlds" orbit a central Earth (`#earthHub`). Selection state
collapses orbits and flies the selected world toward the camera (`scale 1.8`,
`translateZ(400px)`). Click handlers live inline in the bottom `<script>` of
`index.html`.

### The Tweaks panel
Loads via Babel-in-the-browser. Slow to evaluate but acceptable for an authoring
tool. **Don't ship Tweaks to a production audience without removing or guarding
it** — it's an editor surface, not user-facing.

## Notes

- Tweaks panel uses React + Babel from `unpkg.com`, gated behind `?edit=1` so
  public visitors don't pay for ~4 MB of dev bundles. Authoring-tool only.

## Deployment

Pushing to the connected branch on GitHub → Netlify auto-deploys. There is no
build command (static publish). When CSS changes, also bump `?v=N` in the
`<link>` tag to force CDN/browser refresh.

## Conventions

- Hebrew RTL scenes use `dir="rtl"` at the scene root only — don't apply it
  globally.
- Inline CSS custom props (`--p-glow`, `--c-soft`, etc.) drive per-card colors;
  prefer extending these vars over adding new classes.
- Spring constants are tunable live — when you find values you like in the
  Tweaks panel, copy them into the `STIFF` / `DAMP` defaults near the bottom of
  `index.html`.
