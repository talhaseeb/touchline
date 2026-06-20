# Touchline

**Smarter decisions from the touchline.**

Touchline is an iPad-first football (soccer) coaching assistant PWA that helps coaches manage matches, track player performance, monitor substitutions, and generate professional post-match reports — all offline, right from the touchline.

---

## Features

- **Live Match Mode** – Real-time match timer, one-tap event recording, substitution assistant
- **Player Management** – Full squad management with positions and jersey numbers
- **Team Management** – Opposition team database
- **Formation Management** – Built-in formations (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2)
- **Automatic Rating Engine** – Player ratings calculated from weighted events (1.0–10.0 scale)
- **Substitution Suggestions** – Intelligent bench recommendations sorted by position match
- **Match Timeline** – Live event log with timestamps
- **Match Reports** – Professional post-match summary with player stats table
- **PDF Export** – Branded PDF report suitable for WhatsApp sharing
- **CSV Export** – Raw event data for further analysis
- **Role-based Access** – Admin, Coach, and Captain roles with distinct permissions
- **Offline-first PWA** – Works without internet, installable on iPad

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide Icons |
| Database | Dexie.js (IndexedDB) |
| PWA | Service Worker + Web App Manifest |
| PDF | jsPDF + jspdf-autotable |
| Testing | Jest + ts-jest |

---

## Setup

```bash
git clone <repo-url>
cd touchline
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `touchline-admin` |
| Coach | `coach` | `touchline-coach` |
| Captain | `captain` | `touchline-captain` |

All data is stored locally in IndexedDB — no server required.

---

## Build & Deploy

```bash
npm run build   # Production build
npm start       # Start production server
npm test        # Run unit tests
```

**Vercel (free tier):** Import the repo at vercel.com, deploy with default Next.js settings. No environment variables needed.

---

## PWA Installation (iPad)

1. Open the deployed URL in Safari
2. Tap **Share** → **Add to Home Screen**
3. Tap **Add**

Touchline appears as a full-screen app on the home screen with offline capability.

---

## Role Permissions

| Permission | Admin | Coach | Captain |
|---|:---:|:---:|:---:|
| Manage Users | ✓ | – | – |
| Manage Players | ✓ | ✓ | – |
| Manage Teams | ✓ | ✓ | – |
| Create Matches | ✓ | ✓ | – |
| Run Live Match | ✓ | ✓ | – |
| Record Events | ✓ | ✓ | – |
| Export Reports | ✓ | ✓ | – |
| View Reports | ✓ | ✓ | ✓ |

---

## Rating Engine

Base rating: **6.0** — adjusted by event weights and clamped 1.0–10.0.

| Event | Weight |
|---|---|
| Goal | +5.0 |
| Assist | +3.0 |
| Key Pass | +2.0 |
| Interception / Tackle / Recovery | +1.0 each |
| Good Pass | +0.2 |
| Bad Pass | −0.2 |
| Lost Possession | −0.5 |
| Missed Tackle / Out Of Position / Missed Chance | −1.0 each |

---

## Project Structure

```
src/
  app/              Next.js App Router pages
  components/
    layout/         AppShell (sidebar navigation)
    match/          LiveMatch, MatchSummary
    ui/             shadcn/ui components
  db/               Dexie.js database + seeding
  hooks/            useSession, useMatchTimer
  lib/              auth, ratings, substitutions, export
  types/            Shared TypeScript types
__tests__/          Jest unit tests
public/
  manifest.json     PWA manifest
  sw.js             Service worker
```

---

## Future Roadmap

- **v2** – Cloud sync, multi-device support
- **v3** – AI-generated narrative match reports, video clip attachment
- **v4** – Season analytics, player heatmaps
- **v5** – Attendance tracking, training session management
