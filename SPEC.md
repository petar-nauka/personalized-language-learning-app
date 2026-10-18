# SPEC.md — Complete Technical and Product Specification ("Like a Local" / `ezik.example.com`)

> **Purpose of this document:** An exhaustive specification for an AI developer agent. All architectural decisions, SQL schemas, JSON contracts, prompts, memory (FSRS) and feed-mixing algorithms, API routes and UI components are defined here without ambiguity.
> **Related files:** [PLAN.md](PLAN.md) (product framework) · [README.md](README.md) (quick start).

---

## 1. Product Concept and Pedagogical Model (Spanish from Scratch: A0 → A1 → A2)

### 1.1. What we are building now and why it is built this way
1. **Target language for v1:** **Spanish from absolute zero (`target_lang = 'es'`, level `A0 → A1 → A2`)**.
   - The architecture supports multiple languages and levels (`target_lang`, `ui_lang`, `cefr`) in every table and API route, so that **English C1** (business, AI, philosophy, books) can be added at a later stage without changing the database or the interface.
2. **Interface and explanation language (`ui_lang = 'en'` + a Bulgarian "bridge"):**
   - **Primary app language:** **English (`en`)** — menus, instructions, translations and core explanations.
   - **Why English → Spanish (laddering):** English and Spanish share more than **3,000 Latin-derived words (cognates)** (*hotel, restaurante, animal, hospital, importante, idea, problema, information/información*) and have similar word order (*I want a coffee* → *Quiero un café*). This way the author practices English passively while learning Spanish from scratch.
   - **When the Bulgarian "bridge" (`bg_bridge`) is also shown:** Only where Bulgarian offers a direct advantage over English:
     - **Pronunciation and phonetics:** The Spanish vowels (*a, e, i, o, u*) sound like the Bulgarian *а, е, и, о, у*; *ñ* = *нь* (as in *баня*, "bathroom"); *ll* = *й* (English "y"); *j* = *х* (a hard "h"); *h* is silent.
     - **Grammatical similarities with Bulgarian:** Pronoun dropping (*Hablo español* = *Говоря испански* "I speak Spanish", with no need for *Yo*), reflexive verbs with *me/te/se* (= the Bulgarian *се/си*, e.g. *Me llamo* = *Казвам се* "My name is"), grammatical gender of objects (*el/la*), the polite form (*tú* = *ти*, *usted* = *Вие*).
3. **Feed format:**
   - **Like Reels / TikTok (`100dvh`, vertical snap scrolling with `scroll-snap-type: y mandatory`)** — one full-screen interactive card at a time.
   - Each card can be completed in **5 to 20 seconds with one thumb**.
   - **Daily goal:** **15–30 minutes a day** (default 20 min ≈ 50–70 micro-cards).
4. **Visual memory (Image → Word/Situation):**
   - Every core word, phrase and real-life situation is accompanied by a **clear, concrete photo** from free, openly licensed image libraries (**Wikimedia Commons, Pixabay, Pexels, Unsplash**).
   - The goal is for the brain to link the Spanish sound and word **directly to the mental image** (you see a cat → you hear and see *el gato*; you see a cup of espresso at a bar → *Un café solo, por favor*), not just to a translation.

---

### 1.2. The pedagogical ladder: 5 stages from A0 to stories (`stage` 0 → 4)

When someone starts from **absolute zero (A0)**, they cannot read paragraphs of Spanish on Day 1. That is why the feed automatically progresses through **5 levels of complexity (`stage`)** and **20 themed packs (`ezik_app_packs`)**:

| Stage (`stage`) | When it is active | What you learn | Main card types |
| --- | --- | --- | --- |
| **Stage 0: Sound, Reading and "Transparent Words"** | The first ~25 cards (Day 1) | How to read any Spanish word (the 10 rules for *h, ñ, ll/y, j, ge/gi, c/z, qu, gue/gui, rr, v/b, stress*) + 30 "transparent words" (cognates) you already know from English/Bulgarian (*el hotel, el café, el restaurante, el taxi, la música, importante*) | `sound_rule`, `visual_word` |
| **Stage 1: Visual Core (The First 150 Words)** | From 25 to ~150 learned items | The most frequent nouns (people, food, city, home, nature), present-tense verbs (*ser, estar, tener, querer, ir, hablar, comer, vivir*), adjectives and the numbers 1–20. Every noun has **color-coded gender** (**blue for `el`**, **coral for `la`**) + a photo | `visual_word`, `trap_choice`, `audio_blur` |
| **Stage 2: Survival and Real-Life Situations (Survival Chunks)** | After the first 40 words (mixed with Stage 1) | Ready-made conversational chunks for real life: greetings, ordering at a café/restaurant (*Quiero…, La cuenta, por favor*), asking for directions (*¿Dónde está…?*), prices (*¿Cuánto cuesta?*), introducing yourself (*Me llamo…, Soy de…*), politeness | `phrase_situation`, `micro_builder`, `say_it` |
| **Stage 3: "The Bridge" — Diglot Weave and Micro-Stories** | After ~100 learned items | 1) **Diglot Weave:** Short, curious sentences in English with familiar Spanish words woven directly into them.<br/>2) **Micro-stories with X-ray (15–35 words):** Short dialogues and facts in 100% Spanish where **every word is tappable** for an instant translation and grammar note | `diglot_weave`, `story_xray` |
| **Stage 4: Free Comprehension and Speaking (A1 → A2)** | After ~250 learned items | Longer stories (40–70 words), listening with blurred text at natural speed, actively saying things out loud (Web Speech API), and telling apart *ser vs. estar*, *por vs. para*, the past tense | `story_xray`, `audio_blur`, `say_it`, `shadowing`, `trap_choice` |

---

### 1.3. Curriculum: The first 20 packs (`ezik_app_packs`, ~1,000 items)

The learning items (`ezik_app_items`) are organized into **20 sequential packs**. The user always has **1 or 2 "active packs"** from which the feed serves new words/phrases (10–15 new items per session), while all previous packs are reviewed automatically through FSRS:

