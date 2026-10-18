# Personalized Language Learning App (Reels-Style PWA)

🇬🇧 English · 🇧🇬 [Български](README.bg.md)

**Ezik** is an open-source web app (Next.js 15 PWA + Python content factory + Supabase/PostgreSQL) for learning a language from absolute zero (`A0 → A1 → A2`) through a vertical feed of interactive cards, just like Reels / TikTok (`scroll-snap-type: y mandatory`).

The first course is **Spanish**, built for Bulgarian and English speakers — but the app is language-agnostic, and **you can add any language you want** (see [Adding new languages](#-adding-new-languages)).

Every card takes **8–15 seconds** and combines **real, properly licensed photos**, **neural audio** at normal (`1.0x`) and slow (`0.75x` 🐢) speed, an **X-ray dictionary on every word you tap** (`XRaySheet`), and the research-backed long-term memory algorithm **FSRS v5 (`ts-fsrs`)**.

---

## ✨ Key features

- **Vertical Reels feed (`/`):** full-screen interactive cards in 10 teaching formats:
  1. `sound_rule` — reading and pronunciation rules with audio examples.
  2. `visual_word` — a word with a photo, colour-coded gender (`el` in blue, `la` in coral), a cognate and a mini-sentence.
  3. `phrase_situation` — a real-life situation (café, airport, hotel, meeting someone).
  4. `micro_builder` — tap-to-snap magnetic blocks to build a sentence.
  5. `diglot_weave` — bridge sentences (English context with Spanish words woven in).
  6. `story_xray` — a 3-sentence micro-story with an interactive X-ray on every word.
  7. `audio_blur` — listening recognition with blurred text that is revealed after you answer.
  8. `say_it` — speak out loud (Web Speech recognition `es-ES` or self-assessment).
  9. `shadowing` — speak along with karaoke-style word highlighting (`word_timings`).
  10. `trap_choice` — classic beginner traps (`ser` vs `estar`, false friends, gender exceptions).
- **X-ray on every word (`XRaySheet`):** tapping any Spanish word opens a bottom sheet with pronunciation, English and Bulgarian translation, a language bridge (`bg_bridge`), audio (`1x` and `0.75x`) and an `✓ I already know this` button.
- **FSRS v5 memory + short-term Echo loop:** a word you get wrong comes back 3–5 cards later in a different format, and long-term review is scheduled automatically based on memory strength (`0–5` bars).
- **A curriculum of 20 packs (`/today`):** a structured programme from Pack 01 to Pack 20, with automatic unlocking at 75% coverage — or pick any pack at any time.
- **Personal dictionary (`/words`):** search, filter by status (`all`, `learning`, `due`, `mastered`), memory-strength indicator `0–5`, audio and quick "already known" marking.
- **Personalized:** daily goal, number of new words per day, voice accent (`es-ES` / `es-MX`), autoplay, slow-audio default, "on the subway without headphones" mute mode, and how much native-language help you want.

---

## 🏗️ Project structure

```text
├── apps/
│   └── web/                  # Next.js 15 (App Router, TypeScript, PWA)
│       ├── public/
│       │   ├── audio/es/     # Generated MP3 files for Spanish pronunciation
│       │   └── images/es/    # Locally cached, licensed photos for the words
│       └── src/
│           ├── app/          # Screens (/, /today, /words, /settings, /login) and API routes
│           ├── components/   # FeedContainer, FeedCardRenderer, XRaySheet, AudioButton, Nav
│           └── lib/          # FSRS v5 (fsrs.ts), Feed Mixer (mixer.ts), Auth, Audio, Types
├── services/
│   └── worker/               # Python CLI factory for content, images and neural audio
│       ├── src/ezik_worker/  # Pydantic models, validators, Wikimedia/Pixabay, edge-tts, Claude API
│       └── tests/            # Pytest tests for validators and card schemas
├── database/
│   └── migrations/
│       └── 001_ezik_app_init.sql  # Full PostgreSQL / Supabase schema (ezik_app_*)
├── deploy/                   # Docker Compose, Nginx config and deploy script
├── SPEC.md                   # Full technical and teaching specification
└── PLAN.md                   # Product plan and methodology
```

---

## 🚀 Quick start (run it locally)

### 1. Requirements
- **Node.js 20+** and `npm`
- **Python 3.12+** and [`uv`](https://docs.astral.sh/uv/) (for the Python worker)
- A **Supabase** project (cloud or self-hosted PostgreSQL with PostgREST)

### 2. Database and `.env` setup
1. Run the SQL migration [`database/migrations/001_ezik_app_init.sql`](database/migrations/001_ezik_app_init.sql) in your Supabase SQL Editor.
2. Copy `.env.example` to `.env` in the project root and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   At minimum you need `SUPABASE_URL`, `SERVICE_ROLE_KEY` and `SESSION_SECRET`.
3. Create a user in the `ezik_app_users` table (e.g. via the SQL Editor with a `bcrypt` hash of the password).

### 3. Seed the curriculum, images and audio (optional)
Starter photos and audio files for Packs 01–05 are already included in `apps/web/public/`. To seed your database or generate new packs:
```bash
cd services/worker
uv run worker seed-curriculum
uv run worker fetch-images --force --limit 100
uv run worker generate-audio --limit 100
uv run worker generate-cards
```

### 4. Start the web app
```bash
cd apps/web
npm install
npm run dev
```
Open `http://localhost:3006` (or whichever port you started it on).

---

## 🌍 Adding new languages

Spanish is just the first course. **You can add any language — just ask your AI to add it.**

Open the project in your AI coding assistant (Claude Code, Cursor, Codex, Gemini CLI, etc.) and say something like:

> "Add Italian as a new target language, with the same 20-pack structure as Spanish, and generate the images, audio and cards for it."

The architecture is ready for this:
- Every core table (`ezik_app_packs`, `ezik_app_items`, `ezik_app_cards`, `ezik_app_settings`) has a `target_lang` column.
- New packs go into `services/worker/src/ezik_worker/curriculum.py` with the language code; the worker then fetches images, generates neural audio and builds the cards.
- `SPEC.md` describes the card formats and teaching method in detail, so your AI has everything it needs to follow the same approach.

The same goes for the helper language: the current version explains Spanish through English and Bulgarian, but you can ask your AI to switch the helper language to your own native language.

---

## 🛠️ Developing and improving the project

- **Add new words and packs with AI:** run `uv run worker seed-curriculum --ai-pack es_06 --count 25 --max-usd 1.00`, then `fetch-images`, `generate-audio` and `generate-cards`.
- **Run the tests:**
  - Python worker: `cd services/worker && uv run --extra dev pytest -q`
  - Next.js front-end build and types: `cd apps/web && npm run build`

---

## 📄 License
This project is released under the **MIT License** — anyone is free to use, modify, improve and share it.

---

## 🇧🇬 Накратко на български

**Ezik** е безплатно приложение с отворен код за учене на чужд език от нулата чрез вертикална лента от кратки интерактивни карти, като в Reels/TikTok. Всяка карта отнема 8–15 секунди и съчетава снимка, произношение от носител (нормално и бавно), превод при докосване на всяка дума и научен алгоритъм за дългосрочно запомняне (FSRS). Първият курс е испански за българи, но можете да добавите **всеки език**: просто кажете на своя ИИ асистент да го добави.

👉 Пълното описание на български: [README.bg.md](README.bg.md)
