# Shared Files

A private file-sharing app for exactly 2 people, with categories and an "unread" red-dot indicator. Built with Next.js, Neon Postgres, Drizzle ORM, Vercel Blob, and Auth.js.

This guide assumes you have **never deployed a Next.js app before**. Follow it top to bottom.

---

## 0. What you need before starting

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (you can sign up with your GitHub account, it's free)
- [Node.js](https://nodejs.org) installed on your computer (v20 or newer)
- The two email addresses that will be allowed to use the app

---

## 1. Push the code to GitHub

From inside this project folder:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then go to [github.com/new](https://github.com/new), create a new **empty** repository (don't add a README/gitignore there — you already have one), and follow the "push an existing repository" instructions it shows you, which will look like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 2. Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **Import** next to the GitHub repository you just pushed.
3. Vercel will auto-detect Next.js. Leave the build settings as default.
4. **Don't click Deploy yet** — first you need to add the database and file storage (next steps), otherwise the first build will fail because the app can't find `DATABASE_URL`, etc. If you already clicked Deploy and it failed, that's fine — just continue with the steps below and redeploy at the end.

---

## 3. Add Neon Postgres (via the Vercel Marketplace)

1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database** (or **Browse Marketplace**) and choose **Neon**.
3. Follow the prompts to create a free Neon Postgres database and connect it to this project.
4. Vercel will automatically add a `DATABASE_URL` environment variable to your project. You don't need to copy/paste anything for this one.

---

## 4. Add Vercel Blob (file storage)

1. Still in the **Storage** tab, click **Create Database** again and choose **Blob**.
2. Give it a name (anything, e.g. `shared-files-blob`) and create it.
3. Vercel will automatically add a `BLOB_READ_WRITE_TOKEN` environment variable to your project.

---

## 5. Set the remaining environment variables

Go to **Project Settings → Environment Variables** and add these two (the DB and Blob ones from steps 3–4 should already be there):

| Variable | Value | Where it comes from |
|---|---|---|
| `AUTH_SECRET` | a random secret string | Run `npx auth secret` in this project folder — it will generate one and can even add it to Vercel for you if you follow its prompt. Otherwise, generate any long random string and paste it in. |
| `ALLOWED_EMAILS` | `you@example.com,partner@example.com` | The **only** two email addresses allowed to sign up/log in. Comma-separated, no spaces. |

You do **not** need to set `AUTH_URL` on Vercel — it's auto-detected there. (You only need it for local development, see below.)

---

## 6. Run the database migration

The app needs its tables created in Neon before it will work. Do this once, from your own computer:

1. In the project folder, create a file named `.env` (copy `.env.example` and rename it).
2. Fill in `DATABASE_URL` — get the value from Vercel: **Storage → your Neon database → `.env.local` tab** (copy the `DATABASE_URL` line). Paste it into your local `.env`.
3. Install dependencies and run the migration:

```bash
npm install
npm run db:migrate
```

You should see `Migrations complete.` in the terminal. Your Neon database now has the `users`, `categories`, `files`, and `file_reads` tables (with a `drizzle/` migration file already included in this repo — you don't need to run `db:generate` unless you change the schema yourself later).

---

## 7. Deploy

Go back to your Vercel project and click **Deploy** (or **Redeploy** if it already tried once). Once it finishes, Vercel gives you a live URL like `https://your-app.vercel.app`.

---

## 8. Create the 2 user accounts

1. Open your deployed URL and go to `/signup`.
2. Sign up with the **first** allowed email (one from `ALLOWED_EMAILS`), a name, and a password. Any other email will be rejected.
3. Log out, go to `/signup` again, and sign up with the **second** allowed email.

That's it — only these two accounts can ever exist, since sign-up checks every email against `ALLOWED_EMAILS`.

---

## 9. Test that the red dot works

1. Open the app in one browser (or normal window) logged in as **User A**.
2. Open it in a **second browser, or an incognito/private window**, logged in as **User B**.
3. As User A, go into the "General" category and upload a file.
4. As User B: you should see a 🔴 red dot next to the file, a red badge on the "General" category card, and the browser tab title should show something like **"(1) Shared Files"**. User A should **not** see a dot on their own upload.
5. As User B, click the file to open it — the dot should disappear and the counts should drop back to 0 within a few seconds (the badge polls for updates roughly every 10 seconds, or refresh the page for an instant update).
6. Try "Mark all as read" on a category with multiple unread files — all dots should clear at once.

---

## Local development

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL, BLOB_READ_WRITE_TOKEN, AUTH_SECRET, ALLOWED_EMAILS
npm run db:migrate      # only needed once
npm run dev
```

Then open `http://localhost:3000`.

---

## A few implementation notes

- **Passwords** are hashed with `bcryptjs` (a pure-JavaScript implementation) instead of `bcrypt`, because `bcrypt` needs a native build step that can be unreliable on Vercel's serverless functions. Security-wise they're equivalent.
- **Files are never publicly reachable.** Vercel Blob doesn't support private/authenticated storage URLs directly, so uploads go to Blob with a random unguessable filename, but the app *never* exposes that raw Blob URL to the browser. Every download/preview goes through `/api/files/[id]/download`, which checks you're logged in, then streams the file's bytes back through the server. If you're logged out, that route returns 401 and the file is inaccessible.
- **Large uploads bypass your server**: the browser uploads directly to Vercel Blob using a short-lived signed token (`@vercel/blob/client`), so you're not limited by Next.js's API route body-size limits.
- **The default "General" category** is created automatically the first time the categories list is loaded — no manual setup needed.
- If you ever change `src/db/schema.ts`, run `npm run db:generate` to create a new SQL migration file, commit it, then run `npm run db:migrate` (locally, pointed at your Neon database) to apply it.
