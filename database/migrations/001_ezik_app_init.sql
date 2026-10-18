-- 001_ezik_app_init.sql
-- Схема за „Като местен“ (ezik.example.com)
-- Всички таблици са с префикс ezik_app_ и включен RLS без публични политики.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Потребители
CREATE TABLE IF NOT EXISTS public.ezik_app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_users ENABLE ROW LEVEL SECURITY;

-- 2. Настройки и текущ прогрес на потребителя (по целеви език)
CREATE TABLE IF NOT EXISTS public.ezik_app_settings (
    user_id UUID NOT NULL REFERENCES public.ezik_app_users(id) ON DELETE CASCADE,
    target_lang TEXT NOT NULL DEFAULT 'es',           -- 'es' (сега), 'en' (следваща цел)
    ui_lang TEXT NOT NULL DEFAULT 'en',               -- 'en' (основен интерфейс), 'bg'
    current_cefr TEXT NOT NULL DEFAULT 'A0',          -- 'A0', 'A1', 'A2', 'B1', 'B2', 'C1'
    current_stage INT NOT NULL DEFAULT 0,             -- 0..4 (автоматично или ръчно)
    active_pack_code TEXT NOT NULL DEFAULT 'es_01',   -- текущ учебен пакет
    daily_minutes_goal INT NOT NULL DEFAULT 20,       -- 15..30 мин/ден
    daily_new_items_limit INT NOT NULL DEFAULT 15,    -- макс. нови думи/фрази на ден
    voice_accent TEXT NOT NULL DEFAULT 'es-ES',       -- 'es-ES' или 'es-MX' (за en: 'en-US')
    audio_autoplay BOOLEAN NOT NULL DEFAULT true,     -- автоматично пускане на аудиото при нова карта
    audio_slow_default BOOLEAN NOT NULL DEFAULT false,-- 0.8x скорост за абсолютно начинаещ
    muted BOOLEAN NOT NULL DEFAULT false,             -- режим „в метрото без слушалки“
    bg_helper_level INT NOT NULL DEFAULT 1,           -- 0=само EN, 1=EN + BG мостове, 2=винаги и BG превод
    theme TEXT NOT NULL DEFAULT 'dark',               -- 'dark' | 'light'
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    push_subscription JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, target_lang)
);
ALTER TABLE public.ezik_app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Учебни пакети (Структурирана програма от Пакет 01 до Пакет 20)
CREATE TABLE IF NOT EXISTS public.ezik_app_packs (
    code TEXT PRIMARY KEY,                            -- напр. 'es_01', 'es_02' ... 'es_20'
    target_lang TEXT NOT NULL DEFAULT 'es',
    seq_order INT NOT NULL,                           -- 1..20
    stage INT NOT NULL,                               -- 0..4
    cefr TEXT NOT NULL DEFAULT 'A0',                  -- 'A0', 'A1', 'A2'
    title_en TEXT NOT NULL,                           -- напр. 'Read & Speak Spanish in 10 Minutes'
    title_bg TEXT NOT NULL,
    description_en TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'sparkles',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_packs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_packs_lang_seq ON public.ezik_app_packs(target_lang, seq_order);

-- 4. Езикови единици (думи, фрази, звукови правила, граматични модели)
CREATE TABLE IF NOT EXISTS public.ezik_app_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_lang TEXT NOT NULL DEFAULT 'es',
    pack_code TEXT REFERENCES public.ezik_app_packs(code) ON DELETE SET NULL,
    seq_order INT NOT NULL DEFAULT 0,                 -- ред на въвеждане в пакета
    kind TEXT NOT NULL CHECK (kind IN (
        'sound_rule',     -- буква / правило за четене (ñ, ll, h, j, qu...)
        'cognate',        -- прозрачна дума (el hotel, el restaurante, importante)
        'noun',           -- съществително с член (el gato, la casa)
        'verb',           -- глагол или честотна форма (quiero, tengo, está)
        'adjective',      -- прилагателно (grande, bueno, abierto)
        'survival_phrase',-- готова разговорна фраза (Un café con leche, por favor)
        'grammar_pattern',-- модел (me gusta + inf, ir a + inf, ser vs estar)
        'connector'       -- връзка в речта (porque, pero, entonces)
    )),
    text TEXT NOT NULL,                               -- напр. 'el gato', 'Un café, por favor', 'ñ'
    lemma TEXT NOT NULL,                              -- основна форма: 'gato', 'café', 'ñ'
    article TEXT CHECK (article IN ('el', 'la', 'los', 'las', NULL)), -- за цветно кодиране на рода
    phonetic_hint TEXT,                               -- напр. '[ел ГА-то]' или 'ma-NYA-na'
    en_gloss TEXT NOT NULL,                           -- значение на английски: 'the cat'
    bg_gloss TEXT NOT NULL,                           -- значение на български: 'котката'
    en_explain TEXT,                                  -- кратко обяснение на EN (cognate / structure)
    bg_bridge TEXT,                                   -- кратка бележка защо е лесно/особено през BG
    example_text TEXT,                                -- мини-пример на испански (3-7 думи)
    example_en TEXT,                                  -- превод на примера на английски
    cefr TEXT NOT NULL DEFAULT 'A0',
    frequency_rank INT,                               -- 1..5000 по честота
    image_url TEXT,                                   -- URL към снимка (Pixabay / Wikimedia / Pexels)
    image_source TEXT,                                -- 'pixabay' | 'wikimedia' | 'pexels' | 'unsplash'
    image_license TEXT,                               -- 'Pixabay License' | 'CC0' | 'CC BY-SA 4.0'
    image_author TEXT,
    audio_url TEXT,                                   -- '/audio/es/items/<id>.mp3'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (target_lang, text, kind)
);
ALTER TABLE public.ezik_app_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_items_pack ON public.ezik_app_items(target_lang, pack_code, seq_order);

