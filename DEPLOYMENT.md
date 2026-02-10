# Deploying Zaha AI Web to GitHub + Vercel

This is the **web-only** project. The repo root is the Next.js app (no `apps/web` subfolder).

## Why the repo stays small on GitHub

Heavy folders are in `.gitignore` and are **not** committed:

- **`node_modules/`** – install with `npm install` on Vercel and locally
- **`.next/`** – Next.js build output
- **`out/`**, **`.vercel/`**, **`.env`**

You only push source code and config; GitHub stays small (a few MB).

---

## What to upload to GitHub

Push the **entire project** from this folder (`Zaha AI Web`). Git ignores `node_modules` and `.next` automatically.

**Required:** All of `src/`, `public/`, `package.json`, `package-lock.json`, config files, README, `.gitignore`.

---

## GitHub → Vercel (Try App from anywhere)

1. **Create a GitHub repo** (e.g. `zaha-ai-web`), then:

   ```bash
   cd "D:\Meit Personal Project\Zaha AI\Zaha AI Web"
   git init
   git remote add origin https://github.com/YOUR_USERNAME/zaha-ai-web.git
   git add .
   git commit -m "Initial commit: Zaha AI Web"
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
   - **Import** your GitHub repo.
   - **Root Directory:** leave **empty** (this repo root is already the Next.js app).
   - **Framework Preset:** Next.js (auto-detected).
   - Add any **Environment Variables** in the dashboard.
   - Click **Deploy**.

3. **Use from anywhere**  
   Use the Vercel URL (e.g. `zaha-ai-web.vercel.app`) as your Try App.

---

## Summary

- **GitHub:** Push this whole folder; `.gitignore` keeps size small.
- **Vercel:** Import repo, leave Root Directory empty, deploy. Use the live URL for testing.
