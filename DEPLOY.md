# Deploy: Sai Sandesh → Render (free tier)

The app is verified deploy-ready locally. This doc is the exact handoff for the one
step that needs a human: creating the Render web service. A `gh` push must happen
first (see step 0).

## Step 0 — Push to GitHub (blocked for the agent; needs a human)

The GitHub CLI in this environment is **not authenticated** (`gh auth status` → not
logged in), and the agent was instructed not to attempt authentication. Before
continuing, run these on a machine with `gh` authenticated:

```bash
cd ~/workspace/sai-sandesh
gh repo create sai-sandesh --public --source=. --remote=origin
git push -u origin main   # (or the current branch: c907ec0 "Remove worker scratch files…")
```

Sanity checks already done by the agent on 2026-10-03:
- Largest single file in the repo: `sai_corpus.db` (47.6 MB) — under GitHub's 100 MB
  hard limit, no Git LFS needed.
- `static/cards/` ≈ 173 MB, tracked total ≈ 232 MB across 215 files. The first
  `git push` will take a few minutes; that's normal.
- `mobile/node_modules/` and `.venv/` exist locally but are **not** tracked in git
  (ignored), so they won't be pushed.

## Step 1 — Create the Web Service on Render

1. Go to **dashboard.render.com** (log in to your Render account).
2. Click **New +** (top-right) → **Web Service**.
3. Under **Public Git repository** / **Connect a repository**, connect your GitHub
   account if prompted, then select the **`sai-sandesh`** repo. (The repo already
   contains `render.yaml`, so Render may offer it as a **Blueprint** — that path
   works too and pre-fills the same settings below.)
4. On the service form, confirm/enter:
   - **Name:** `sai-sandesh`
   - **Runtime:** `Python 3` (runtime.txt pins `python-3.12`)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type / Plan:** `Free`
   - No environment variables are required (`envVars: []` in render.yaml).
5. Click **Create Web Service**.

## Step 2 — What to expect during build/first boot

- The build takes **a few minutes**: Render installs FastAPI + uvicorn from
  `requirements.txt` (only two packages) and downloads the repo, including the
  **48 MB `sai_corpus.db`** and **~173 MB of share-card PNGs**.
- On first boot, FastAPI loads `sai_corpus.db` (SQLite FTS5) — expect the first
  request to take a few extra seconds while the DB opens; subsequent requests
  are fast.
- **Free-tier note:** the service sleeps after ~15 minutes of inactivity, so the
  very first hit after idle takes ~30–60 s to wake. This is normal and free.
- Render gives you the public URL: `https://sai-sandesh.onrender.com`
  (or `https://sai-sandesh-<hash>.onrender.com` if the name is taken — copy the
  exact URL from the dashboard).

## Step 3 — Post-deploy verification

Replace `BASE` with your service URL and run:

```bash
BASE=https://sai-sandesh.onrender.com
for ep in "/" "/api/v1/day/2026-10-04" "/api/v1/topics" \
           "/api/v1/search?q=service" "/cards/2026-10-04.png" \
           "/static/manifest.webmanifest" "/static/privacy.html"; do
  printf '%-40s %s\n' "$ep" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$ep")"
done
# expect all 200s; then sanity-check payloads:
curl -s "$BASE/api/v1/topics" | python3 -c \
  "import json,sys; print('topics:', len(json.load(sys.stdin)['topics']))"  # expect 55
curl -s "$BASE/api/v1/search?q=service" | head -c 200; echo                # expect cited results
curl -s "$BASE/api/v1/day/2026-10-04" | head -c 200; echo                   # expect 2026-10-04 devotional
```

## Step 4 — Point the Expo app at the Render URL (after deploy)

For `eas build`, set the API base URL so the native app talks to production:

```bash
cd ~/workspace/sai-sandesh/mobile
EXPO_PUBLIC_API_URL=https://sai-sandesh.onrender.com eas build -p ios   # and/or -p android
```

(or add `EXPO_PUBLIC_API_URL=https://sai-sandesh.onrender.com` to `eas.json`'s
build profile env, whichever the build was set up to use — check `mobile/eas.json`).

## Reference — verified deployability (agent, 2026-10-03)

- `render.yaml`: free-tier web service, build/start commands match, `python` runtime. ✓
- `Procfile`, `requirements.txt` (fastapi + uvicorn), `runtime.txt` (python-3.12). ✓
- Fresh venv install + uvicorn boot: all 7 endpoints returned **200**; `/api/v1/topics`
  returned **55** topics; `/api/v1/search?q=service` returned results with corpus
  citations; `/cards/2026-10-04.png` served a ~2 MB PNG. ✓
- No file exceeds GitHub's 100 MB limit (largest: `sai_corpus.db` 47.6 MB). ✓
- GitHub push: **blocked** — `gh` not authenticated in the agent environment. See Step 0.