1. **Pack 01 — Read & Speak Spanish in 10 Minutes (`stage 0`):** 12 sound/spelling rules (*hola, mañana, calle, trabajo, queso, guitarra, cerveza, perro, baño*) + 25 international words (*el café, el hotel, el restaurante, el hospital, el aeropuerto, el taxi, el tren, el autobús, el banco, el museo, la universidad, la música, la idea, el problema*).
2. **Pack 02 — Greetings, Courtesy & Survival Basics (`stage 1–2`):** *hola, buenos días, buenas tardes, buenas noches, adiós, hasta luego, por favor, muchas gracias, de nada, perdón, disculpe, sí, no, claro, vale, ¿habla inglés?, no entiendo, más despacio*.
3. **Pack 03 — Who I Am (`ser`, `llamarse`, origin & professions) (`stage 1–2`):** *yo soy, tú eres, él/ella es, me llamo, ¿cómo te llamas?, soy de Bulgaria, vivo en Sofía, hablo inglés y un poco de español, encantado/a*.
4. **Pack 04 — At the Café & Restaurant (`querer`, food & drinks) (`stage 1–2`):** *el agua, el café con leche, el té, la cerveza, el vino tinto, el pan, el pollo, la ensalada, el desayuno, la cena, quiero…, para mí, ¿qué recomienda?, la cuenta, por favor*.
5. **Pack 05 — Everyday Objects, Places & Gender (`el` vs `la`, `un` vs `una`) (`stage 1`):** *la casa, la calle, la ciudad, el edificio, la habitación, la llave, la mesa, la silla, el libro, el teléfono, el coche, el gato, el perro, el árbol, el sol, el mar*.
6. **Pack 06 — Numbers, Prices, Time & Days (`stage 1–2`):** the numbers 1–100, *¿cuánto cuesta?, es barato, es caro, pagar con tarjeta, en efectivo, ¿qué hora es?, hoy, mañana, ayer, lunes… domingo*.
7. **Pack 07 — Getting Around Town (`estar`, `ir`, directions) (`stage 1–2`):** *¿dónde está…?, el baño, la estación, la parada, la playa, el centro, a la izquierda, a la derecha, todo recto, cerca, lejos, voy a…, vamos*.
8. **Pack 08 — Core Verbs in Action (Present Tense `-ar`, `-er`, `-ir`) (`stage 2–3`):** *hablar, trabajar, estudiar, comprar, caminar, comer, beber, leer, aprender, comprender, vivir, abrir, escribir*.
9. **Pack 09 — `Ser` vs. `Estar` & Describing Things (`stage 2–3`):** *es grande/pequeño, es bueno/malo, es interesante, está abierto/cerrado, está caliente/frío, estoy cansado/a, estoy listo/a, estoy bien*.
10. **Pack 10 — Family, People & Possessives (`mi`, `tu`, `su`, `tener`) (`stage 2–3`):** *el amigo, la familia, el padre, la madre, el hermano, el hijo, la mujer, el hombre, la gente, tengo…, tienes…, tiene hambre/sed/frío/razón*.
11. **Pack 11 — Likes & Preferences (`me gusta / me encanta`) (`stage 3`):** *me gusta, no me gusta, me encanta, te gusta, prefiero, me parece bien, qué interesante*.
12. **Pack 12 — Daily Routine & Reflexive Verbs (`me levanto`, `se`) (`stage 3`):** *despertarse, levantarse, ducharse, vestirse, ir al trabajo, volver a casa, acostarse, temprano, tarde, siempre, nunca, a veces*.
13. **Pack 13 — Shopping, Clothes & Colors (`stage 3`):** *la camisa, los zapatos, la talla, probarse, rojo, azul, negro, blanco, verde, amarillo, otro, mismo*.
14. **Pack 14 — Weather, Seasons & Nature (`hace calor`, `llueve`) (`stage 3`):** *el tiempo, hace calor, hace frío, hace sol, llueve, la montaña, el río, el bosque, el cielo, la lluvia*.
15. **Pack 15 — Health, Body & Emergencies (`me duele`, `necesito`) (`stage 3`):** *la cabeza, el estómago, me duele, la farmacia, el médico, necesito ayuda, es urgente*.
16. **Pack 16 — Making Plans & Near Future (`ir a + infinitivo`, `poder`, `querer`) (`stage 3–4`):** *voy a viajar, ¿puedes ayudarme?, ¿quieres tomar algo?, este fin de semana, la semana que viene, quedar con amigos*.
17. **Pack 17 — Connectors & Conversational Glue (`stage 3–4`):** *porque, pero, aunque, además, entonces, por eso, sin embargo, en realidad, por ejemplo, creo que, pienso que*.
18. **Pack 18 — Talking About the Past I (`he hecho` / `fui`, `hice`, `tuve`) (`stage 4`):** *hoy he comido, alguna vez, ayer fui, estuve, hice, dije, vi, fue increíble*.
19. **Pack 19 — Stories, Culture & Curious Facts in Simple Spanish (`stage 4`):** 150 high-frequency words for reading short stories about Spain, Latin America, science, nature and everyday life.
20. **Pack 20 — Opinions, Books, Technology & Ideas in Simple Spanish (`stage 4`):** *la inteligencia artificial, el futuro, el mundo, cambiar, pensar, explicar, estar de acuerdo, tener sentido*.

---

## 2. Architecture and Tech Stack

### 2.1. Repository structure (`lang-feed`)

```text
/
├── apps/
│   └── web/                        # Next.js 16 (App Router) + React + TypeScript PWA
│       ├── public/
│       │   ├── manifest.json       # PWA manifest
│       │   ├── sw.js               # Service Worker (offline cache for ~20 cards + Web Push)
│       │   └── icons/              # PWA icons (192x192, 512x512, maskable)
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css     # CSS variables only (dark and light theme)
│       │   │   ├── layout.tsx      # Root layout (Onest + Literata fonts)
│       │   │   ├── page.tsx        # Main screen: the Reels feed (/)
│       │   │   ├── login/page.tsx  # Password login (/login)
│       │   │   ├── today/page.tsx  # Daily progress, streak, active pack (/today)
│       │   │   ├── words/page.tsx  # "My Words & Phrases" + browse by pack (/words)
│       │   │   ├── settings/page.tsx # Settings (/settings)
│       │   │   └── api/
│       │   │       ├── auth/login/route.ts
│       │   │       ├── auth/logout/route.ts
│       │   │       ├── feed/route.ts         # Feed mixer (returns a batch of 10 cards)
│       │   │       ├── events/route.ts       # Event logging + FSRS update
│       │   │       ├── items/route.ts        # List/filter words and phrases
│       │   │       ├── items/[id]/route.ts   # Manual override ("I know this" / "Reset")
│       │   │       ├── packs/route.ts        # List of the 20 packs and progress in each
│       │   │       ├── today/route.ts        # Daily stats and streak
│       │   │       ├── settings/route.ts     # Read/write settings
│       │   │       └── echo/route.ts         # Generate a dynamic Echo card on demand
│       │   ├── components/
│       │   │   ├── FeedContainer.tsx         # Reels scroll-snap container + keyboard/gestures
│       │   │   ├── TopProgressBar.tsx        # Thin bar for the daily goal (15-30 min) + sound
│       │   │   ├── BottomNav.tsx             # Navigation: Feed · Today · Words · Settings
│       │   │   ├── XRaySheet.tsx             # Bottom sheet when a word/phrase is tapped
│       │   │   ├── AudioButton.tsx           # Audio playback (normal + 0.75x slow!)
│       │   │   └── cards/
│       │   │       ├── SoundRuleCard.tsx     # 1. Letter/sound + 3 audio examples + mini-quiz
│       │   │       ├── VisualWordCard.tsx    # 2. Photo + gender-colored word + audio + quiz
│       │   │       ├── PhraseSituationCard.tsx # 3. Situation photo + phrase + when to say it
│       │   │       ├── MicroBuilderCard.tsx  # 4. Magnetic tiles (assemble the phrase)
│       │   │       ├── DiglotWeaveCard.tsx   # 5. English sentence with woven-in Spanish words
│       │   │       ├── StoryXRayCard.tsx     # 6. Short story with tappable words + question
│       │   │       ├── AudioBlurCard.tsx     # 7. Hear before you see (blurred text)
│       │   │       ├── SayItCard.tsx         # 8. Say it out loud → flip and self-grade
│       │   │       ├── ShadowingCard.tsx     # 9. Voice echo with Web Speech API (es-ES)
│       │   │       └── TrapChoiceCard.tsx    # 10. Pick the correct expression / grammar trap
│       │   └── lib/
│       │       ├── auth.ts                   # Session cookies (HMAC-SHA256 with SESSION_SECRET)
│       │       ├── db.ts                     # Server-side Supabase/Postgres client (SERVICE_ROLE_KEY)
│       │       ├── fsrs.ts                   # Wrapper around ts-fsrs for computing intervals
│       │       ├── mixer.ts                  # The feed algorithm (adaptive by Stage 0..4)
│       │       ├── audio.ts                  # Player supporting 1.0x and 0.75x + Web Speech fallback
│       │       └── types.ts                  # All TypeScript types for cards and the API
│       ├── Dockerfile
│       ├── next.config.ts
│       └── package.json
├── services/
│   └── worker/                     # Python 3.12 (uv) factory for content, images and audio
│       ├── pyproject.toml
│       ├── src/ezik_worker/
│       │   ├── cli.py              # Entry point (`uv run worker ...`)
│       │   ├── config.py           # Loads .env
│       │   ├── db.py               # Connection to Supabase (httpx / psycopg)
│       │   ├── models.py           # Pydantic schemas for all 10 card types
│       │   ├── curriculum.py       # Definition of the 20 packs and generation of seed items
│       │   ├── claude_client.py    # Claude Sonnet 5.5 / Haiku 5.5 + Batch API + --max-usd
│       │   ├── images.py           # Image search: Pixabay, Wikimedia Commons, Pexels
│       │   ├── validators.py       # Checks JSON, word level, Spanish punctuation
│       │   └── tts.py              # Local Kokoro-82M (es) + Edge/Google/OpenAI TTS fallback
│       └── tests/
├── database/
│   └── migrations/
│       └── 001_ezik_app_init.sql   # Full schema of all ezik_app_* tables
├── deploy/
│   ├── docker-compose.yml          # web container (127.0.0.1:3012) + tools profile (worker)
│   ├── nginx/
│   │   └── ezik.example.com.conf
│   └── push.sh                     # Uploads the code and audio to the VPS
├── .env.example
├── PLAN.md
└── SPEC.md
```

