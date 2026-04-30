---
name: netlify-static-deploy
description: |
  Deploy and maintain static sites on Netlify (HTML/CSS/JS, no build pipeline).
  Use when the user mentions "Netlify", "deploy", "deploy preview", "build
  failed on Netlify", "cache busting", "redirects", "headers", "netlify.toml",
  or when working on a static site that's git-pushed to Netlify. Covers:
  netlify.toml essentials, cache headers for assets, redirect rules,
  CDN cache busting, deploy hooks, and the Netlify CLI workflow for
  diagnosing failed deploys.
---

# Netlify Static Deploy

Operating manual for static-site projects deployed via Netlify's
git-integration (push to branch → auto-deploy).

## The deploy mental model

Netlify watches a branch on GitHub. On push:
1. Clones the repo at that commit.
2. Runs the build command (or skips if there's none).
3. Publishes the contents of the publish directory to the global CDN.

For a pure-static project, **there is no build step** — the publish dir is
the repo root or a subdirectory. The CDN aggressively caches files; cache
busting is the developer's responsibility.

## Minimum viable `netlify.toml`

Pin deploy settings to the repo (don't rely on the UI alone):

```toml
[build]
  publish = "."
  # No command for pure-static. If you precompile JSX, set it here.
  # command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

# Cache HTML for short periods, assets for a year (immutable via filename hash or query string)
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/uploads/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.mp4"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Accept-Ranges = "bytes"

# Redirect single-page-app fallback (only if needed)
# [[redirects]]
#   from = "/*"
#   to = "/index.html"
#   status = 200
```

`Accept-Ranges: bytes` is critical for video — without it, browsers can't
seek and may re-download the whole file.

## Cache busting without filename hashing

For projects without a build step, the simplest pattern is a query string
on the link:

```html
<link rel="stylesheet" href="tunnel.css?v=22">
```

**Bump the number on every CSS change.** Browsers and Netlify's CDN treat
`tunnel.css?v=22` and `tunnel.css?v=23` as different URLs, so the new version
gets fetched. The actual file at `/tunnel.css` is the same; only the URL
hint changes.

For longer-term hygiene, switch to filename hashing (`tunnel.abc123.css`)
once a build step exists.

## When a deploy "doesn't update"

Order to check:
1. **Did the commit reach GitHub?** `git log origin/main -1`
2. **Did Netlify trigger a deploy?** Check the Deploys tab — look for the matching commit hash.
3. **Did the deploy succeed?** A green "Published" badge means the file is on the CDN. A red "Failed" means the publish dir was empty or the build command failed.
4. **Is the browser showing a stale version?** Hard refresh (Cmd-Shift-R). If that fixes it, you have a cache-busting issue, not a deploy issue.
5. **Is the CDN edge stale?** Rare, but possible. Trigger a redeploy from the Netlify UI ("Clear cache and deploy site").

## Netlify CLI quick reference

```bash
# Install once
npm install -g netlify-cli

# Link the local repo to a Netlify site (run inside the project dir)
netlify link

# See the last few deploys
netlify api listSiteDeploys --data='{"site_id":"<your-site-id>"}' \
  | jq '.[0:5] | .[] | {state, created_at, commit_ref, deploy_url}'

# Tail logs for an in-progress deploy
netlify watch

# Trigger a deploy without a git push (for testing)
netlify deploy --dir=. --prod
```

`netlify deploy --dir=.` (without `--prod`) creates a preview URL — useful
for verifying changes before pointing the live site at them.

## Common deploy failures

| Failure | Cause | Fix |
|---|---|---|
| "No publish directory" | `netlify.toml` missing or `publish` path wrong | Add `[build] publish = "."` (or correct path) |
| Build hangs on `npm install` for static-only project | A `package.json` exists but the build command isn't defined | Either delete `package.json` or set `command = ""` |
| Large files rejected during deploy | Single-file > 100MB | Use git-lfs or move asset to external storage (S3/Cloudfront) |
| 404 on `/some-path` that worked locally | No fallback redirect | Add SPA fallback in `netlify.toml` (only if it's actually a SPA) |
| New CSS not appearing for users | CDN cached the old file | Bump `?v=N` query string in the `<link>` tag |
| Hebrew filenames in URLs return 404 | Some clients fail on URL-encoded non-ASCII | Rename files to ASCII before commit |
| Video stutters / can't seek on iOS | Missing `Accept-Ranges: bytes` header or non-faststart mp4 | Add header in `netlify.toml`; re-encode with `-movflags +faststart` |

## Deploy previews on PRs

Every PR gets a unique preview URL automatically. Use this for visual review
before merging:

- The URL is posted as a status check on the PR.
- It shares cache with the main site, so the same query-string bump applies.
- Preview URLs are public unless you've enabled password protection in
  Netlify's site settings.

## Deploy hooks (manual triggers)

If you ever need to redeploy without a code change (for example, after
updating an asset on a different storage), create a build hook in
Netlify Site Settings → Build & deploy → Build hooks, then:

```bash
curl -X POST -d {} https://api.netlify.com/build_hooks/<hook-id>
```

## Project-specific notes (Strategic_AI)

Currently no `netlify.toml` exists. Adding one with the headers above:
- Locks the deploy config to the repo (visible in code review).
- Enables long-term cache for `/uploads/*.mp4` and `tunnel.css`, both of
  which are versioned via filename or query string.
- Adds `Accept-Ranges: bytes` so video seeking works on iOS Safari.

The HTML link `tunnel.css?v=22` is already the right pattern — just remember
to bump it on CSS changes. The local working copy is **not git-initialized**;
verify which tree is actually being pushed to GitHub before relying on
deploy automation.
