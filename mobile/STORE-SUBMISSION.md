# Sai Sandesh — Store Submission Handoff

Everything below is for **you (Sai)** to do or hand over. Nothing here needs
your accounts touched by anyone else — but the steps below do need *you*,
because they involve your Google and Apple developer identities.

**Status today (2026-10-03):**
- ✅ Google Play developer account: **created and identity-verified** (done by you today)
- 🔄 Apple Developer Program enrollment: **in progress** (you're doing it from your Android browser)
- ✅ App code: complete — Today / Topics / Search / Archive, native share, copy-excerpt
- ✅ `expo-doctor`: 21/21 checks pass · TypeScript clean · Android production bundle exports cleanly
- ✅ `eas.json`: development / preview / production profiles (Android + iOS)
- ✅ Play listing draft: `mobile/store-listing.md` (descriptions, rating answers, screenshot guidance)
- ✅ Feature graphic (1024×500) + app icons: `mobile/assets/`
- ⏸️ EAS cloud build: **not run yet** — needs your Expo login (step 1 below)

---

## Part 1 — Android (Play Store) ← priority

### Step 1 — Log in to Expo (one time, on your machine or wherever the build runs)

```bash
cd ~/workspace/sai-sandesh/mobile
npx eas-cli login
```

This opens a browser sign-in for your Expo account (create one free at
expo.dev if you don't have it). Hand-over alternative: you can instead create
an **access token** at expo.dev → Settings → Access Tokens and provide it as
the `EXPO_TOKEN` environment variable — then no interactive login is needed.

### Step 2 — Point the app at the production backend

```bash
EXPO_PUBLIC_API_URL=https://<render-service>.onrender.com \
  npx eas-cli build --platform android --profile production --non-interactive
```

- Produces a **signed release AAB** in the EAS cloud dashboard (no Mac needed).
- **Keystore choice:** EAS auto-generates and manages the Android release
  keystore. That is fine for v1 — but the keystore must be **preserved**:
  losing it means the app can never be updated under the same package name.
  You can switch to a self-managed keystore later (`eas credentials`), but do
  it deliberately and back the file up.

### Step 3 — Closed testing (Google requires this before production)

Google grants production access only after **14 days of closed testing with
12+ testers**. Suggested testers: your **Sai Prema Nilayam at Riverside**
center — devotees are the perfect audience and you already have the channel.

1. Play Console → your app → **Release → Testing → Closed testing** → create
   a track, add the 12+ tester email addresses.
2. Upload the AAB from Step 2 to that track.
3. Wait out the 14 days (testers just need the app installed via the Play
   testing link).

### Step 4 — Give EAS permission to submit (service account)

1. Play Console → **Setup → API access** → **Create** a service account
   (this jumps to Google Cloud Console) → create the account, then **back in
   Play Console** link it.
2. Grant it the **Admin → "Release apps to testing tracks"** permission
   (or full Admin while setting up; least privilege is fine after).
3. In Google Cloud Console → IAM → Service Accounts → your new account →
   **Keys → Add key → JSON** → download the file.
4. Save it as `mobile/google-play-service-account.json` (this exact path is
   already wired in `eas.json`; the file is git-ignored — never commit it).

### Step 5 — Submit

```bash
cd ~/workspace/sai-sandesh/mobile
npx eas-cli submit -p android --profile production
```

Or upload the AAB manually in Play Console → **Release → Production** →
Create new release. Fill in the listing from `mobile/store-listing.md`
(title, short/full description, screenshots, feature graphic, content
rating), paste the privacy-policy URL
(`https://<render-service>.onrender.com/static/privacy.html` — must be live),
and roll out.

---

## Part 2 — iOS (App Store) — after your Apple enrollment completes

1. Finish **Apple Developer Program** enrollment ($99/yr) — you're already on
   the web route from your Android browser. Nothing for anyone else to do.
2. Once enrolled, hand over **one** of these for submission:
   - An **App Store Connect API key** (recommended): App Store Connect →
     Users and Access → Integrations → App Store Connect API → create a key
     with **App Manager** role → download the `.p8` file, and note the
     **Issuer ID** and **Key ID**; or
   - Your **Apple ID + app-specific password** (works, less clean).
3. Then the build + submit (cloud, no Mac needed):

```bash
cd ~/workspace/sai-sandesh/mobile
npx eas-cli login   # if not already logged in
EXPO_PUBLIC_API_URL=https://<render-service>.onrender.com \
  npx eas-cli build --platform ios --profile production --non-interactive
npx eas-cli submit -p ios --profile production
```

iOS bundle id is already set: `ai.saisandesh.app` (same as Android).

---

## Reference — exact commands

| What | Command |
|---|---|
| Dev server | `npx expo start` |
| Typecheck | `npx tsc --noEmit` |
| Health check | `CI=1 npx expo-doctor` |
| Android release build (EAS cloud) | `EXPO_PUBLIC_API_URL=<render-url> npx eas-cli build --platform android --profile production --non-interactive` |
| iOS release build (EAS cloud) | `EXPO_PUBLIC_API_URL=<render-url> npx eas-cli build --platform ios --profile production --non-interactive` |
| Submit Android | `npx eas-cli submit -p android --profile production` |
| Submit iOS | `npx eas-cli submit -p ios --profile production` |

## Files to know

- `mobile/MOBILE-README.md` — setup & architecture
- `mobile/store-listing.md` — Play listing copy, rating answers, screenshot guidance
- `mobile/assets/feature-graphic.png` — Play feature graphic (1024×500) ✅
- `mobile/assets/icon-512.png` — Play store icon (512×512) ✅
- `mobile/assets/icon.png` / `adaptive-icon.png` / `splash.png` — app icons & splash ✅
- `static/privacy.html` — privacy policy page (goes live with the Render deploy)
- `mobile/google-play-service-account.json` — **you** create this in Step 4 (git-ignored)