### 2.2. Deployment on the VPS
- **Domain:** `https://ezik.example.com` (DNS A record → `<YOUR_VPS_IP>`).
- **Web container port on the VPS:** `127.0.0.1:3012:3000` (check with `ss -tlnp` before starting that there is no conflict).
- **Server directory:** `/docker/lang-feed`.
- **Audio files:** generated locally on the author's computer (via Kokoro-82M or a TTS script) into `audio/es/` and synced with `rsync` to `/var/lib/lang-feed/audio/es/` on the VPS. Nginx serves `/audio/` directly from disk with `Cache-Control: public, max-age=31536000, immutable`.
- **Database:** The existing container `<your-supabase-db-container>` (`https://your-project.supabase.co`), schema `public`, owner `supabase_admin`. All tables are prefixed with `ezik_app_`.

---

## 3. Full Database Schema (`database/migrations/001_ezik_app_init.sql`)

The migration is run as `supabase_admin`:
```bash
ssh vps1 "docker exec -i <your-supabase-db-container> psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1" < database/migrations/001_ezik_app_init.sql
```

### 3.1. SQL DDL (`001_ezik_app_init.sql`)

```sql
-- 001_ezik_app_init.sql
-- Schema for "Like a Local" (ezik.example.com)
-- All tables use the ezik_app_ prefix and have RLS enabled with no public policies.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users
CREATE TABLE IF NOT EXISTS public.ezik_app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_users ENABLE ROW LEVEL SECURITY;

-- 2. User settings and current progress (per target language)
CREATE TABLE IF NOT EXISTS public.ezik_app_settings (
    user_id UUID NOT NULL REFERENCES public.ezik_app_users(id) ON DELETE CASCADE,
    target_lang TEXT NOT NULL DEFAULT 'es',           -- 'es' (now), 'en' (next goal)
    ui_lang TEXT NOT NULL DEFAULT 'en',               -- 'en' (primary interface), 'bg'
    current_cefr TEXT NOT NULL DEFAULT 'A0',          -- 'A0', 'A1', 'A2', 'B1', 'B2', 'C1'
    current_stage INT NOT NULL DEFAULT 0,             -- 0..4 (automatic or manual)
    active_pack_code TEXT NOT NULL DEFAULT 'es_01',   -- current learning pack
    daily_minutes_goal INT NOT NULL DEFAULT 20,       -- 15..30 min/day
    daily_new_items_limit INT NOT NULL DEFAULT 15,    -- max. new words/phrases per day
    voice_accent TEXT NOT NULL DEFAULT 'es-ES',       -- 'es-ES' or 'es-MX' (for en: 'en-US')
    audio_autoplay BOOLEAN NOT NULL DEFAULT true,     -- autoplay audio on a new card
    audio_slow_default BOOLEAN NOT NULL DEFAULT false,-- 0.8x speed for absolute beginners
    muted BOOLEAN NOT NULL DEFAULT false,             -- "on the subway without headphones" mode
    bg_helper_level INT NOT NULL DEFAULT 1,           -- 0=EN only, 1=EN + BG bridges, 2=always show BG translation too
    theme TEXT NOT NULL DEFAULT 'dark',               -- 'dark' | 'light'
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    push_subscription JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_lang)
);
ALTER TABLE public.ezik_app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Learning packs (structured curriculum from Pack 01 to Pack 20)
CREATE TABLE IF NOT EXISTS public.ezik_app_packs (
    code TEXT PRIMARY KEY,                            -- e.g. 'es_01', 'es_02' ... 'es_20'
    target_lang TEXT NOT NULL DEFAULT 'es',
    seq_order INT NOT NULL,                           -- 1..20
    stage INT NOT NULL,                               -- 0..4
    cefr TEXT NOT NULL DEFAULT 'A0',                  -- 'A0', 'A1', 'A2'
    title_en TEXT NOT NULL,                           -- e.g. 'Read & Speak Spanish in 10 Minutes'
    title_bg TEXT NOT NULL,
    description_en TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'sparkles',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_packs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_packs_lang_seq ON public.ezik_app_packs(target_lang, seq_order);

-- 4. Language items (words, phrases, sound rules, grammar patterns)
CREATE TABLE IF NOT EXISTS public.ezik_app_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_lang TEXT NOT NULL DEFAULT 'es',
    pack_code TEXT REFERENCES public.ezik_app_packs(code) ON DELETE SET NULL,
    seq_order INT NOT NULL DEFAULT 0,                 -- order of introduction within the pack
    kind TEXT NOT NULL CHECK (kind IN (
        'sound_rule',     -- letter / reading rule (ñ, ll, h, j, qu...)
        'cognate',        -- transparent word (el hotel, el restaurante, importante)
        'noun',           -- noun with article (el gato, la casa)
        'verb',           -- verb or high-frequency form (quiero, tengo, está)
        'adjective',      -- adjective (grande, bueno, abierto)
        'survival_phrase',-- ready-made conversational phrase (Un café con leche, por favor)
        'grammar_pattern',-- pattern (me gusta + inf, ir a + inf, ser vs estar)
        'connector'       -- discourse connector (porque, pero, entonces)
    )),
    text TEXT NOT NULL,                               -- e.g. 'el gato', 'Un café, por favor', 'ñ'
    lemma TEXT NOT NULL,                              -- base form: 'gato', 'café', 'ñ'
    article TEXT CHECK (article IN ('el', 'la', 'los', 'las', NULL)), -- for gender color coding
    phonetic_hint TEXT,                               -- e.g. '[ел ГА-то]' (Cyrillic hint) or 'ma-NYA-na'
    en_gloss TEXT NOT NULL,                           -- meaning in English: 'the cat'
    bg_gloss TEXT NOT NULL,                           -- meaning in Bulgarian: 'котката' (the cat)
    en_explain TEXT,                                  -- short explanation in EN (cognate / structure)
    bg_bridge TEXT,                                   -- short note on why it is easy/tricky from a Bulgarian perspective
    example_text TEXT,                                -- mini-example in Spanish (3-7 words)
    example_en TEXT,                                  -- English translation of the example
    cefr TEXT NOT NULL DEFAULT 'A0',
    frequency_rank INT,                               -- 1..5000 by frequency
    image_url TEXT,                                   -- photo URL (Pixabay / Wikimedia / Pexels)
    image_source TEXT,                                -- 'pixabay' | 'wikimedia' | 'pexels' | 'unsplash'
    image_license TEXT,                               -- 'Pixabay License' | 'CC0' | 'CC BY-SA 4.0'
    image_author TEXT,
    audio_url TEXT,                                   -- '/audio/es/items/<id>.mp3'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (target_lang, text, kind)
);
ALTER TABLE public.ezik_app_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_items_pack ON public.ezik_app_items(target_lang, pack_code, seq_order);

-- 5. Feed cards
CREATE TABLE IF NOT EXISTS public.ezik_app_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_lang TEXT NOT NULL DEFAULT 'es',
    card_type TEXT NOT NULL CHECK (card_type IN (
        'sound_rule',
        'visual_word',
        'phrase_situation',
        'micro_builder',
        'diglot_weave',
        'story_xray',
        'audio_blur',
        'say_it',
        'shadowing',
        'trap_choice'
    )),
    stage INT NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 4),
    pack_code TEXT REFERENCES public.ezik_app_packs(code) ON DELETE SET NULL,
    cefr TEXT NOT NULL DEFAULT 'A0',
    topic TEXT NOT NULL DEFAULT 'basics',             -- 'sounds', 'cafe', 'travel', 'city', 'home', 'people', 'nature', 'stories'
    content JSONB NOT NULL,                           -- follows the strict JSON schema for the given card_type
    image_url TEXT,
    image_source TEXT,
    image_license TEXT,
    image_author TEXT,
    audio_url TEXT,                                   -- '/audio/es/cards/<id>.mp3'
    word_timings JSONB,                               -- [{"word": "Un", "start_ms": 0, "end_ms": 220}, ...]
    source_url TEXT,
    source_license TEXT,
    ai_model TEXT,
    status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('draft', 'ok', 'flagged', 'rejected')),
    sort_key BIGINT NOT NULL DEFAULT (floor(random() * 9000000000000000)::bigint),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_cards ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_cards_feed ON public.ezik_app_cards(target_lang, status, stage, pack_code, card_type);
CREATE INDEX IF NOT EXISTS idx_ezik_app_cards_sort ON public.ezik_app_cards(target_lang, status, sort_key);

-- 6. Card <-> language item link
CREATE TABLE IF NOT EXISTS public.ezik_app_card_items (
    card_id UUID NOT NULL REFERENCES public.ezik_app_cards(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.ezik_app_items(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'target' CHECK (role IN ('target', 'support')),
    PRIMARY KEY (card_id, item_id)
);
ALTER TABLE public.ezik_app_card_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_card_items_item ON public.ezik_app_card_items(item_id, role);

-- 7. User memory (FSRS state for every encountered word/phrase)
CREATE TABLE IF NOT EXISTS public.ezik_app_item_state (
    user_id UUID NOT NULL REFERENCES public.ezik_app_users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.ezik_app_items(id) ON DELETE CASCADE,
    state INT NOT NULL DEFAULT 0,                     -- ts-fsrs State: 0=New, 1=Learning, 2=Review, 3=Relearning
    due TIMESTAMPTZ NOT NULL DEFAULT now(),
    stability DOUBLE PRECISION NOT NULL DEFAULT 0,
    difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
    elapsed_days INT NOT NULL DEFAULT 0,
    scheduled_days INT NOT NULL DEFAULT 0,
    reps INT NOT NULL DEFAULT 0,
    lapses INT NOT NULL DEFAULT 0,
    last_rating INT,                                  -- 1=Again, 2=Hard, 3=Good, 4=Easy
    last_review TIMESTAMPTZ,
    mastered BOOLEAN NOT NULL DEFAULT false,          -- true when "I know this" is pressed
    seen_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_id)
);
ALTER TABLE public.ezik_app_item_state ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_item_state_due ON public.ezik_app_item_state(user_id, mastered, due);

-- 8. History of viewed cards and feed events
CREATE TABLE IF NOT EXISTS public.ezik_app_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.ezik_app_users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.ezik_app_cards(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.ezik_app_items(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'view',           -- card was shown for >= 1.5 sec
        'complete',       -- the card's interaction was completed
        'tap_xray',       -- word tapped for translation/X-ray
        'answer_correct', -- correct answer on the first try
        'answer_wrong',   -- wrong answer
        'self_grade',     -- self-assessment (Again/Hard/Good/Easy)
        'know',           -- marked as "I already know this"
        'save',           -- ⭐ card/word saved
        'unsave',
        'flag',           -- ⚑ error reported in the card/photo
        'audio_play',     -- audio played
        'speak_ok'        -- phrase pronounced successfully
    )),
    rating INT CHECK (rating IN (1, 2, 3, 4, NULL)),  -- FSRS rating, if the event changes memory state
    response_ms INT,                                  -- response time in milliseconds
    dwell_ms INT,                                     -- total time spent on the card
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_events_user_card ON public.ezik_app_events(user_id, card_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ezik_app_events_user_time ON public.ezik_app_events(user_id, created_at DESC);

-- 9. Daily stats (for the Today screen and the day streak)
CREATE TABLE IF NOT EXISTS public.ezik_app_daily_stats (
    user_id UUID NOT NULL REFERENCES public.ezik_app_users(id) ON DELETE CASCADE,
    day DATE NOT NULL DEFAULT CURRENT_DATE,
    target_lang TEXT NOT NULL DEFAULT 'es',
    active_seconds INT NOT NULL DEFAULT 0,
    cards_completed INT NOT NULL DEFAULT 0,
    new_items_learned INT NOT NULL DEFAULT 0,
    reviews_completed INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    total_answers INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day, target_lang)
);
ALTER TABLE public.ezik_app_daily_stats ENABLE ROW LEVEL SECURITY;

-- 10. Queue for background jobs and failed AI attempts
CREATE TABLE IF NOT EXISTS public.ezik_app_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL,                               -- 'generate_pack' | 'fetch_images' | 'generate_echo'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);
ALTER TABLE public.ezik_app_jobs ENABLE ROW LEVEL SECURITY;
```

