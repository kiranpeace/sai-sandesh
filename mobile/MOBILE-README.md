# Sai Sandesh — Mobile App (Expo / React Native)

One codebase for iPhone + Android. Talks to the same FastAPI backend as the
PWA web app.

## Setup

```bash
cd ~/workspace/sai-sandesh/mobile
npm install
npx expo start
```

- `npx expo start` — Metro dev server (scan the QR with Expo Go, or press `a`
  for an Android emulator).
- `npx tsc --noEmit` — typecheck.
- `CI=1 npx expo-doctor` — config / dependency health check (21/21 passing).

## Backend URL (single constant)

The API base URL is **one constant** in `src/lib/api.ts`:

```ts
const RAW = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
```

- **Local dev:** leave `EXPO_PUBLIC_API_URL` unset → talks to the FastAPI
  server on `http://localhost:8000`. On a physical phone, `localhost` is the
  phone itself, so set the env var to your machine's LAN IP instead, e.g.
  `EXPO_PUBLIC_API_URL=http://192.168.1.5:8000 npx expo start`.
- **Production (Render):** set `EXPO_PUBLIC_API_URL=https://<your-render-service>.onrender.com`
  when running the EAS production build (see STORE-SUBMISSION.md).

## Project layout

```
mobile/
  app.json            # name "Sai Sandesh", slug "sai-sandesh", v1.0.0,
                      # bundle id ai.saisandesh.app (iOS + Android)
  eas.json            # development / preview / production build profiles
  assets/             # icon.png (1024), adaptive-icon.png, splash.png,
                      # feature-graphic.png (1024x500, Play Store), icon-512.png
  src/
    app/              # Expo Router routes (src/app is the router root)
      _layout.tsx
      (tabs)/
        _layout.tsx   # tab bar: Today / Topics / Search / Archive
        index.tsx     # Today — full daily devotional
        topics.tsx    # topic list
        search.tsx    # corpus search + topic filter chips
        archive.tsx   # past days
      topic/[slug].tsx  # Q&A detail (all sections)
      day/[date].tsx    # single past day
    components/
      Devotional.tsx  # the full daily view (shared by Today + day detail)
      LoadState.tsx   # loading / error + retry
    lib/
      api.ts          # fetch wrappers for GET /api/v1/*, resolveUrl()
      types.ts        # backend JSON contracts
      theme.ts        # indigo / saffron / gold palette
  MOBILE-README.md
  store-listing.md
  STORE-SUBMISSION.md
```

## API contract (backend, stable)

`GET /api/v1/today`, `/api/v1/day/{YYYY-MM-DD}`, `/api/v1/topics`,
`/api/v1/topic/{slug}`, `/api/v1/search?q=…&topic=…&limit=10`,
`/api/v1/archive`, plus `/cards/{name}.png` share-card images.

## Notes

- Installs resolve with `npm install --legacy-peer-deps` (a transitive
  `react-dom` peer pin in expo-router's tree conflicts with the SDK-pinned
  React otherwise; harmless — EAS builds from the lockfile).
- Share: the share-card image is downloaded to the app cache and shared with
  the day's text via the native share sheet; "Copy excerpt" puts the excerpt
  on the clipboard.
- No accounts, no analytics, no ads in v1 — see `../static/privacy.html`.
