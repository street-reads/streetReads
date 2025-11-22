# Street Reads — PWA

A geolocation‑aware Progressive Web App for finding and sharing neighborhood “Book Boxes.” Built with vanilla JS + Web Components, Firebase (Auth/Firestore), TomTom Maps, Cloudinary uploads, and an offline‑first Service Worker.

---

## ✨ Features

- **PWA**: installable app, offline pages, app shell cache, maskable icons.
- **Smart online banner**: shows only when the network truly fails (probe fetch) and hides immediately when back online.
- **Auth persistence** with graceful fallbacks (IndexedDB → localStorage → session → memory).
- **User profiles**: editable name, email, avatar (Cloudinary).
- **Book Boxes map**: live markers from Firestore, popups with photos & favorite counts.
- **Filters**: Recently updated, Nearby (requires HTTPS), Most Popular (ratings), Most Liked, Most Commented.
- **Search**: address substring match and TomTom typeahead.
- **Reviews & chat**: add ratings, comments, and image attachments.
- **Responsive UI** with a custom `<app-navbar>` web component.

---

## 🧱 Tech Stack

- **Frontend**: HTML/CSS/JS (ES Modules), Web Components
- **Auth/DB**: Firebase Auth + Firestore
- **Maps & Geocoding**: TomTom SDK & Search APIs
- **Media**: Cloudinary unsigned uploads
- **PWA**: Service Worker (`sw.js`) + Web App Manifest
- **Tooling**: No framework build required (served as static files)

---

## 🚀 Getting Started

### 1) Prerequisites

- Node.js 16+ (for running a static dev server)
- Firebase project (Web App) with Auth + Firestore enabled
- TomTom Maps API key
- Cloudinary account with unsigned upload preset

### 2) Clone & install

```bash
# serve as a static site at localhost
npm i -g serve
serve . -l 5173
```

> **Tip:** Some features (camera, geolocation, PWA install) require **HTTPS** or `http://localhost`. Use `serve` (above) or your preferred static server.

### 3) Configure Firebase

Update your **public** Firebase web config in the files that initialize Firebase (examples):

- `js/app.js` (splash/auth router)
- `js/user-profile.js`
- `js/update-navbar-avatar.js`
- Any other file that calls `initializeApp`

```js
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "1:XXXX:web:XXXX"
};
```

### 4) Configure Cloudinary

Create `js/cloudinary-config.js` with your unsigned preset:

```js
window.cloudinaryConfig = {
  cloudName: "YOUR_CLOUD_NAME",
  uploadPreset: "YOUR_UNSIGNED_PRESET",
  apiUrl: "https://api.cloudinary.com/v1_1"
};
```

### 5) Configure TomTom

Place your TomTom API key in the files using it (e.g., `js/homepage.js`):

```js
const apiKey = "YOUR_TOMTOM_KEY";
```

### 6) Online probe file

Create an **empty** file at the site root:

```
/__online.txt
```

This file is **not** precached; the SW only uses it to verify the network is truly reachable. Any HTTP response (200/404/500) counts as “online”; only fetch/timeout errors mean “offline”.

---

## 🧭 App Flow

### Splash & Auth Router (`js/app.js`)
- Shows a brief splash (`SPLASH_MS`, respects `prefers-reduced-motion`).
- Sets Auth persistence with graceful fallbacks (IndexedDB → local → session → memory).
- Routes to **`/pages/homepage.html`** if signed in or **`/pages/login.html`** if signed out.
- Registers the Service Worker on window `load`.

### `<app-navbar>` (Web Component)
- Displays brand + avatar.
- **Offline banner**: 
  - If `navigator.onLine` is false → show banner immediately.
  - Otherwise, fetches `__online.txt` with `cache: 'no-store'`.
  - **Any** response = online → banner hidden. Network/timeout error = offline → banner visible.
- Public method: `updateAvatar(url)`.

---

## 🗺️ Maps, Search, Filters