---

## 4. The ten card types and their JSON schemas (`ezik_app_cards.content`)

Every card in `ezik_app_cards` has a `card_type` field and a JSON `content` object. Below are the exact schemas that the Python worker generates and validates with Pydantic, and that Next.js renders.

### 4.1. Type 1: `sound_rule` — The secret code of Spanish pronunciation (Stage 0)
Shows a letter or letter combination, how it is read (in English + an exact Bulgarian sound equivalent), 3 tappable examples with photos and audio, and 1 micro-question to reinforce it.

```json
{
  "grapheme": "ll / y",
  "phonetic_en": "Sounds like 'y' in 'yes'",
  "phonetic_bg": "Звучи като българско „Й“ (пойо, каЙе, Йо)",
  "rule_title": "Double L is never an L!",
  "rule_summary": "Whenever you see 'll' in Spanish, read it as a soft 'y' (като българско „й“).",
  "examples": [
    {
      "es": "el pollo",
      "phonetic": "ел ПО-йо",
      "en": "the chicken",
      "image_url": "https://...",
      "audio_url": "/audio/es/items/pollo.mp3"
    },
    {
      "es": "la calle",
      "phonetic": "ла КА-йе",
      "en": "the street",
      "image_url": "https://...",
      "audio_url": "/audio/es/items/calle.mp3"
    },
    {
      "es": "yo me llamo",
      "phonetic": "ЙО ме Я-мо",
      "en": "my name is (I call myself)",
      "image_url": "https://...",
      "audio_url": "/audio/es/items/me_llamo.mp3"
    }
  ],
  "question": {
    "prompt": "How do you pronounce 'la lluvia' (the rain)?",
    "options": ["ла Ю-вия (with a Y sound)", "ла ЛУ-вия (with an L sound)", "ла ХУ-вия (with an H sound)"],
    "answer": 0,
    "explain": "'ll' is always pronounced like 'y' in 'yes' (българско „й“ / „ю“)."
  }
}
```

### 4.2. Type 2: `visual_word` — Visual word card with photo and gender (Stage 0–1)
A photo in the top half of the screen, a large Spanish word (for nouns, the article `el` is colored blue `--gender-m` and `la` coral `--gender-f`), pronunciation, a 3–5-word micro-sentence, and a quick question with 3 buttons.

```json
{
  "item_id": "uuid-of-el-gato",
  "es": "el gato",
  "article": "el",
  "noun": "gato",
  "phonetic": "ел ГА-то",
  "en": "the cat",
  "bg": "котката (м.р.)",
  "cognate_or_memory_tip": "Similar to English 'cat' — just starts with a soft G!",
  "bg_bridge": "В испанския има само два рода: мъжки (el, обикновено на -o) и женски (la, обикновено на -a).",
  "mini_sentence": {
    "es": "El gato duerme en el sofá.",
    "en": "The cat sleeps on the sofa.",
    "tokens": [
      {"es": "El gato", "en": "The cat", "grammar": "masculine noun"},
      {"es": "duerme", "en": "sleeps", "lemma": "dormir", "grammar": "3rd person singular"},
      {"es": "en el sofá", "en": "on the sofa", "grammar": "preposition + noun (cognate!)"}
    ]
  },
  "question": {
    "mode": "en_to_es",
    "prompt": "How do you say 'the cat' in Spanish?",
    "options": ["el gato", "el perro", "la casa"],
    "answer": 0
  }
}
```

### 4.3. Type 3: `phrase_situation` — Real-life situation with a photo (Stage 1–2)
A photo of a real situation (a café, a hotel, a street in Madrid), the key conversational phrase in Spanish, a word-by-word breakdown (X-ray), and a "When/how would you use this phrase?" question.

