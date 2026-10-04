# Play Store Listing — Sai Sandesh (draft, ready to paste into Play Console)

## Basics

- **App name:** Sai Sandesh
- **Package:** `ai.saisandesh.app`
- **Category:** Lifestyle
- **Tags:** spirituality, devotional, meditation, sai baba, hindu, daily wisdom
- **Content rating:** Everyone (IARC questionnaire below)
- **Privacy policy URL:** `https://<render-service>.onrender.com/static/privacy.html`
  (placeholder — must be a real hosted URL before submission; a ready-made
  page is at `~/workspace/sai-sandesh/static/privacy.html`)

## Short description (68/80 chars)

```
Daily wisdom from Sri Sathya Sai Baba — discourses, bhajans & seva.
```

## Full description

```
Sai Ram. Begin each morning with Swami's words.

Sai Sandesh is a free devotional companion that brings you a short daily
message grounded in the teachings of Sri Sathya Sai Baba — drawn from His
discourses (Sri Sathya Sai Speaks) and the Vahinis, never invented.

Each day includes:
• On this day — a discourse Swami gave on this calendar date, with its theme
• A short reflection for daily life
• A video discourse clip from official channels
• A bhajan to listen to
• A small seva nudge for the day
• A beautiful share card to forward on WhatsApp

Explore 55 spiritual topics — seva, love, dharma, meditation, and more —
each with Swami's definition in His own words, what the Vahinis say, what the
discourses say, and simple actionable steps. Search the full corpus with real
citations, and revisit any past day in the archive.

Free forever. No accounts, no ads, no tracking.

Sai Sandesh is an independent devotional offering and is not affiliated with
or endorsed by the Sri Sathya Sai Central Trust or SSSIO.
```

## Graphics (all ready in `mobile/assets/`)

- **App icon (Play listing):** `assets/icon-512.png` — 512×512 PNG (Play requires
  exactly 512×512 for the store icon; the 1024 master is `icon.png`).
- **Feature graphic:** `assets/feature-graphic.png` — 1024×500 PNG, diya/lamp
  motif matching the app icon. ✅ Done.
- **Screenshots:** minimum 2 required; recommended 4. Capture at 1080×1920
  (9:16) from a real device or Android Studio emulator running the production
  build:
  1. Today tab — greeting, discourse excerpt, reflection (the hero screen)
  2. Topic Q&A detail — e.g. Seva, showing definition + actionable steps
  3. Search tab — a query with cited results
  4. Archive tab — list of past days
  Tip: open the app fresh each time so the status bar clock doesn't distract;
  keep the default light theme.

## Content rating — IARC questionnaire answers

| Question | Answer |
|---|---|
| Violence | No |
| Sexual content / nudity | No |
| Profanity / crude humor | No |
| Controlled substances | No |
| Gambling | No |
| User-generated content, chat, or social features | No |
| Location sharing | No |
| Personal data collection | No (no accounts, no analytics, no ads) |

Expected rating: **Everyone**.

## Release notes (v1.0.0, for the first release)

```
Sai Sandesh 1.0 — the daily devotional, now as an app.
• Today's message: discourse, reflection, video, bhajan, seva nudge, share card
• 55 topic Q&As with Swami's words and actionable steps
• Corpus search with real citations
• Archive of past days
• Native share + copy-excerpt
```

## Pre-submission checklist

- [ ] `EXPO_PUBLIC_API_URL` points at the Render deployment (production build)
- [ ] Privacy policy URL live at the Render `/static/privacy.html` path
- [ ] Screenshots captured (≥2, 1080×1920)
- [ ] Feature graphic uploaded (`assets/feature-graphic.png`)
- [ ] App icon uploaded (`assets/icon-512.png`)
- [ ] Content rating questionnaire completed (answers above → Everyone)
- [ ] Closed testing track set up: 12+ testers, 14 days (see STORE-SUBMISSION.md)
