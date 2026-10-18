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
    ui_lang TEXT NOT NULL DEFAULT 'en',               -- 'en' (main interface), 'bg'
    current_cefr TEXT NOT NULL DEFAULT 'A0',          -- 'A0', 'A1', 'A2', 'B1', 'B2', 'C1'
    current_stage INT NOT NULL DEFAULT 0,             -- 0..4 (automatic or manual)
    active_pack_code TEXT NOT NULL DEFAULT 'es_01',   -- current learning pack
    daily_minutes_goal INT NOT NULL DEFAULT 20,       -- 15..30 min/day
    daily_new_items_limit INT NOT NULL DEFAULT 15,    -- max new words/phrases per day
    voice_accent TEXT NOT NULL DEFAULT 'es-ES',       -- 'es-ES' or 'es-MX' (for en: 'en-US')
    audio_autoplay BOOLEAN NOT NULL DEFAULT true,     -- autoplay audio when a new card appears
    audio_slow_default BOOLEAN NOT NULL DEFAULT false,-- 0.8x speed for absolute beginners
    muted BOOLEAN NOT NULL DEFAULT false,             -- "on the subway without headphones" mode
    bg_helper_level INT NOT NULL DEFAULT 1,           -- 0=EN only, 1=EN + BG bridges, 2=always include BG translation
    theme TEXT NOT NULL DEFAULT 'dark',               -- 'dark' | 'light'
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    push_subscription JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_lang)
);
ALTER TABLE public.ezik_app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Learning packs (structured program from Pack 01 to Pack 20)
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
    phonetic_hint TEXT,                               -- e.g. '[ел ГА-то]' or 'ma-NYA-na'
    en_gloss TEXT NOT NULL,                           -- meaning in English: 'the cat'
    bg_gloss TEXT NOT NULL,                           -- meaning in Bulgarian: 'котката' ("the cat")
    en_explain TEXT,                                  -- short explanation in EN (cognate / structure)
    bg_bridge TEXT,                                   -- short note on why it is easy/special via BG
    example_text TEXT,                                -- mini example in Spanish (3-7 words)
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

-- 7. User memory (FSRS state for every word/phrase encountered)
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
        'view',           -- card shown for >= 1.5 s
        'complete',       -- card interaction completed
        'tap_xray',       -- word tapped for translation/X-ray
        'answer_correct', -- correct answer on first try
        'answer_wrong',   -- wrong answer
        'self_grade',     -- self-assessment (Again/Hard/Good/Easy)
        'know',           -- marked as "I already know this"
        'save',           -- ⭐ card/word saved
        'unsave',
        'flag',           -- ⚑ error reported in the card/photo
        'audio_play',     -- audio played
        'speak_ok'        -- phrase pronounced successfully
    )),
    rating INT CHECK (rating IN (1, 2, 3, 4, NULL)),  -- FSRS rating, if the event updates memory
    response_ms INT,                                  -- response time in milliseconds
    dwell_ms INT,                                     -- total time spent on the card
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_events_user_card ON public.ezik_app_events(user_id, card_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ezik_app_events_user_time ON public.ezik_app_events(user_id, created_at DESC);

-- 9. Daily statistics (for the Today screen and the day streak)
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