```json
{
  "situation_en": "You sit down at a sunny café in Madrid and the waiter comes to your table.",
  "es": "Un café con leche, por favor.",
  "phonetic": "ун ка-ФЕ кон ЛЕ-че, пор фа-ВОР",
  "en": "A coffee with milk, please.",
  "bg_bridge": "con = със, leche = мляко. В Испания 'café con leche' е класическото сутрешно кафе (50% еспресо, 50% топло мляко).",
  "tokens": [
    {"es": "Un", "en": "a / one (masc.)", "lemma": "un"},
    {"es": "café", "en": "coffee", "lemma": "el café"},
    {"es": "con", "en": "with", "lemma": "con"},
    {"es": "leche", "en": "milk", "lemma": "la leche"},
    {"es": "por favor", "en": "please (lit. 'as a favor')", "lemma": "por favor"}
  ],
  "reply_preview": {
    "waiter_es": "¡Claro! ¿Algo más?",
    "waiter_en": "Of course! Anything else?"
  },
  "question": {
    "prompt": "What does 'con leche' mean?",
    "options": ["with milk", "without sugar", "with ice"],
    "answer": 0,
    "explain": "'con' = with, 'la leche' = milk. (Tip: 'without milk' is 'sin leche')."
  }
}
```

### 4.4. Type 4: `micro_builder` — Magnetic tiles (Build the phrase) (Stage 1–3)
Shows a photo and a situation in English. The user taps the shuffled Spanish tiles (3 to 6 correct ones + 1–2 decoys) to build the sentence. On a mistake, it explains why the word order or gender is the way it is.

```json
{
  "situation_en": "Ask the waiter for the bill politely:",
  "prompt_en": "The bill, please.",
  "target_es": "La cuenta, por favor.",
  "tiles": ["La", "cuenta,", "por", "favor.", "El", "café"],
  "correct_sequence": ["La", "cuenta,", "por", "favor."],
  "phonetic": "ла КУЕН-та, пор фа-ВОР",
  "explain": "'la cuenta' is feminine (ends in -a), so we use 'La', not 'El'."
}
```

### 4.5. Type 5: `diglot_weave` — Hybrid "Bridge" card (Stage 2–3)
A short, interesting fact or thought in English in which **2–4 Spanish words/phrases** (ones the user is learning or has just seen) replace the English ones. The Spanish words are colored and tappable (they show a translation and pronunciation), with a 3-second question underneath.

```json
{
  "segments": [
    {"type": "en", "text": "In Spain, people rarely drink "},
    {"type": "es", "text": "un café con leche", "en": "a coffee with milk", "phonetic": "ун ка-ФЕ кон ЛЕ-че", "item_id": "uuid-1"},
    {"type": "en", "text": " after lunch — they usually order it in "},
    {"type": "es", "text": "la mañana", "en": "the morning", "phonetic": "ла ма-НЯ-на", "item_id": "uuid-2"},
    {"type": "en", "text": " before going to "},
    {"type": "es", "text": "el trabajo", "en": "work", "phonetic": "ел тра-БА-хо", "item_id": "uuid-3"},
    {"type": "en", "text": "."}
  ],
  "question": {
    "prompt": "Which word in the sentence means 'work'?",
    "options": ["el trabajo", "la mañana", "la leche"],
    "answer": 0,
    "explain": "'el trabajo' = work (from 'trabajar' — to work; remember 'j' is read as 'х'!)."
  }
}
```

### 4.6. Type 6: `story_xray` — Micro-story / dialogue with an X-ray of every word (Stage 3–4)
An illustrated short story or everyday dialogue in Spanish (15–30 words for A1, 35–60 words for A2).
- **Important for beginners:** Besides the 1–3 highlighted target expressions (`highlights`), **every word in the text (`tokens`) is tappable**! That way a beginner never feels stuck on an unfamiliar word.

```json
{
  "title_es": "Una mañana en Madrid",
  "title_en": "A morning in Madrid",
  "text_es": "Marco entra en un pequeño café cerca de su casa. —Buenos días. Quiero un café con leche y un cruasán, por favor. —¡Claro! Son tres euros.",
  "translation_en": "Marco enters a small café near his house. —Good morning. I want a coffee with milk and a croissant, please. —Of course! That's three euros.",
  "highlights": [
    {
      "phrase": "cerca de su casa",
      "item": "cerca de",
      "en": "near his house",
      "why": "'cerca de' = near / close to (opposite: 'lejos de' = far from).",
      "bg_bridge": "su casa = неговата/нейната/Вашата къща."
    },
    {
      "phrase": "Son tres euros",
      "item": "Son ... euros",
      "en": "That's three euros (lit. 'They are three euros')",
      "why": "For prices > 1 euro, Spanish uses plural 'Son…' ('Es un euro', but 'Son tres euros')."
    }
  ],
  "tokens": [
    {"w": "Marco", "en": "Marco"},
    {"w": "entra", "en": "enters", "lemma": "entrar"},
    {"w": "en", "en": "in / into"},
    {"w": "un", "en": "a (masc.)"},
    {"w": "pequeño", "en": "small", "phonetic": "пе-КЕ-ньо"},
    {"w": "café", "en": "café / coffee"},
    {"w": "cerca", "en": "near"},
    {"w": "de", "en": "of / from"},
    {"w": "su", "en": "his / her / your"},
    {"w": "casa.", "en": "house", "lemma": "la casa"}
  ],
  "question": {
    "prompt": "Where is the café located?",
    "options": ["Near Marco's house", "Far from the city center", "Inside the train station"],
    "answer": 0,
    "explain": "'cerca de su casa' means 'near his house'."
  }
}
```

### 4.7. Type 7: `audio_blur` — "Hear before you see" (Stage 1–4)
Plays 3–8 seconds of crystal-clear Spanish audio (with a photo for context) while the Spanish text is blurred (`filter: blur(8px)`). The user has a 🔊 (1.0x) button and a 🐢 (0.75x, slow) button and picks what the clip is about from 3 English options. Once they answer, the text smoothly comes into focus and the words light up in sync with the audio.

```json
{
  "context_en": "At the train station in Barcelona:",
  "es": "Disculpe, ¿dónde está la estación de tren?",
  "phonetic": "дис-КУЛ-пе, ДОН-де ес-ТА ла ес-та-СИОН де трен",
  "en": "Excuse me, where is the train station?",
  "question": {
    "prompt": "What is the speaker asking for?",
    "options": [
      "Where the train station is",
      "What time the train leaves",
      "How much the train ticket costs"
    ],
    "answer": 0,
    "explain": "'¿Dónde está…?' = Where is…? + 'la estación de tren' = the train station."
  }
}
```

### 4.8. Type 8: `say_it` — "Say it in your head / out loud → check" (Active Recall) (Stage 2–4)
The strongest mechanism for getting learners speaking: you see a photo and a situation in English (*"Say in Spanish: I want a table for two, please."*). You say it out loud or in your head and press **"Reveal Answer"** (it reveals the Spanish phrase, plays the audio automatically, and shows 4 self-rating buttons: **Again · Hard · Good · Easy**).

```json
{
  "situation_en": "You arrive at a restaurant with a friend.",
  "prompt_en": "A table for two, please.",
  "hint_en": "Starts with: Una mesa...",
  "target_es": "Una mesa para dos, por favor.",
  "alternative_es": "Quiero una mesa para dos, por favor.",
  "phonetic": "У-на МЕ-са па-ра ДОС, пор фа-ВОР",
  "notes": "'la mesa' = table (feminine → una mesa); 'para dos' = for two."
}
```

### 4.9. Type 9: `shadowing` — Voice echo with the microphone (Web Speech API) (Stage 2–4)
You listen to the Spanish phrase, press the microphone button and say it out loud. The browser's built-in `webkitSpeechRecognition` / `SpeechRecognition` (`lang = 'es-ES'`) compares the spoken words (ignoring punctuation and case, with a Levenshtein tolerance of ≤ 1 character for long words) and colors each recognized word green. There is always a "Skip microphone (noisy place)" button so the feed never gets blocked.

```json
{
  "es": "Buenos días, me llamo Petar y soy de Bulgaria.",
  "phonetic": "БУЕ-нос ДИ-ас, ме Я-мо Пе-тар и сой де Бул-ГА-рия",
  "en": "Good morning, my name is Petar and I am from Bulgaria.",
  "target_words": ["buenos", "días", "me", "llamo", "petar", "y", "soy", "de", "bulgaria"]
}
```

