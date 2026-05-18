# Lift.Log

A no-frills, single-page workout tracker. All data lives in your browser — no account, no server, no syncing. Designed to be deployed once to Vercel and added to your iPhone home screen as a PWA.

## What it does

- Log workouts (exercise, sets of weight × reps) during a gym session
- Track session metadata: feel, fasting state, sleep, body weight, energy source
- Score each session 0–100 based on volume, progressive overload, activity, and rep range
- Review session history, all-time lift history, and per-exercise PR timelines
- Persists in-progress sessions across app closes — closing and reopening the app mid-session resumes where you left off

## Running locally (optional)

If you want to preview before deploying:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

To build a production bundle:

```bash
npm run build
```

The built site lands in `dist/`.

---

# Deploying to Vercel (for non-developers)

You don't need to know anything about coding to deploy this. The whole process is uploading the files to GitHub, then pointing Vercel at the repo. Roughly 15 minutes.

## Step 1 — Create a GitHub account

1. Go to **https://github.com** and click **Sign up** in the top right
2. Pick a username, email, and password — anything works
3. Verify your email when GitHub sends you a code

## Step 2 — Create a new GitHub repository

1. Once logged in, click the **+** icon in the top-right corner, then **New repository**
2. Repository name: `lift-log` (or whatever you like)
3. Set it to **Public** (Vercel's free tier requires public repos for the easiest setup)
4. Leave everything else unchecked — do **not** add a README, .gitignore, or license, since this folder already has them
5. Click **Create repository**

## Step 3 — Upload these files to the repo

1. On the new empty repo page, look for the link **"uploading an existing file"** (it's in the quick-setup section)
2. Open the `track-app` folder on your computer in File Explorer (Windows) or Finder (Mac)
3. Select **everything in the folder except `node_modules` and `dist`** — you want:
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `README.md`
   - `.gitignore` (this file might be hidden — on Mac press `Cmd+Shift+.` to show hidden files; on Windows enable "Show hidden files" in View options)
   - The `public/` folder
   - The `src/` folder
4. Drag those files and folders directly onto the GitHub upload page
5. Wait for GitHub to finish processing the upload (the file list appears below the drag zone)
6. Scroll down, leave the default commit message, and click **Commit changes**

Your code is now on GitHub.

## Step 4 — Create a Vercel account and deploy

1. Go to **https://vercel.com** and click **Sign Up**
2. Choose **Continue with GitHub** — this links the two accounts
3. Authorize Vercel to read your repos when prompted
4. Once logged in, click **Add New...** → **Project**
5. Find `lift-log` in the list of your repos and click **Import**
6. Vercel will auto-detect that this is a Vite project — you do **not** need to change any settings
7. Click **Deploy**
8. Wait about 30–60 seconds. When it's done, you'll see a confetti animation and a preview screenshot

Click **Continue to Dashboard**. Your live URL is on the project page — it'll look like `lift-log-something.vercel.app`.

## Step 5 — Add to your iPhone home screen

1. On your iPhone, open **Safari** (it has to be Safari for PWA features to work — Chrome won't add the right shortcut)
2. Navigate to your Vercel URL
3. Tap the **Share** button (the square with an arrow pointing up, at the bottom of the screen)
4. Scroll down in the share menu and tap **Add to Home Screen**
5. The name will pre-fill as **Lift.Log** — tap **Add** in the top right

You'll now have a Lift.Log icon on your home screen. Tapping it opens the app in full-screen mode with no Safari address bar, so it feels like a native app.

## Updating the app later

Whenever you want to change the code:

1. Edit the file in your local `track-app` folder
2. Go to your GitHub repo → **Add file** → **Upload files**, drag the changed file in, and commit
3. Vercel automatically rebuilds and redeploys within a minute. Refresh the app on your phone (you may need to close it from the app switcher first) and the new version is live

---

## Data and privacy

All your workout data is stored in your iPhone's Safari `localStorage` under three keys (`liftlog:workouts`, `liftlog:sessions`, `liftlog:active`). It never leaves your device. Vercel only hosts the static HTML/CSS/JS — it has no idea what you've logged.

This means:

- **If you clear Safari data or uninstall the app, your workout history is gone.** There is no recovery, no backup.
- It won't sync between your iPhone and other devices.
- Private browsing won't see your saved data.

If you ever want to back up your data manually, you can paste this in Safari's address bar (`javascript:`-style URLs are blocked but you can use the developer console via remote inspection from a Mac):

```js
JSON.stringify({
  workouts: JSON.parse(localStorage.getItem('liftlog:workouts') || '[]'),
  sessions: JSON.parse(localStorage.getItem('liftlog:sessions') || '[]'),
})
```

## Scoring algorithm

Each completed session gets a score 0–100 with four components:

| Component             | Weight | How it's calculated                                                   |
| --------------------- | ------ | --------------------------------------------------------------------- |
| Volume                | 40 pts | Session volume ÷ avg of last 4 sessions × 35, capped at 40            |
| Progressive Overload  | 25 pts | Fraction of session lifts that beat the previous best for that lift   |
| Activity Count        | 20 pts | Lifts logged ÷ 10 (the daily goal)                                    |
| Rep Range Adherence   | 15 pts | Fraction of sets that fell in the 10–12 rep range                     |

Tier labels: 90+ ELITE · 75+ STRONG · 60+ SOLID · 45+ OK · below 45 LIGHT.

## Tech

- Vite + React 18
- Tailwind CSS
- lucide-react icons
- Archivo Black + JetBrains Mono via Google Fonts
- No backend, no router, no state library
