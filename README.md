<p align="center">
  <img src="docs/static/img/logo.svg" alt="JoinMe Logo" width="120" />
</p>

<h1 align="center">JoinMe</h1>

<p align="center">
  <strong>Swipe. Discover. Join. — A social event discovery app.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white" alt="MySQL" />
</p>

---

## About

JoinMe is a mobile app that helps you discover events happening around you — think Tinder, but for events. Swipe through event cards, create your own gatherings, and connect with people who share your interests.

## Screenshots

| Feed | Event detail | All events |
|:---:|:---:|:---:|
| ![Feed](screenshots/feed.png) | ![Event detail](screenshots/event-detail.png) | ![All events](screenshots/events-list.png) |
| **Create event** | **Profile** | **Notification settings** |
| ![Create event](screenshots/create-event.png) | ![Profile](screenshots/profile.png) | ![Notification settings](screenshots/notification-settings.png) |

## Features

- **Swipe-based event discovery** — browse events with a pan-gesture card stack
- **Event creation & management** — create, edit, and delete your own events
- **Ratings & reputation** — rate events and other users to build community trust
- **Attendance tracking** — RSVP and confirm attendance after events
- **User profiles & preferences** — customize interests, profile photo, and location
- **Push notifications** — Expo Push (APNs/FCM) with per-user, per-type preferences (event updates, attendance, ratings) — see the Notification settings screenshot above

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React Native 0.81, Expo 54, Expo Router 6, TypeScript, Zustand |
| **Backend** | Python 3.10+, FastAPI, SQLModel, MySQL (SQLite fallback for dev) |
| **Auth** | JWT (HS256) + Argon2 password hashing |
| **Storage** | Google Cloud Storage (signed URLs for images) |
| **Docs** | Docusaurus 3 |
| **CI/CD** | GitHub Actions (Docusaurus → GitHub Pages) |

## Project Structure

```
JoinMe/
├── frontend/      # React Native (Expo) mobile app
├── backend/       # Python FastAPI server
├── docs/          # Docusaurus documentation site
├── diagrams/      # Architecture & ER diagrams (Mermaid)
└── screenshots/   # Product screenshots referenced from this README
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- npm
- [Python 3.10+](https://www.python.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # FastAPI on :8000
```

On first run the backend uses SQLite at `backend/joinme.db`. Set `DATABASE_URL` to point at MySQL if you want to run against the production-shaped DB.

### Frontend

```bash
cd frontend
npm install
npx expo start                          # Expo on :8081
```

Scan the QR code with Expo Go or run on a simulator.

### Docs (optional)

```bash
cd docs
npm install
npm run start                           # Docusaurus on :3000
```

## Mobile builds & TestFlight

### Expo configuration

`frontend/app.json` is the source of truth for the mobile app's identity and plugins:

| Field | Value |
|---|---|
| `name` / `slug` | `JoinMe Temple` / `joinme` |
| `bundleIdentifier` (iOS) | `app.joinme` |
| `extra.eas.projectId` | `0744a90e-3125-48a2-9350-299cfe08a147` (owner `kp007`) |
| Plugins | `expo-router`, `expo-splash-screen`, `expo-notifications`, `expo-apple-authentication` |
| Experiments | `typedRoutes`, `reactCompiler`, New Architecture (`newArchEnabled`) |
| Android | adaptive icon (white background) + edge-to-edge |

### EAS build profiles

`frontend/eas.json` defines three profiles for building with [EAS Build](https://docs.expo.dev/build/introduction/):

| Profile | Distribution | Use |
|---|---|---|
| `development` | internal | Dev client builds for on-device debugging (no simulator) |
| `preview` | internal | Release-config builds for internal testers |
| `production` | App Store | Auto-increments build number; injects production `EXPO_PUBLIC_API_URL` (Cloud Run) |

### Build & submit to TestFlight

From `frontend/`:

```bash
# Build a production iOS binary on EAS infrastructure
eas build --platform ios --profile production

# Submit the latest production build to App Store Connect / TestFlight
eas submit --platform ios --profile production
```

`eas submit` is pre-configured with App Store Connect app ID **`6761838477`** in `eas.json` — no extra flags needed.

### Push notifications

Delivery goes through **[Expo Push](https://docs.expo.dev/push-notifications/overview/)**, which fans out to APNs (iOS) and FCM (Android) transparently — no separate Apple/Google credentials to manage in this repo.

- **Frontend** ([`frontend/services/notifications.ts`](frontend/services/notifications.ts)) — requests permission, fetches an Expo push token via `Notifications.getExpoPushTokenAsync()`, and POSTs it to `/users/me/push-token`. The handler in `app/_layout.tsx` configures foreground banner + sound + badge behavior.
- **Backend** ([`backend/app/core/notifications.py`](backend/app/core/notifications.py)) — calls `https://exp.host/--/api/v2/push/send` via FastAPI `BackgroundTasks` whenever a notification is created, gated by per-user preferences.
- **Preferences** — the `NotificationPreference` table stores per-type opt-ins (in-app and push independently) for event updates, cancellations, attendance changes, and ratings. Users manage these from the Notification settings screen.

## Documentation

Full project documentation is available at **[loganckrause.github.io/JoinMe](https://loganckrause.github.io/JoinMe/)**.