### 4.10. Type 10: `trap_choice` — Common traps (gender, `ser/estar`, pronunciation, false friends) (Stage 1–4)
A quick choice between 2 or 3 options covering typical mistakes made when learning Spanish (*el problema* is masculine despite the `-a`!; *estoy cansado* vs *soy cansado*; *tengo 30 años* vs *soy 30 años*; *embarazada* ≠ embarrassed!).

```json
{
  "situation_en": "You want to say: 'No problem!' / 'There is no problem.'",
  "prompt": "Which article goes with 'problema'?",
  "options": [
    "el problema (No hay ningún problema)",
    "la problema (No hay ninguna problema)"
  ],
  "answer": 0,
  "trap_title": "Greek words ending in -ma are Masculine!",
  "explain_en": "Even though 'problema', 'sistema', 'tema', and 'idioma' end in -a, they come from Greek and take 'el' (el problema, el idioma).",
  "bg_bridge": "Точно обратното на български: в испанския „проблем“ (el problema) и „система“ (el sistema) са от мъжки род!"
}
```

---

## 5. The feed Mixer algorithm (`apps/web/src/lib/mixer.ts`)

When the client calls `GET /api/feed?limit=10`, the server assembles a **dynamic batch of 10 cards** tailored to the user's current state:

### 5.1. Pack and stage unlocking logic (Auto-Progression)
1. The server checks `ezik_app_settings.active_pack_code` (initially `'es_01'`).
2. When **≥ 75% of the units (`ezik_app_items`) in the current Pack** have `seen_count >= 1` in `ezik_app_item_state` (or are marked `mastered = true`), the server automatically unlocks the next Pack (`es_02`, then `es_03`, and so on) and updates `current_stage` according to `ezik_app_packs.stage`.
3. At any time, from the `/words` or `/today` screen, the user can jump ahead a Pack ("Skip to next pack") or mark a word/phrase with a single button as **"I know this" (`mastered = true`)**.

### 5.2. Proportions in the 10-card batch by stage (`stage`)

| Slot in the batch (10 cards) | Stage 0 (the first 25 cards) | Stage 1–2 (Core words and survival) | Stage 3–4 (Stories, listening and speaking) |
| --- | --- | --- | --- |
| **Hidden review (FSRS `due <= now()`)** | 1–2 cards (if anything is `due`) | **2 cards (20%)** — Echo cards for words whose review is due | **2 cards (20%)** — Echo cards in a new context |
| **New units from the active Pack** | 6–7 cards (`sound_rule`, `visual_word` cognates) | **5 cards (50%)** (`visual_word`, `phrase_situation`) | **5 cards (50%)** (`story_xray`, `diglot_weave`, `phrase_situation`) |
| **Active challenge (Practice)** | 2 cards (`micro_builder`, `trap_choice`) | **3 cards (30%)** (`micro_builder`, `audio_blur`, `say_it`, `trap_choice`) | **3 cards (30%)** (`audio_blur`, `say_it`, `shadowing`, `micro_builder`, `trap_choice`) |