-- 5. Карти за лентата
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
    content JSONB NOT NULL,                           -- по строгата JSON схема за съответния card_type
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

-- 6. Връзка Карта <-> Езикови единици
CREATE TABLE IF NOT EXISTS public.ezik_app_card_items (
    card_id UUID NOT NULL REFERENCES public.ezik_app_cards(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.ezik_app_items(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'target' CHECK (role IN ('target', 'support')),
    PRIMARY KEY (card_id, item_id)
);
ALTER TABLE public.ezik_app_card_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_card_items_item ON public.ezik_app_card_items(item_id, role);

-- 7. Памет на потребителя (FSRS състояние за всяка срещната дума/фраза)
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
    mastered BOOLEAN NOT NULL DEFAULT false,          -- true при натискане на "I know this"
    seen_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, item_id)
);
ALTER TABLE public.ezik_app_item_state ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_item_state_due ON public.ezik_app_item_state(user_id, mastered, due);

-- 8. История на видените карти и събитията в лентата
CREATE TABLE IF NOT EXISTS public.ezik_app_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.ezik_app_users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.ezik_app_cards(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.ezik_app_items(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'view',           -- картата е показана за >= 1.5 сек
        'complete',       -- интеракцията в картата е завършена
        'tap_xray',       -- докосната дума за превод/рентген
        'answer_correct', -- верен отговор от първи опит
        'answer_wrong',   -- грешен отговор
        'self_grade',     -- самооценка (Again/Hard/Good/Easy)
        'know',           -- маркирана като „Вече я знам“
        'save',           -- ⭐ запазена карта/дума
        'unsave',
        'flag',           -- ⚑ докладвана грешка в картата/снимката
        'audio_play',     -- пуснато аудио
        'speak_ok'        -- успешно произнесена фраза
    )),
    rating INT CHECK (rating IN (1, 2, 3, 4, NULL)),  -- FSRS оценка, ако събитието променя паметта
    response_ms INT,                                  -- време за отговор в милисекунди
    dwell_ms INT,                                     -- общо време прекарано на картата
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ezik_app_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ezik_app_events_user_card ON public.ezik_app_events(user_id, card_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ezik_app_events_user_time ON public.ezik_app_events(user_id, created_at DESC);

-- 9. Дневна статистика (за екрана Today и серията от дни)
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

-- 10. Опашка за фонови задачи и неуспешни ИИ опити
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
