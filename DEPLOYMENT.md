# Deployment Guide — Kids Creative Studio 1.0.0

This guide takes the project from its current folder to a **live URL on
Cloudflare Pages**, via **GitHub**. No application code is changed at any step.

> **What is being deployed:** the pre-built `release/production/` folder.
> It is a 100% static, offline-first web app (native ES modules, **zero
> runtime dependencies**, no bundler, no server). Cloudflare serves the files
> exactly as they are — **there is no build step on the server.**

---

## 0. At a glance

| Setting | Value |
|---|---|
| Framework preset | **None** |
| Build command | **(leave empty)** |
| Build output directory | **`release/production`** |
| Node/npm needed on server | **No** |
| External network requests | **None** (web fonts already stripped from production) |
| Routing | Hash-based (`/#/coloring`) — no SPA rewrite needed |

The in-repo `wrangler.toml` already pins `pages_build_output_dir = "release/production"`.

---

## 1. Push to GitHub

From the project root (`kids-creative-studio/`):

```bash
git init
git add .
git commit -m "Kids Creative Studio 1.0.0 — deploy-ready"
git branch -M main
git remote add origin https://github.com/<your-username>/kids-creative-studio.git
git push -u origin main
```

> The `release/` folder **is committed on purpose** — Cloudflare serves
> `release/production` directly, so those files must exist in the repo.

---

## 2. Connect to Cloudflare Pages (Git integration — recommended)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorize GitHub and pick the `kids-creative-studio` repository.
3. On the **Set up builds and deployments** screen enter:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `release/production`
4. Click **Save and Deploy**. First deploy takes ~1 minute.
5. Your app is live at `https://kids-creative-studio.pages.dev`
   (add a custom domain later under **Custom domains** if you want).

Every future `git push` to `main` auto-deploys.

### Alternative: direct upload (no Git)

```bash
npm install -g wrangler          # one time
wrangler login
wrangler pages deploy release/production --project-name kids-creative-studio
```

---

## 3. Local preview (optional sanity check before pushing)

Because it's plain static files, any static server works:

```bash
cd release/production
python3 -m http.server 8000
# open http://localhost:8000
```

Open the browser console — it should be **clean** (no 404s, no errors).

---

## 4. Cloudflare config files (already included)

| File | Location | Purpose |
|---|---|---|
| `wrangler.toml` | repo root | pins the output directory to `release/production` |
| `_headers` | `release/production/` | security headers + sensible cache policy |
| `_redirects` | `release/production/` | documents that hash routing needs **no** rewrites |

Edit `_headers` if you later add a Content-Security-Policy or change caching.

---

## 5. Verifying a live deploy

After the deploy finishes, confirm:

- [ ] `https://<project>.pages.dev/` loads the Arabic RTL dashboard.
- [ ] Browser **console is error-free** and **Network** shows only same-origin
      requests (no `googleapis`/`gstatic`/CDN calls).
- [ ] Clicking an activity updates the URL hash (e.g. `#/coloring`) and the
      view + active sidebar item change.
- [ ] A hard refresh on a deep hash link still loads the app.

---

## 6. Notes / decisions left to you

- **License:** the repo ships **without** a `LICENSE` file, so default
  copyright ("all rights reserved") applies. If you intend to open-source it,
  add a license of your choice before making the repo public.
- **Custom fonts:** production intentionally uses the system font stack. To
  self-host the Arabic font later, drop the font files into
  `release/production/assets/` and reference them from CSS — no external CDN.
- **Rebuilding:** `release/` is a generated artifact of `node tools/build.mjs`.
  If you ever regenerate it, re-apply the production cleanup (this guide's
  companion `DEPLOYMENT_CHECKLIST.md` lists what to strip) and re-add the
  `_headers` / `_redirects` files.

---

*Kids Creative Studio · Version 1.0.0 · static · offline-first · zero dependencies*
