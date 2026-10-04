# Sai Sandesh

A free, mobile-first Sathya Sai devotional web app. Python FastAPI backend
serving a JSON API + a plain HTML/CSS/JS frontend (no build step). No runtime
AI — all content is pre-generated JSON written by the content team (or the
daily content cron).

Live: `GET /` → the app. Installable as a PWA (manifest + service worker,
offline re-reading of previously-viewed days).

## Quick start

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open http://localhost:8000 — the app loads today's devotional from
`data/devotionals/<today>.json`. The bundled full-text corpus
(`sai_corpus.db`, ~48MB, copied from `~/workspace/sai-corpus/`) powers
`/api/search`.

## Content schemas

Content teams write exactly these shapes. Nothing else is read at runtime.

### 1. `data/devotionals/YYYY-MM-DD.json`

```json
{
  "date": "2026-10-04",
  "greeting": "Sai Ram.",
  "discourse": {
    "title": "See the One in the Many",
    "date": "04 October 1992",
    "occasion": "",
    "volume": "Sri Sathya Sai Speaks, Vol 25 (1992)",
    "excerpt": "...4-8 lines verbatim...",
    "theme": "one-line theme"
  },
  "reflection": "...",
  "video": { "title": "...", "url": "https://..." },
  "bhajan": { "title": "...", "url": "https://..." },
  "seva_nudge": "...",
  "share_card": "/cards/2026-10-04.png",
  "fallback": false
}
```

- `video` may be `null` (section is omitted).
- `bhajan` may be `{"title": "...", "url": null}` (title shown, no link).
- `share_card` is a `/cards/*.png` path; card PNGs live in `static/cards/`
  (topic cards: `static/cards/topic-<slug>.png`).
- `fallback: true` marks a re-shared earlier Sandesh (shown with a small note).

### 2. `data/topics/<slug>.json`

```json
{
  "slug": "seva",
  "title": "Seva / Selfless Service",
  "definition": {
    "quote": "...",
    "citation": "<title> — <volume>, <date>"
  },
  "vahinis": [{ "quote": "...", "source": "Prema Vahini" }],
  "discourses": [{ "quote": "...", "citation": "..." }],
  "actionable_steps": [{ "step": "...", "citation": "..." }],
  "make_it_real": "..."
}
```

## How to add a day (the daily content-extension process)

1. Generate the day's JSON per schema 1 above (verified discourse excerpt for
   that calendar date, reflection, video/bhajan links, seva nudge).
2. Drop it in `data/devotionals/YYYY-MM-DD.json`.
3. Drop the portrait share-card PNG in `static/cards/YYYY-MM-DD.png`
   (referenced as `/cards/YYYY-MM-DD.png` in the JSON).
4. No restart needed — `GET /api/today` picks it up immediately.
   If the file is missing, the endpoint returns a 404 JSON error (never a crash)
   and the frontend shows a graceful "not ready yet" message.

The daily content cron does exactly these steps each morning.

## API reference

Every endpoint is served under **both** `/api/...` and `/api/v1/...` with
identical JSON contracts. `/api/v1` is the stable contract future clients
consume (see Phase 2 below).

| Method | Path (also under `/api/v1`) | Description |
|---|---|---|
| GET | `/api/today` | `data/devotionals/<server-today>.json`; 404 JSON if missing |
| GET | `/api/day/{YYYY-MM-DD}` | Devotional for an explicit date; 404 JSON if missing |
| GET | `/api/topics` | `[{"slug","title"}]` scanned from `data/topics/*.json`, sorted by title |
| GET | `/api/topic/{slug}` | Full Q&A document for one topic |
| GET | `/api/search?q=...&topic=...&limit=10` | Full-text search over `sai_corpus.db` (FTS5 BM25, mirrors `search.py`); returns `[{"title","volume","date","citation","excerpt"}]` |
| GET | `/api/archive` | Devotional dates available, newest first |

Error shape: `{"detail": {"error": "devotional_not_found", "date": "..."}}`
(or a plain string detail for 400s). Static: `/cards/*.png` from
`static/cards/`; the frontend lives at `/` (`/static/*` for assets,
`/sw.js` for the service worker).

## Mobile apps (Expo, in progress)

A single Expo React Native codebase lives in `mobile/` (iOS + Android, EAS
cloud builds — no Mac needed) consuming the stable `/api/v1` contract
documented above. Android is being built first: signed release AAB via
`eas build --platform android --profile production`, Play Store listing
assets in `mobile/store-listing.md`, and the exact store-submission handoff
(including the 14-day closed test with 12+ testers) in
`mobile/STORE-SUBMISSION.md`. See `mobile/MOBILE-README.md` for setup.
Privacy policy (required as a live URL before Play submission) is served at
`/static/privacy.html`.

## Deploy (Render, free tier)

`render.yaml` defines a free web service:

- build: `pip install -r requirements.txt`
- start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

(`runtime.txt` pins python-3.12; `Procfile` carries the same start command.)

## Repo layout

```
sai-sandesh/
├── main.py                  # FastAPI app: JSON API + static serving
├── sai_corpus.db            # bundled FTS5 corpus (~48MB)
├── data/
│   ├── devotionals/         # YYYY-MM-DD.json (schema 1)
│   └── topics/              # <slug>.json (schema 2)
├── static/
│   ├── index.html           # frontend shell
│   ├── styles.css
│   ├── app.js
│   ├── manifest.webmanifest # PWA manifest
│   ├── sw.js                # service worker (served at /sw.js)
│   ├── icons/               # 180/192/512px app icons
│   └── cards/               # share-card PNGs, /cards/*.png
├── requirements.txt
├── runtime.txt
├── Procfile
└── render.yaml
```