- **Live markers** are driven by Firestore `streetLibraries` documents.
- **Popup content** includes name, address, preview photo, and **favorite count** (queried from users’ `favorites` arrays).
- **Search**: simple address substring match in Firestore. Typeahead via TomTom Search API.
- **Nearby**: Computes haversine distance from user’s geolocation (requires HTTPS/localhost).
- **Recently updated**: Filters by `updatedAt`/`createdAt` newer than N days.
- **Most Popular**: Highest `averageRating` (ties supported).
- **Most Liked**: Highest favorite count (built via lightweight client aggregation).
- **Most Commented**: Highest `comments.length`.

**How we locate the nearest Book Box**
1. Get user coordinates via `navigator.geolocation.getCurrentPosition()` (with `enableHighAccuracy`).
2. For each Book Box (Firestore doc), normalize to `[lng, lat]`.
3. Measure distance in meters with the haversine formula.
4. Keep those within the chosen radius (e.g., 1000m) and update markers accordingly.
5. Fit/zoom map to results.

---

## 📱 PWA

### Manifest (`/manifest.webmanifest`)

```json
{
  "name": "Street Reads",
  "short_name": "StreetReads",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4747D0",
  "icons": [
    { "src": "/icons/icon-192.png",     "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-256.png",     "sizes": "256x256", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-384.png",     "sizes": "384x384", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png",     "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Service Worker (`/sw.js`)

- **App shell** cached on install.
- **Navigation requests**: _network‑first_, fallback to cache, then `/offline.html`.
- **Static assets**: _cache‑first_, then network.
- **Online probe**: _network‑only_ (`/__online.txt?t=...`; **not** in cache). Any HTTP status → online.

---

## 📁 Suggested Structure

```
/
├─ index.html
├─ offline.html
├─ manifest.webmanifest
├─ sw.js
├─ /icons/
│  ├─ icon-192.png
│  ├─ icon-256.png
│  ├─ icon-384.png
│  ├─ icon-512.png
│  ├─ maskable-192.png
│  └─ maskable-512.png
├─ /components/
│  └─ app-navbar.js
├─ /css/
│  ├─ style.css
│  └─ ...
├─ /js/
│  ├─ app.js
│  ├─ homepage.js
│  ├─ user-profile.js
│  ├─ update-navbar-avatar.js
│  ├─ cloudinary-config.js
│  └─ ...
└─ /pages/
   ├─ homepage.html
   ├─ login.html
   ├─ register.html
   ├─ user-profile.html
   └─ bookBoxDetail.html
```

---

## 🔐 Security Notes

- **Never store plaintext passwords** in Firestore (the inline masking demo shows UI only). Use Firebase Auth for credentials.
- Lock Firestore with rules (example, adapt to your needs):
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /streetLibraries/{docId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```
- Use **unsigned** Cloudinary presets only for client‑side uploads; protect destructive actions server‑side.

---

## 🧰 Troubleshooting

**No app icon after install**
- Ensure icons exist at `/icons/` and are referenced in `manifest.webmanifest`.
- Use at least one **maskable** icon. Relaunch and reinstall the PWA.
- Clear site data or bump your SW `VERSION` to refresh caches.

**Offline banner stuck ON**
- Make sure `__online.txt` exists at the site root and is **not** in the SW `APP_SHELL`.
- Confirm SW fetch handler special‑cases the probe path and uses `cache: 'no-store'`.
- DevTools → Application → Service Workers: _Unregister_ + _Hard Reload_.

**Geolocation fails**
- Requires HTTPS/localhost. Check browser/OS Location permissions.

**Camera fails**
- Permission denied or unsupported device. Try switching facing mode; check console for `NotAllowedError` or `NotFoundError`.

**TomTom or Cloudinary calls fail**
- Verify API keys/presets. Check CORS and network tab in DevTools.

---

## 📦 Deploy

- Any static hosting works (Netlify, Vercel, Firebase Hosting, Cloudflare Pages, GitHub Pages with HTTPS).
- Ensure the SW scope matches your path. Keep `/__online.txt` reachable over the network.

---

## 📜 License

Langara (c) Story Seekers Team.
