# Deploying Zaha AI to GitHub + Vercel

## Why the repo is small on GitHub (not 2GB)

The full folder is ~2GB mainly because of:

- **`node_modules/`** (root and inside each app) – **never commit these**
- **`.next/`** (Next.js build cache in `apps/web`)
- **`.expo/`** and build outputs in `apps/mobile`

The **root `.gitignore`** excludes all of these. So you push only **source code and config**; GitHub stores a small repo (typically a few MB). Dependencies are installed on Vercel and locally with `npm install`.

---

## What to upload to GitHub (required for a quick test)

Push the **entire project** from the repo root. Git will ignore the heavy folders automatically.

**Folders that must be in the repo:**

| Path | Purpose |
|------|--------|
| **`apps/web/`** | Next.js app – **this is what Vercel deploys** (Admin, WebAR, Store Demo) |
| **`apps/mobile/`** | Expo app – for Try App / mobile (not deployed to Vercel) |
| **Root files** | `package.json`, `package-lock.json`, `README.md`, `.gitignore` |

**Do not upload** (already in `.gitignore`):

- `node_modules/` (anywhere)
- `apps/web/.next/`
- `apps/web/out/`
- `apps/mobile/.expo/`, `dist/`, `web-build/`
- `.env` and `.vercel/`

So: **you don’t upload a “specific folder” only** – you upload the whole repo; the **root `.gitignore`** keeps the size small.

---

## Best way: GitHub → Vercel (for the Try App / web)

1. **Create a GitHub repo** (e.g. `zaha-ai`), then from your project folder:

   ```bash
   git init
   git remote add origin https://github.com/YOUR_USERNAME/zaha-ai.git
   git add .
   git commit -m "Initial commit: Zaha AI monorepo"
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
   - **Import** your GitHub repo (`zaha-ai`).
   - **Root Directory:** set to **`apps/web`** (so Vercel treats it as a single Next.js app).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Install Command:** `npm install` (default).
   - Add any **Environment Variables** (e.g. from `.env`) in the Vercel dashboard.
   - Click **Deploy**.

3. **Use from anywhere**
   - Vercel gives you a URL (e.g. `zaha-ai.vercel.app`). Use this for the “Try App” / web from anywhere.

**Why set Root Directory to `apps/web`?**  
The web app has its own `package.json` and does not depend on workspace packages. Deploying from `apps/web` keeps builds simple and fast. The mobile app (`apps/mobile`) is separate and is not deployed to Vercel.

---

## Optional: Deploy from repo root (monorepo)

If you later add shared `packages/*` and the web app depends on them:

- Leave **Root Directory** empty (use repo root).
- Vercel will use the root `package.json` and install workspaces.
- Set **Build Command** to e.g. `npm run build:web` or `npx turbo run build --filter=web` so only the web app is built.

For your current setup, **Root Directory = `apps/web`** is the recommended and simplest option.

---

## Summary

- **Host on GitHub:** Push the whole repo; the root `.gitignore` keeps it small (no `node_modules`, `.next`, etc.).
- **Required for a quick test:** All of `apps/web`, `apps/mobile`, and root config files – no need to upload a single “magic” folder; just push everything and let `.gitignore` do the work.
- **Vercel:** Import the repo, set **Root Directory** to **`apps/web`**, then deploy. Use the generated URL for the Try App from anywhere.
