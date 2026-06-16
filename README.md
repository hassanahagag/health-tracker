# Hassan's Health Tracker — Deploy to Vercel (permanent, cloud-synced)

This is your full app, ready to run on Vercel — a free hosting platform that (unlike
the Claude artifact sandbox) allows the cloud connection, so your Supabase storage
will finally work. Your data becomes permanent and syncs across iPhone + laptop.

You already did the Supabase setup — that all carries over. Same URL, key, and table.

---

## Easiest path: deploy by uploading the folder (no GitHub needed)

1. Go to **vercel.com** and sign up (free — use Google or email).
2. Unzip `hassan-health-tracker-vercel.zip` on your computer (a laptop is easiest for this one-time step).
3. Install the Vercel tool: not even needed — use the website:
   - On the Vercel dashboard, click **Add New… → Project**.
   - Choose **"Deploy a folder"** / drag the unzipped **hassan-health-tracker** folder in.
   - Vercel auto-detects Vite. Just click **Deploy**.
4. Wait ~1 minute. Vercel gives you a permanent URL like
   `https://hassan-health-tracker.vercel.app`.

## Alternative: GitHub (if you prefer)

1. Create a free GitHub account, make a new repository.
2. Upload these files (drag-and-drop in GitHub's web uploader works).
3. In Vercel: **Add New → Project → Import** your GitHub repo → **Deploy**.
4. Bonus: any future change you push auto-redeploys.

---

## After it's live

1. Open your new `…vercel.app` URL in **Safari** on your iPhone.
2. **Add to Home Screen** (Share ↑ → Add to Home Screen). Delete old icons.
3. Open the app → **Progress → ☁️ Permanent Cloud Storage**.
4. Enter the SAME values you set up before:
   - Project URL: `https://xdqosahoiopyfdehhvdt.supabase.co`
   - anon public key
   - your code: `hassan2026`
5. Tap **Connect Cloud Storage** → this time it WILL connect (no sandbox blocking it).
6. Test: log 2 meals, close the app fully, reopen → data is there. Done. ✅

On your laptop, open the same `.vercel.app` URL, enter the same 3 values, and it
syncs the same data. True cross-device, permanent storage — like the commercial apps.

---

## Notes
- The AI food photo/text analysis calls Anthropic's API; without a key it falls back
  to the built-in estimate engine (type a food → reasonable estimate → tap calories to
  adjust). If you later want full AI, you can add an API key via a small serverless
  function — ask and I'll add it.
- Everything else (meal plan, exercise + videos, meds, graphs, weekly targets,
  backup/restore) works fully.
- Free Vercel + free Supabase = $0/month for your usage level.