### 5.3. Strict ordering rules within the 10-card batch
1. **Introduce before testing:** If a word (`item_id`) has never been seen (`seen_count == 0`), the first card for it **must** be an introductory one (`visual_word`, `sound_rule`, `phrase_situation`, `diglot_weave`), **not** `say_it` or `micro_builder`.
2. **Immediate echo (short-term loop):** When a new word is introduced at position `i` (e.g. card #2 is a `visual_word` for *la cuenta*), the Mixer tries to place an active card (`micro_builder` or `audio_blur`) that uses the same word at position `i + 4` or `i + 5` (e.g. card #7)! That way the word sticks within the same session.
3. **Variety (interleaving):** Never 2 cards of the same `card_type` in a row (the only exception is in the first 10 cards of `Stage 0`, between `sound_rule` and `visual_word`).
4. **"Muted" mode (`muted = true`):** If the user has turned on the "Mute" button in the top bar (e.g. in a public place without headphones), the Mixer excludes `audio_blur` and `shadowing` cards.
5. **No repeating the same card:** Cards that have a `complete` record in `ezik_app_events` within the last 14 days are not shown again (unless there is no other card available for a `due` review).

---

## 6. The memory engine (`ts-fsrs` in `apps/web/src/lib/fsrs.ts`)

Uses the open-source `ts-fsrs` library (version `^4.x`) with a retention target of `request_retention = 0.90` and short-term steps enabled (`enable_short_term = true`).

### 6.1. Rating table (how every action in the feed becomes an FSRS `Rating`)

| User action on the card | Rating for `ts-fsrs` | What happens to the word's interval |
| --- | --- | --- |
| Tapping a word in a text to see its translation (`tap_xray`) | `Rating.Again (1)` | The word is flagged as unknown → comes back after ~10 min / in the next session in a new card |
| Wrong answer to a question or a failed `micro_builder` | `Rating.Again (1)` | Comes back for review after ~10 min |
| Correct answer, but after hesitation (`response_ms > 9000`) or after using a hint | `Rating.Hard (2)` | Shorter interval (e.g. 1 day) |
| Correct on the first try (`response_ms <= 9000`) | `Rating.Good (3)` | Standard interval: 1 day → 3 days → 8 days → 21 days |
| Self-rating on a `say_it` card | `Again / Hard / Good / Easy` | According to the button the user picked |
| **"I know this"** button (or long-press on a word) | `Rating.Easy (4)` + `mastered = true` | Leaves active review (no longer shown as a learning target unless manually reset) |

### 6.2. "Word strength" scale (0 to 5 bars in the UI)
To keep the interface intuitive on the `/words` screen:
- **0 (New):** Not encountered yet.
- **1 (Just met):** `state == 1` (Learning) or `stability < 1` day.
- **2 (Familiar):** `stability` between 1 and 4 days.
- **3 (Growing):** `stability` between 4 and 14 days.
- **4 (Strong):** `stability` between 14 and 30 days.
- **5 (Mastered):** `stability >= 30` days or `mastered == true`.

---

## 7. The content, image and audio factory (`services/worker/`)

### 7.1. Python worker commands (`uv run worker ...`)

```bash
# 1. Create the 20 Packs and the 1,000 core Spanish units (A0 -> A2)
uv run worker seed-curriculum --lang es --packs 1..5 --max-usd 3.00

# 2. Automatically find and check images for every word and situation
uv run worker fetch-images --lang es --pack es_01 --limit 200

# 3. Generate interactive cards (3-4 different card types per unit)
uv run worker generate-cards --lang es --pack es_01 --max-usd 2.00
# For large batches at a 50% discount via the Anthropic Batch API:
uv run worker batch-submit --lang es --pack es_02 --max-usd 4.00
uv run worker batch-collect <batch_id>

# 4. Local audio generation (Kokoro-82M on the author's computer)
uv run worker generate-audio --lang es --pack es_01 --voice ef_dora
```

### 7.2. Image pipeline (`services/worker/src/ezik_worker/images.py`)
So that every word (*el gato, el edificio, el café, la estación*) and every situation gets a beautiful, accurate photo:
1. For each unit (`ezik_app_items`), Claude generates an `image_search_query_en` field with a specific visual query in English (e.g. for *el gato* → `"tabby cat sitting closeup"`, for *Un café con leche, por favor* → `"espresso coffee with milk cafe table madrid"`, for *la cuenta* → `"paying restaurant bill waiter cafe"`).
2. `fetch-images` searches in the following order of priority:
   - **Priority 1: Pixabay API** (`https://pixabay.com/api/?key=...&q=...&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`) — ideal for specific objects, food, animals and everyday scenes.
   - **Priority 2: Pexels API / Unsplash API** (if a key is set) — excellent for real-life situations with people (café, airport, conversation, hotel).
   - **Priority 3: Wikimedia Commons API** (`action=query&generator=search&gsrsearch=File:...&prop=imageinfo&iiprop=url|extmetadata`) — for geographic places (Madrid, Barcelona), culture and subjects with a verified license (`CC0`, `PD`, `CC BY`, `CC BY-SA`).
3. The image is stored in `image_url`, `image_source`, `image_license`, `image_author`. If the user taps ⚑ in the app → "Bad image", the worker automatically takes the next image from the results.

### 7.3. Claude prompts and validation rules (`validators.py`)
- **Models:**
  - `claude-haiku-4-5` (or the current Haiku 5.5, set as a constant in `config.py`) with **mandatory `thinking: disabled`** for `visual_word`, `phrase_situation`, `micro_builder`, `diglot_weave`, `audio_blur`, `say_it`, `trap_choice`.
  - `claude-sonnet-4-5` (Sonnet 5.5, **without** `thinking: disabled`) for `story_xray` and `sound_rule`.
- **Automatic checks before writing to `ezik_app_cards` (`status = 'ok'`):**
  1. Valid JSON against the Pydantic schema for the given `card_type`.
  2. Spanish punctuation: every Spanish question and exclamation must have the opening marks `¿` and `¡`.
  3. Vocabulary level ($i+1$ control): cards for `Stage 1–3` must not contain words outside the current and previous Packs (other than obvious international words / cognates).
  4. Exactly 1 correct answer in `options`; when writing to the database, the order of `options` is randomly shuffled and the `answer` index is recalculated (so the correct answer isn't always at position `0`, where LLMs love to put it!).
  5. In `micro_builder`, the `tiles` array always contains all elements of `correct_sequence` in shuffled order + 1 or 2 decoy tiles.
  6. A `mixed_script()` check on the Bulgarian fields (`bg_gloss`, `bg_bridge`, `phonetic_bg`) — no look-alike Latin letters inside Cyrillic words.

### 7.4. Audio pipeline (`services/worker/src/ezik_worker/tts.py`)
- **Primary engine (local, $0):** **Kokoro-82M** (the `kokoro-onnx` or `kokoro` Python package) with the Spanish voices `ef_dora` (female) and `em_alex` (male) — they alternate in dialogues!
- **Fallback engine (if Kokoro is not installed on the machine):** `edge-tts` (`es-ES-ElviraNeural` / `es-ES-AlvaroNeural`) or Google/OpenAI TTS.
- **Format:** `.mp3` (64 kbps mono, 24 kHz → ~15–40 KB per card).
- **Timing markers (`word_timings`):** Calculated from the phoneme/word durations in the TTS output and stored in `ezik_app_cards.word_timings`, so that words can light up in sync during playback.

---

## 8. Frontend specification (`apps/web/`)

### 8.1. Visual system and CSS variables (`apps/web/src/app/globals.css`)
- **Strict rule:** No hard-coded (`hex`/`rgb`) colors in React components — CSS variables only!
- **Fonts (via `next/font/google`):**
  - `--font-sans`: **Onest** (400, 500, 600, 700) — for all navigation, buttons, and English and Bulgarian explanations.
  - `--font-serif`: **Literata** (500, 600, 700) — for Spanish words, phrases and stories (gives a warm, readable and memorable feel).

```css
:root {
  /* Base surfaces — Dark theme (default) */
  --bg: #0b0f19;
  --surface: #131b2e;
  --surface-elevated: #1c2742;
  --border: rgba(255, 255, 255, 0.09);

  /* Text */
  --fg: #f8fafc;
  --muted: #94a3b8;
  --meta: #64748b;

  /* Primary accent (warm Spanish amber/terracotta) */
  --accent: #f59e0b;
  --accent-ink: #0b0f19;
  --accent-soft: rgba(245, 158, 11, 0.15);

  /* Color coding for Spanish grammatical gender */
  --gender-m: #38bdf8;          /* Blue for masculine: el / un */
  --gender-m-bg: rgba(56, 189, 248, 0.14);
  --gender-f: #fb7185;          /* Coral pink for feminine: la / una */
  --gender-f-bg: rgba(251, 113, 133, 0.14);

  /* Semantic colors for answers */
  --ok: #22c55e;
  --ok-bg: rgba(34, 197, 94, 0.16);
  --err: #ef4444;
  --err-bg: rgba(239, 68, 68, 0.16);
  --warn: #eab308;
}

[data-theme="light"] {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-elevated: #f1f5f9;
  --border: rgba(15, 23, 42, 0.10);
  --fg: #0f172a;
  --muted: #475569;
  --meta: #64748b;
  --accent: #d97706;
  --accent-ink: #ffffff;
  --accent-soft: rgba(217, 119, 6, 0.12);
  --gender-m: #0284c7;
  --gender-m-bg: rgba(2, 132, 199, 0.12);
  --gender-f: #e11d48;
  --gender-f-bg: rgba(225, 29, 72, 0.12);
  --ok: #16a34a;
  --ok-bg: rgba(22, 163, 74, 0.12);
  --err: #dc2626;
  --err-bg: rgba(220, 38, 38, 0.12);
}
```

### 8.2. Main screen layout (the Reels feed `/`)

```text
┌──────────────────────────────────────────┐
│ [▓▓▓▓▓▓▓▓░░░░] 12/20 min   Pack 01   🔊 │  <- TopProgressBar (44px tall)
├──────────────────────────────────────────┤
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │      PHOTO OF THE OBJECT /       │   │  <- 35-42% of the card height
│   │      SITUATION (with a soft      │   │     (small license credit in the bottom-right corner)
│   │      fade-out at the bottom)     │   │
│   └──────────────────────────────────┘   │
│                                          │
│     [el]  gato                  🔊  🐢   │  <- Spanish word/phrase (Literata 32px)
│     [ел ГА-то] · the cat                 │     'el' sits in a blue pill (--gender-m)
│                                          │     🐢 plays the audio slowly (0.75x)
│     "El gato duerme en el sofá."         │  <- Tappable mini-sentence (X-ray)
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ How do you say 'the cat'?        │   │
│   │  [  el gato                   ]  │   │  <- Large thumb-sized buttons (min 48px)
│   │  [  el perro                  ]  │   │
│   │  [  la casa                   ]  │   │
│   └──────────────────────────────────┘   │
│                                          │
│   [✓ I know this]          [⭐]   [⚑]    │  <- Bottom row of quick card actions
├──────────────────────────────────────────┤
│    🔥 Feed    📅 Today   📚 Words  ⚙️    │  <- BottomNav (56px tall)
└──────────────────────────────────────────┘
```

### 8.3. Key UX details of the Reels feed
1. **One-way stream with smooth snapping:**
   - The `.feed-viewport` container has `height: calc(100dvh - 100px); overflow-y: scroll; scroll-snap-type: y mandatory; overscroll-behavior-y: contain;`.
   - Each `.feed-card` has `height: 100%; scroll-snap-align: start; scroll-snap-stop: always;`.
2. **Two audio buttons on every card:**
   - 🔊 **Normal speed (1.0x)** — plays the `.mp3` file (or `speechSynthesis` with `es-ES` if the file hasn't been generated yet).
   - 🐢 **Slow and clear (0.75x)** — sets `audio.playbackRate = 0.75`. Extremely useful for an absolute beginner!
3. **"X-ray" bottom panel (`XRaySheet.tsx`):**
   - Tapping any Spanish word on the card opens a bottom sheet with:
     - The word + its article (colored by gender) + 🔊 and 🐢 buttons;
     - Its meaning in English and Bulgarian;
     - The base dictionary form (`lemma`) and grammatical role;
     - The `bg_bridge` field (if there is one);
     - An **"✓ I already know this word"** button (marks it as `mastered = true`).
   - Opening the panel adds an entry via `history.pushState`, so the phone's Back button closes it without leaving the app.
4. **Automatic time tracking (15–30 min/day):**
   - A client-side timer counts active seconds (only while the tab is visible, `document.visibilityState === 'visible'`, and there has been a tap/scroll within the last 45 seconds).
   - Every 30 seconds (or when a card is completed) it sends `active_seconds_delta` to `POST /api/events`, which updates `ezik_app_daily_stats` and the top progress bar `12 / 20 min`.
5. **Offline cache (`sw.js` + `sessionStorage`):**
   - The client always fetches the next batch of 10 cards once the user reaches the 7th card of the current batch, and preloads (`new Image()`, `<link rel="preload" as="audio">`) the images and audio for the next 3 cards, so there is no delay at all while scrolling.

---

## 9. API routes (Next.js Route Handlers)

All routes check the `ezik_session` session cookie (signed with `SESSION_SECRET`). If it is missing, they return `401 Unauthorized`.

| Route | Method | Input | Output / Action |
| --- | --- | --- | --- |
| `/api/auth/login` | `POST` | `{ username, password }` | Checks the `bcrypt` hash in `ezik_app_users`, sets an `HttpOnly` cookie for 90 days |
| `/api/auth/logout` | `POST` | — | Clears the cookie |
| `/api/feed` | `GET` | `?limit=10&pack=es_01` (optional) | Calls the Mixer (`mixer.ts`), returns `{ cards: CardDTO[], activePack, stage, todayStats }` |
| `/api/events` | `POST` | `{ cardId, itemId, eventType, rating, responseMs, dwellMs, activeSecondsDelta }` | Writes to `ezik_app_events`, updates `ezik_app_item_state` via `ts-fsrs`, updates `ezik_app_daily_stats`, checks whether the next Pack unlocks |
| `/api/today` | `GET` | — | Returns daily progress (minutes, cards, new words, reviews), the current streak of days, and a list of all 20 Packs with % completion |
| `/api/items` | `GET` | `?pack=es_01&filter=learning\|due\|mastered&q=...` | Returns the user's list of words/phrases along with their strength (0–5) and next review date |
| `/api/items/[id]` | `PATCH` | `{ action: 'know' \| 'reset' \| 'review_now' }` | Changes `ezik_app_item_state` for a specific word |
| `/api/settings` | `GET / PATCH` | Partial `SettingsDTO` object | Reads or updates `ezik_app_settings` (incl. changing the active Pack, daily goal, sound, Bulgarian help, theme) |

---

## 10. Phased implementation plan (Checklist for the developer agent)

Each phase ends in a working, verifiable state.

### Phase 0 (P0): Foundation, database, app skeletons and login (1–2 days)
- [ ] **Task 0.1:** Create `database/migrations/001_ezik_app_init.sql` (per section 3.1 of this spec) and run it against `<your-supabase-db-container>` as `supabase_admin`.
- [ ] **Task 0.2:** Create the author's initial user in `ezik_app_users` (copying the username/password from `art_app_users` in the same database, so the same credentials work!) and an initial row in `ezik_app_settings` (`target_lang = 'es'`, `ui_lang = 'en'`, `daily_minutes_goal = 20`).
- [ ] **Task 0.3:** Initialize Next.js 16 (App Router, TypeScript) in `apps/web/` with `globals.css` (the CSS variables from section 8.1), the `Onest` and `Literata` fonts, a `/login` page, and the `BottomNav` and `TopProgressBar` navigation.
- [ ] **Task 0.4:** Initialize the Python worker (`uv`) in `services/worker/` with `config.py`, `db.py`, `models.py` (the Pydantic models for the 10 card types) and `pytest`.
- [ ] **Task 0.5:** Prepare `deploy/docker-compose.yml`, `deploy/nginx/ezik.example.com.conf` and `deploy/push.sh`.
- **Done when:** You can log in at `http://localhost:3000` (and at `https://ezik.example.com` once DNS points to it) with your password and see the main interface.

### Phase 1 (P1): The first 3 Packs of Spanish from zero + the visual Reels feed (3–4 days)
- [ ] **Task 1.1:** Implement `curriculum.py` in the worker and run `seed-curriculum` for **Pack 01 (Pronunciation and international words)**, **Pack 02 (Greetings and survival)** and **Pack 03 (Who I am)** (~120 Spanish units in `ezik_app_items`).
- [ ] **Task 1.2:** Implement `images.py` (Pixabay + Wikimedia Commons + Pexels) and fetch images for all 120 units.
- [ ] **Task 1.3:** Generate the first ~350 cards in `ezik_app_cards` from the 5 core beginner types:
  1. `sound_rule` (12 cards on reading and pronunciation)
  2. `visual_word` (photo + word with color-coded gender `el`/`la` + mini-sentence + quiz)
  3. `phrase_situation` (real-life situation with a photo)
  4. `micro_builder` (magnetic tiles for building a phrase)
  5. `trap_choice` (gender, `ser/estar`, pronunciation)
- [ ] **Task 1.4:** Build `FeedContainer.tsx` (Reels scroll-snap), the 5 card components, `XRaySheet.tsx` (bottom panel on word tap) and `AudioButton.tsx` (1.0x + 0.75x, with the browser's speech synthesizer as a temporary fallback until P3).
- **Done when:** You can scroll Reels-style through the first 50 from-zero Spanish cards, see the photos, hear the pronunciation (normal and slow), build phrases with one finger, and tap words for an explanation.

### Phase 2 (P2): The memory engine (FSRS), the Mixer and "My Words" (2–3 days)
- [ ] **Task 2.1:** Integrate `ts-fsrs` in `apps/web/src/lib/fsrs.ts` and wire `POST /api/events` to update `ezik_app_item_state` and `ezik_app_daily_stats`.
- [ ] **Task 2.2:** Fully implement `mixer.ts` (adaptive 10-card batch, short-term echo after 4–5 cards, automatic unlocking of the next Pack at ≥ 75% of units completed).
- [ ] **Task 2.3:** The `/words` screen ("My Words & Phrases"): list grouped by Pack, search, strength indicator (0–5 bars), "I know this" and "Practice now" buttons.
- [ ] **Task 2.4:** The `/today` screen: a daily ring for 15–30 min, the streak of days, and a map of the 20 Packs with a button to choose a Pack.
- **Done when:** A word you got wrong or tapped comes back a few cards later in a new format, and your progress and daily minutes are saved on the server.

### Phase 3 (P3): Kokoro-82M audio pipeline, "Hear before you see" and speaking (2–3 days)
- [ ] **Task 3.1:** Implement `tts.py` (Kokoro-82M with the Spanish voices `ef_dora` and `em_alex` + `word_timings` timing markers) and generate `.mp3` files for all units and cards.
- [ ] **Task 3.2:** Implement `AudioBlurCard.tsx` ("Hear before you see" with blurred text and words lighting up in sync).
- [ ] **Task 3.3:** Implement `SayItCard.tsx` (actively saying it out loud → flip → self-rating) and `ShadowingCard.tsx` (voice echo with the microphone via the Web Speech API, `es-ES`).
- **Done when:** All cards play with a natural Spanish voice, and you can practice listening comprehension and say phrases out loud.

### Phase 4 (P4): The "Bridge" to reading (`Diglot Weave` + `Story X-Ray`) and Packs 04–12 (2–3 days)
- [ ] **Task 4.1:** Implement `DiglotWeaveCard.tsx` (an English sentence with Spanish words woven in) and `StoryXRayCard.tsx` (short illustrated stories in Spanish where every word is tappable).
- [ ] **Task 4.2:** Generate the content, images and audio for **Packs 04 to 12** (café, city, numbers, directions, core verbs, family, likes, daily routine — ~450 new units and ~1,500 cards).
- **Done when:** After the core words, hybrid sentences and the first short Spanish stories with an X-ray of every word start appearing in the feed.

### Phase 5 (P5): Packs 13–20, dynamic Echo cards, offline PWA and notifications (2–3 days)
- [ ] **Task 5.1:** Generate **Packs 13 to 20** (shopping, weather, health, plans, past tense, curious stories and ideas in simple Spanish).
- [ ] **Task 5.2:** The `/api/echo` endpoint — when a word is `due` for review and every available card with it has already been seen, Haiku generates a new card on the fly and saves it to `ezik_app_cards`.
- [ ] **Task 5.3:** A Service Worker (`public/sw.js`) for offline caching of the next 20 cards (together with their images and audio) + a morning Web Push notification.
- **Done when:** The app runs smoothly even on the subway without internet, and the full 20-Pack program (~1,000 Spanish units and ~3,000+ cards) is available.

### Phase 6 (P6 — Next big goal): Extension with C1 English (Business, AI, Philosophy, Books)
- [ ] Add `target_lang = 'en'`, `current_cefr = 'C1'` to the language switcher in the top bar.
- [ ] Add C1 card types for speaking and argumentation ("Talking Point", "How would a C1 speaker say it?", "Advanced traps for Bulgarian speakers") on top of the same database and interface.
