# LukenFit

> An offline-first, resilient nutrition, fitness & wellness tracker — powered by AI and built to never lose your data.

LukenFit is a personal health companion that tracks your nutrition, workouts, weight, steps, hydration and sleep in one place. It works fully offline, syncs automatically when you're back online, and uses AI to analyze meals, suggest plans and surface insights from your data.

---

## ✨ Features

### 🍽️ Nutrition
- **Food logging** with macro tracking (calories, protein, carbs, fat)
- **AI meal analysis** — describe or photograph a meal and get an estimated macro breakdown (Google Gemini)
- **Barcode scanning** to log packaged foods instantly
- **Voice input** for hands-free logging
- **Meal templates & history search** for fast repeat entries
- **Smart meal-type detection** (breakfast / lunch / dinner) based on local time

### 🏋️ Training & Progress
- **Workout logging** with exercise analysis and personal records
- **Weight tracking** with projections, plateau detection and trend analytics
- **Body measurements** and **progress photos**
- **Step & hydration tracking**

### 🤖 AI & Analytics
- AI meal suggestions and weekly meal-plan generation
- Adaptive calorie & dynamic macro targets (TDEE-based)
- Pattern recognition, correlation analytics and performance forecasting
- Weekly reports and snapshots

### ⌚ Integrations
- **Oura Ring** sync (sleep, readiness, activity) with auto-adjustment of targets
- **Apple Health** sync support
- Weather-aware context

### 👥 Social
- Friends, activity feed, leaderboards and challenges
- Badges and shareable workout details

### 🌐 Platform
- **Offline-first** — log anything without a connection
- **Multi-language** (i18n) with browser language detection
- **PWA-ready** responsive UI

---

## 🏗️ Architecture

LukenFit is built around an **offline-first, resilient** data model with strong guarantees:

| Principle | Implementation |
|-----------|----------------|
| **Single Source of Truth** | Supabase Cloud is the definitive data source; the local cache always defers to it on conflict. |
| **The Vault** | Failed writes are queued in IndexedDB (`pending_writes`) and retried with exponential backoff — user data is never lost to a network failure. |
| **Smart cache** | Dexie.js (IndexedDB) mirrors cloud data locally with TTLs for instant reads. |
| **Timezone enforcement** | Record *dates* are pinned to Argentina time (`America/Argentina/Buenos_Aires`); meal *times* use the user's local clock by design. |
| **Zero silent failures** | Every error is caught, logged with context, and surfaced to the user. |

Serverless API routes (`/api`) proxy third-party integrations (Gemini, Oura) with durable rate limiting and token revocation, keeping secrets off the client.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript, Vite
- **Styling:** TailwindCSS, Lucide icons
- **State:** React Context + specialized custom hooks
- **Local storage:** Dexie.js (IndexedDB)
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Serverless:** Vercel functions (`/api`)
- **AI:** Google Gemini
- **Charts:** Recharts
- **i18n:** i18next
- **Testing:** Vitest + Testing Library

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) Google Gemini API key and Oura developer credentials

### Installation

```bash
git clone https://github.com/lucasfmujica/nutrition-tracker.git
cd nutrition-tracker
npm install
```

### Environment

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-key          # optional, for AI features
OURA_CLIENT_ID=your-oura-client-id      # optional, for Oura sync
OURA_CLIENT_SECRET=your-oura-secret     # optional
```

### Database

Apply the SQL schema and migrations from the `sql/` and root `supabase-*.sql` files to your Supabase project (start with `supabase-schema.sql`).

### Development

```bash
npm run dev        # start the dev server
npm run typecheck  # type-check without emitting
npm test           # run the test suite
npm run check      # typecheck + tests
npm run build      # production build
```

---

## 📁 Project Structure

```
api/          Serverless functions (Gemini & Oura proxies, health sync)
src/
  components/ UI organized by domain (Food, Workouts, Oura, Social, …)
  hooks/      Business logic in specialized hooks (useTrackerSync, useFoodEntry, …)
  context/    Global state (TrackerContext)
  services/   Domain services (AI, food APIs, TDEE calculator, …)
  utils/      Shared utilities (dateUtils, storage, …)
  i18n/       Translations
sql/          Database schema & migrations
```

### Conventions
- Functional components only; TailwindCSS for all styling
- Global state lives in Context; complex logic is extracted to custom hooks
- Files are kept under **300 lines** — refactor and split when they grow
- Dates always go through `dateUtils` to respect timezone rules

---

## 📄 License

Private project. All rights reserved.
