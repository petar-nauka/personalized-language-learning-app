# SPEC.md — Пълна техническа и продуктова спецификация („Като местен“ / `ezik.example.com`)

> **Предназначение на този документ:** Изчерпателна спецификация за ИИ агент-разработчик. Всички архитектурни решения, SQL схеми, JSON договори, промптове, алгоритми за памет (FSRS) и миксиране на лентата, API маршрути и UI компоненти са дефинирани тук без двусмислия.
> **Свързани файлове:** [CLAUDE.md](CLAUDE.md) (правила и конвенции) · [PLAN.md](PLAN.md) (продуктова рамка) · [NEXT_STEPS.md](NEXT_STEPS.md) (оперативен ред).

---

## 1. Продуктова концепция и педагогически модел (Испански от нулата: A0 → A1 → A2)

### 1.1. Какво строим сега и защо точно така
1. **Целеви език за v1:** **Испански от абсолютна нула (`target_lang = 'es'`, ниво `A0 → A1 → A2`)**.
   - Архитектурата поддържа множество езици и нива (`target_lang`, `ui_lang`, `cefr`) във всяка таблица и API маршрут, за да може на следващ етап да се добави **Английски C1** (бизнес, ИИ, философия, книги) без промяна в базата или интерфейса.
2. **Език на интерфейса и обясненията (`ui_lang = 'en'` + български „мост“):**
   - **Основен език на приложението:** **Английски (`en`)** — менюта, инструкции, преводи и основни обяснения.
   - **Защо английски → испански (Laddering):** Между английски и испански има над **3 000 общи латински думи (cognates)** (*hotel, restaurante, animal, hospital, importante, idea, problema, информация/información*) и близък словоред (*I want a coffee* → *Quiero un café*). Така Петър практикува английски пасивно, докато учи испански от нулата.
   - **Кога се показва и българският „мост“ (`bg_bridge`):** Само там, където българският дава директно предимство пред английския:
     - **Произношение и фонетика:** Испанските гласни (*a, e, i, o, u*) звучат като българските *а, е, и, о, у*; *ñ* = *нь* (*баня*); *ll* = *й*; *j* = *х*; *h* е нямо.
     - **Граматични прилики с българския:** Изпускане на местоимението (*Hablo español* = *Говоря испански*, без нужда от *Yo*), възвратни глаголи с *me/te/se* (= българското *се/си*, напр. *Me llamo* = *Казвам се*), граматичен род на предметите (*el/la*), учтива форма (*tú* = *ти*, *usted* = *Вие*).
3. **Формат на лентата:**
   - **Като Reels / TikTok (`100dvh`, вертикално скролване с щракване `scroll-snap-type: y mandatory`)** — по една интерактивна карта на цял екран.
   - Всяка карта се решава за **5 до 20 секунди с един палец**.
   - **Дневна цел:** **15–30 минути на ден** (по подразбиране 20 мин. ≈ 50–70 микро-карти).
4. **Визуална памет (Снимка → Дума/Ситуация):**
   - Всяка базова дума, фраза и житейска ситуация е придружена от **ясна, конкретна снимка** от безплатни банки със свободен лиценз (**Wikimedia Commons, Pixabay, Pexels, Unsplash**).
   - Целта е мозъкът да свързва испанския звук и дума **директно с образа в ума** (виждаш котка → чуваш и виждаш *el gato*; виждаш чаша еспресо на бар → *Un café solo, por favor*), а не само с превод.

---

### 1.2. Педагогическата стълбица: 5 етапа от А0 до истории (`stage` 0 → 4)

Когато човек започва от **абсолютна нула (A0)**, не може на Ден 1 да чете параграфи на испански. Затова лентата автоматично преминава през **5 стъпала на сложност (`stage`)** и **20 тематични пакета (`ezik_app_packs`)**:

| Етап (`stage`) | Кога е активен | Какво учиш | Основни типове карти |
| --- | --- | --- | --- |
| **Stage 0: Звук, четене и „Прозрачни думи“** | Първите ~25 карти (Ден 1) | Как се чете всяка испанска дума (10-те правила за *h, ñ, ll/y, j, ge/gi, c/z, qu, gue/gui, rr, v/b, ударение*) + 30 „прозрачни думи“ (cognates), които вече знаеш от английски/български (*el hotel, el café, el restaurante, el taxi, la música, importante*) | `sound_rule`, `visual_word` |
| **Stage 1: Визуално ядро (Първите 150 думи)** | От 25 до ~150 научени единици | Най-честите съществителни (хора, храна, град, дом, природа), глаголи в сег. време (*ser, estar, tener, querer, ir, hablar, comer, vivir*), прилагателни и числа 1–20. Всяка съществителна дума е с **цветно кодиран род** (**синьо за `el`**, **коралово за `la`**) + снимка | `visual_word`, `trap_choice`, `audio_blur` |
| **Stage 2: Оцеляване и живи ситуации (Survival Chunks)** | След първите 40 думи (смесва се със Stage 1) | Готови разговорни блокове за реален живот: поздрави, поръчка в кафене/ресторант (*Quiero…, La cuenta, por favor*), питане за посока (*¿Dónde está…?*), цена (*¿Cuánto cuesta?*), представяне (*Me llamo…, Soy de…*), учтивост | `phrase_situation`, `micro_builder`, `say_it` |
| **Stage 3: „Мостът“ — Diglot Weave и микро-истории** | След ~100 научени единици | 1) **Diglot Weave:** Кратки любопитни изречения на английски, в които познатите испански думи са вплетени директно.<br/>2) **Микро-истории с рентген (15–35 думи):** Кратки диалози и факти на 100% испански, в които **всяка дума е кликаема** за мигновен превод и граматична бележка | `diglot_weave`, `story_xray` |
| **Stage 4: Свободно разбиране и говорене (A1 → A2)** | След ~250 научени единици | По-дълги истории (40–70 думи), слушане със замъглен текст с естествена скорост, активно казване на глас (Web Speech API) и разграничаване на *ser vs. estar*, *por vs. para*, минало време | `story_xray`, `audio_blur`, `say_it`, `shadowing`, `trap_choice` |

---

### 1.3. Учебна програма: Първите 20 пакета (`ezik_app_packs`, ~1 000 единици)

Учебните единици (`ezik_app_items`) са подредени в **20 последователни пакета**. Потребителят винаги има **1 или 2 „активни пакета“**, от които лентата подава нови думи/фрази (по 10–15 нови единици на сесия), докато всички минали пакети се преговарят автоматично през FSRS:

1. **Pack 01 — Read & Speak Spanish in 10 Minutes (`stage 0`):** 12 звукови/правописни правила (*hola, mañana, calle, trabajo, queso, guitarra, cerveza, perro, baño*) + 25 международни думи (*el café, el hotel, el restaurante, el hospital, el aeropuerto, el taxi, el tren, el autobús, el banco, el museo, la universidad, la música, la idea, el problema*).
2. **Pack 02 — Greetings, Courtesy & Survival Basics (`stage 1–2`):** *hola, buenos días, buenas tardes, buenas noches, adiós, hasta luego, por favor, muchas gracias, de nada, perdón, disculpe, sí, no, claro, vale, ¿habla inglés?, no entiendo, más despacio*.
3. **Pack 03 — Who I Am (`ser`, `llamarse`, origin & professions) (`stage 1–2`):** *yo soy, tú eres, él/ella es, me llamo, ¿cómo te llamas?, soy de Bulgaria, vivo en Sofía, hablo inglés y un poco de español, encantado/a*.
4. **Pack 04 — At the Café & Restaurant (`querer`, food & drinks) (`stage 1–2`):** *el agua, el café con leche, el té, la cerveza, el vino tinto, el pan, el pollo, la ensalada, el desayuno, la cena, quiero…, para mí, ¿qué recomienda?, la cuenta, por favor*.
5. **Pack 05 — Everyday Objects, Places & Gender (`el` vs `la`, `un` vs `una`) (`stage 1`):** *la casa, la calle, la ciudad, el edificio, la habitación, la llave, la mesa, la silla, el libro, el teléfono, el coche, el gato, el perro, el árbol, el sol, el mar*.
6. **Pack 06 — Numbers, Prices, Time & Days (`stage 1–2`):** числата 1–100, *¿cuánto cuesta?, es barato, es caro, pagar con tarjeta, en efectivo, ¿qué hora es?, hoy, mañana, ayer, lunes… domingo*.
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
19. **Pack 19 — Stories, Culture & Curious Facts in Simple Spanish (`stage 4`):** 150 чести думи за четене на кратки истории за Испания, Латинска Америка, наука, природа и ежедневие.
20. **Pack 20 — Opinions, Books, Technology & Ideas in Simple Spanish (`stage 4`):** *la inteligencia artificial, el futuro, el mundo, cambiar, pensar, explicar, estar de acuerdo, tener sentido*.

---

## 2. Архитектура и технически стек

### 2.1. Структура на хранилището (`lang-feed`)

```text
/
├── apps/
│   └── web/                        # Next.js 16 (App Router) + React + TypeScript PWA
│       ├── public/
│       │   ├── manifest.json       # PWA манифест
│       │   ├── sw.js               # Service Worker (офлайн кеш за ~20 карти + Web Push)
│       │   └── icons/              # PWA икони (192x192, 512x512, maskable)
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css     # Само CSS променливи (тъмна и светла тема)
│       │   │   ├── layout.tsx      # Root layout (Onest + Literata шрифтове)
│       │   │   ├── page.tsx        # Главен екран: Reels лентата (/)
│       │   │   ├── login/page.tsx  # Вход с парола (/login)
│       │   │   ├── today/page.tsx  # Дневен прогрес, серия, активен пакет (/today)
│       │   │   ├── words/page.tsx  # „My Words & Phrases“ + преглед по пакети (/words)
│       │   │   ├── settings/page.tsx # Настройки (/settings)
│       │   │   └── api/
│       │   │       ├── auth/login/route.ts
│       │   │       ├── auth/logout/route.ts
│       │   │       ├── feed/route.ts         # Миксер на лентата (връща пакет от 10 карти)
│       │   │       ├── events/route.ts       # Запис на събития + обновяване на FSRS
│       │   │       ├── items/route.ts        # Списък/филтър на думи и фрази
│       │   │       ├── items/[id]/route.ts   # Ръчна промяна ("I know this" / "Reset")
│       │   │       ├── packs/route.ts        # Списък с 20-те пакета и прогреса в тях
│       │   │       ├── today/route.ts        # Дневна статистика и серия
│       │   │       ├── settings/route.ts     # Четене/запис на настройки
│       │   │       └── echo/route.ts         # Генериране на динамична Ехо-карта при нужда
│       │   ├── components/
│       │   │   ├── FeedContainer.tsx         # Reels scroll-snap контейнер + клавиатура/жестове
│       │   │   ├── TopProgressBar.tsx        # Тънка лента за дневната цел (15-30 мин) + звук
│       │   │   ├── BottomNav.tsx             # Навигация: Feed · Today · Words · Settings
│       │   │   ├── XRaySheet.tsx             # Долен панел при докосване на дума/израз
│       │   │   ├── AudioButton.tsx           # Възпроизвеждане на аудио (нормално + 0.75x бавно!)
│       │   │   └── cards/
│       │   │       ├── SoundRuleCard.tsx     # 1. Буква/звук + 3 аудио примера + мини-тест
│       │   │       ├── VisualWordCard.tsx    # 2. Снимка + дума с цветен род + аудио + тест
│       │   │       ├── PhraseSituationCard.tsx # 3. Снимка на ситуация + фраза + кога се казва
│       │   │       ├── MicroBuilderCard.tsx  # 4. Магнитни блокчета (сглоби фразата)
│       │   │       ├── DiglotWeaveCard.tsx   # 5. Английско изречение с вплетени испански думи
│       │   │       ├── StoryXRayCard.tsx     # 6. Кратка история с кликаеми думи + въпрос
│       │   │       ├── AudioBlurCard.tsx     # 7. Чуй преди да видиш (замъглен текст)
│       │   │       ├── SayItCard.tsx         # 8. Кажи го на глас → обърни и оцени
│       │   │       ├── ShadowingCard.tsx     # 9. Гласово ехо с Web Speech API (es-ES)
│       │   │       └── TrapChoiceCard.tsx    # 10. Избери правилния израз / граматичен капан
│       │   └── lib/
│       │       ├── auth.ts                   # Сесийни бисквитки (HMAC-SHA256 с SESSION_SECRET)
│       │       ├── db.ts                     # Сървърен Supabase/Postgres клиент (SERVICE_ROLE_KEY)
│       │       ├── fsrs.ts                   # Обвивка около ts-fsrs за смятане на интервали
│       │       ├── mixer.ts                  # Алгоритъмът на лентата (адаптивен по Stage 0..4)
│       │       ├── audio.ts                  # Плейър с поддръжка на 1.0x и 0.75x + Web Speech резерва
│       │       └── types.ts                  # Всички TypeScript типове за карти и API
│       ├── Dockerfile
│       ├── next.config.ts
│       └── package.json
├── services/
│   └── worker/                     # Python 3.12 (uv) фабрика за съдържание, снимки и аудио
│       ├── pyproject.toml
│       ├── src/ezik_worker/
│       │   ├── cli.py              # Входна точка (`uv run worker ...`)
│       │   ├── config.py           # Зареждане на .env
│       │   ├── db.py               # Връзка към Supabase (httpx / psycopg)
│       │   ├── models.py           # Pydantic схеми за всички 10 типа карти
│       │   ├── curriculum.py       # Дефиниция на 20-те пакета и генериране на seed единици
│       │   ├── claude_client.py    # Claude Sonnet 5.5 / Haiku 5.5 + Batch API + --max-usd
│       │   ├── images.py           # Търсене на снимки: Pixabay, Wikimedia Commons, Pexels
│       │   ├── validators.py       # Проверка на JSON, ниво на думите, испанска пунктуация
│       │   └── tts.py              # Локален Kokoro-82M (es) + резерва Edge/Google/OpenAI TTS
│       └── tests/
├── database/
│   └── migrations/
│       └── 001_ezik_app_init.sql   # Пълна схема на всички ezik_app_* таблици
├── deploy/
│   ├── docker-compose.yml          # Контейнер web (127.0.0.1:3012) + профил tools (worker)
│   ├── nginx/
│   │   └── ezik.example.com.conf
│   └── push.sh                     # Качване на кода и аудиото към VPS1
├── .env.example
├── CLAUDE.md
├── PLAN.md
└── SPEC.md
```

### 2.2. Разполагане на VPS1
- **Домейн:** `https://ezik.example.com` (A запис в DNS → `<YOUR_VPS_IP>`).
- **Порт на уеб контейнера на VPS1:** `127.0.0.1:3012:3000` (проверява се със `ss -tlnp` преди пускане да няма конфликт).
- **Папка на сървъра:** `/docker/lang-feed`.
- **Аудио файлове:** генерират се локално на компютъра на Петър (чрез Kokoro-82M или TTS скрипт) в `audio/es/` и се синхронизират с `rsync` към `/var/lib/lang-feed/audio/es/` на VPS1. Nginx сервира `/audio/` директно от диска с `Cache-Control: public, max-age=31536000, immutable`.
- **База данни:** Съществуващият контейнер `<your-supabase-db-container>` (`https://your-project.supabase.co`), схема `public`, собственик `supabase_admin`. Всички таблици започват с `ezik_app_`.

---

## 3. Пълна схема на базата данни (`database/migrations/001_ezik_app_init.sql`)

Миграцията се изпълнява като `supabase_admin`:
```bash
ssh vps1 "docker exec -i <your-supabase-db-container> psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1" < database/migrations/001_ezik_app_init.sql
```

### 3.1. SQL DDL (`001_ezik_app_init.sql`)

```sql
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
```

---

## 4. Десетте типа карти и техните JSON схеми (`ezik_app_cards.content`)

Всяка карта в `ezik_app_cards` има поле `card_type` и JSON обект `content`. По-долу са точните схеми, които Python worker-ът генерира и валидира с Pydantic, а Next.js рендерира.

### 4.1. Тип 1: `sound_rule` — Тайният код на испанското произношение (Stage 0)
Показва буква или буквена комбинация, как се чете (на английски + точен български звуков еквивалент), 3 кликаеми примера със снимки и аудио, и 1 микро-въпрос за затвърждаване.

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

### 4.2. Тип 2: `visual_word` — Визуална карта за дума със снимка и род (Stage 0–1)
Снимка в горната половина на екрана, голяма испанска дума (ако е съществително — членът `el` е оцветен в синьо `--gender-m`, а `la` в коралово `--gender-f`), произношение, микро-изречение от 3–5 думи и бърз въпрос с 3 бутона.

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

### 4.3. Тип 3: `phrase_situation` — Житейска ситуация със снимка (Stage 1–2)
Снимка на реална ситуация (кафене, хотел, улица в Мадрид), ключовата разговорна фраза на испански, разглобяване дума по дума (X-Ray) и въпрос „Кога/как ще използваш тази фраза?“.

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

### 4.4. Тип 4: `micro_builder` — Магнитни блокчета (Сглоби фразата) (Stage 1–3)
Показва снимка и ситуация на английски. Потребителят докосва разбърканите испански блокчета (3 до 6 верни + 1–2 подлъгващи), за да сглоби изречението. При грешка обяснява защо словоредът или родът е такъв.

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

### 4.5. Тип 5: `diglot_weave` — Хибридна карта „Мост“ (Stage 2–3)
Кратък интересен факт или мисъл на английски, в който **2–4 испански думи/фрази** (които потребителят учи или току-що е видял) заменят английските. Испанските думи са оцветени и кликаеми (показват превод и произношение), а отдолу има 3-секунден въпрос.

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

### 4.6. Тип 6: `story_xray` — Микро-история / диалог с рентген на всяка дума (Stage 3–4)
Илюстрирана кратка история или житейски диалог на испански (15–30 думи за A1, 35–60 думи за A2).
- **Важно за начинаещи:** Освен че 1–3 целеви израза (`highlights`) са подчертани, **всяка дума в текста (`tokens`) е кликаема**! Така начинаещият никога не се чувства блокиран от непозната дума.

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

### 4.7. Тип 7: `audio_blur` — „Чуй преди да видиш“ (Stage 1–4)
Пуска се 3–8 сек. кристално ясно испанско аудио (със снимка за контекст), докато испанският текст е замъглен (`filter: blur(8px)`). Потребителят има бутон 🔊 (1.0x) и 🐢 (0.75x бавно) и избира за какво става дума от 3 опции на английски. При отговор текстът се изчиства плавно и думите светят синхронно с аудиото.

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

### 4.8. Тип 8: `say_it` — „Кажи го наум / на глас → провери“ (Active Recall) (Stage 2–4)
Най-силният механизъм за проговаряне: виждаш снимка и ситуация на английски (*„Say in Spanish: I want a table for two, please.“*). Казваш го на глас или наум и натискаш **„Reveal Answer“** (разкрива испанската фраза, пуска автоматично аудиото и показва 4 бутона за самооценка: **Again · Hard · Good · Easy**).

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

### 4.9. Тип 9: `shadowing` — Гласово ехо с микрофон (Web Speech API) (Stage 2–4)
Слушаш испанската фраза, натискаш бутона с микрофон и я казваш на глас. Вграденият в браузъра `webkitSpeechRecognition` / `SpeechRecognition` (`lang = 'es-ES'`) сравнява казаните думи (без пунктуация и регистър, с толерантност на Левейнщайн ≤ 1 знак за дълги думи) и оцветява всяка разпозната дума в зелено. Винаги има бутон „Skip microphone (noisy place)“, за да не блокира лентата.

```json
{
  "es": "Buenos días, me llamo Petar y soy de Bulgaria.",
  "phonetic": "БУЕ-нос ДИ-ас, ме Я-мо Пе-тар и сой де Бул-ГА-рия",
  "en": "Good morning, my name is Petar and I am from Bulgaria.",
  "target_words": ["buenos", "días", "me", "llamo", "petar", "y", "soy", "de", "bulgaria"]
}
```

### 4.10. Тип 10: `trap_choice` — Чести капани (Род, `ser/estar`, произношение, false friends) (Stage 1–4)
Бърз избор между 2 или 3 варианта за типични грешки при учене на испански (*el problema* е мъжки род въпреки `-a`!; *estoy cansado* vs *soy cansado*; *tengo 30 años* vs *soy 30 años*; *embarazada* ≠ embarrassed!).

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

## 5. Алгоритъм на Миксера на лентата (`apps/web/src/lib/mixer.ts`)

Когато клиентът извика `GET /api/feed?limit=10`, сървърът сглобява **динамичен пакет от 10 карти** специално за текущото състояние на потребителя:

### 5.1. Логика за отключване на пакети и етапи (Auto-Progression)
1. Сървърът проверява `ezik_app_settings.active_pack_code` (в началото `'es_01'`).
2. Когато **≥ 75% от единиците (`ezik_app_items`) в текущия пакет** имат `seen_count >= 1` в `ezik_app_item_state` (или са маркирани като `mastered = true`), сървърът автоматично отключва следващия пакет (`es_02`, после `es_03` и т.н.) и обновява `current_stage` според `ezik_app_packs.stage`.
3. Потребителят може по всяко време от екрана `/words` или `/today` да прескочи пакет напред („Skip to next pack“) или да маркира дума/фраза с един бутон като **„I know this“ (`mastered = true`)**.

### 5.2. Пропорции в пакета от 10 карти според етапа (`stage`)

| Слот в пакета (10 карти) | Stage 0 (Първите 25 карти) | Stage 1–2 (Базови думи и оцеляване) | Stage 3–4 (Истории, слушане и говорене) |
| --- | --- | --- | --- |
| **Скрит преговор (FSRS `due <= now()`)** | 1–2 карти (ако има `due`) | **2 карти (20%)** — Ехо-карти за думи с настъпил преговор | **2 карти (20%)** — Ехо-карти в нов контекст |
| **Нови единици от активния пакет** | 6–7 карти (`sound_rule`, `visual_word` cognates) | **5 карти (50%)** (`visual_word`, `phrase_situation`) | **5 карти (50%)** (`story_xray`, `diglot_weave`, `phrase_situation`) |
| **Активно предизвикателство (Practice)** | 2 карти (`micro_builder`, `trap_choice`) | **3 карти (30%)** (`micro_builder`, `audio_blur`, `say_it`, `trap_choice`) | **3 карти (30%)** (`audio_blur`, `say_it`, `shadowing`, `micro_builder`, `trap_choice`) |

### 5.3. Строги правила за подреждане в пакета от 10 карти
1. **Запознаване преди изпитване:** Ако дадена дума (`item_id`) никога не е виждана (`seen_count == 0`), първата карта за нея **задължително** е въвеждаща (`visual_word`, `sound_rule`, `phrase_situation`, `diglot_weave`), а **не** `say_it` или `micro_builder`.
2. **Непосредствено ехо (Short-term loop):** Когато нова дума е въведена на позиция `i` (напр. Карта #2 е `visual_word` за *la cuenta*), Миксерът се стреми на позиция `i + 4` или `i + 5` (напр. Карта #7) да постави активна карта (`micro_builder` или `audio_blur`), която използва същата дума! Така думата се запечатва още в същата сесия.
3. **Разнообразие (Interleaving):** Никога 2 карти от един и същ `card_type` една след друга (изключение само в първите 10 карти на `Stage 0` между `sound_rule` и `visual_word`).
4. **Режим „Без звук“ (`muted = true`):** Ако потребителят е включил бутона „Mute“ в горната лента (напр. на публично място без слушалки), Миксерът не включва `audio_blur` и `shadowing` карти.
5. **Без повторение на същата карта:** Карти, за които има запис `complete` в `ezik_app_events` през последните 14 дни, не се показват отново (освен ако няма нито една друга карта за `due` преговор).

---

## 6. Двигателят на паметта (`ts-fsrs` в `apps/web/src/lib/fsrs.ts`)

Използва се отворената библиотека `ts-fsrs` (версия `^4.x`) с цел на запомняне `request_retention = 0.90` и включени краткосрочни стъпки (`enable_short_term = true`).

### 6.1. Таблица на оценките (Как всяко действие в лентата се превръща в FSRS `Rating`)

| Действие на потребителя в картата | Оценка за `ts-fsrs` | Какво се случва с интервала на думата |
| --- | --- | --- |
| Докосване на дума в текст за превод (`tap_xray`) | `Rating.Again (1)` | Думата се отбелязва като непозната → връща се след ~10 мин / в следващата сесия в нова карта |
| Грешен отговор на въпрос или сбъркан `micro_builder` | `Rating.Again (1)` | Връща се за повторение след ~10 мин |
| Верен отговор, но след колебание (`response_ms > 9000`) или след ползване на жокер | `Rating.Hard (2)` | По-кратък интервал (напр. 1 ден) |
| Верен отговор от първи опит (`response_ms <= 9000`) | `Rating.Good (3)` | Стандартен интервал: 1 ден → 3 дни → 8 дни → 21 дни |
| Самооценка в `say_it` карта | `Again / Hard / Good / Easy` | Според избрания от потребителя бутон |
| Бутон **„I know this“** (или дълго натискане върху дума) | `Rating.Easy (4)` + `mastered = true` | Излиза от активния преговор (не се показва повече като учебна цел, освен ако не бъде върната ръчно) |

### 6.2. Скала за „Сила на думата“ (0 до 5 чертички в UI)
За да бъде интерфейсът интуитивен в екрана `/words`:
- **0 (New):** Още не е срещана.
- **1 (Just met):** `state == 1` (Learning) или `stability < 1` ден.
- **2 (Familiar):** `stability` между 1 и 4 дни.
- **3 (Growing):** `stability` между 4 и 14 дни.
- **4 (Strong):** `stability` между 14 и 30 дни.
- **5 (Mastered):** `stability >= 30` дни или `mastered == true`.

---

## 7. Фабрика за съдържание, снимки и аудио (`services/worker/`)

### 7.1. Команди на Python Worker-а (`uv run worker ...`)

```bash
# 1. Създаване на 20-те пакета и 1 000-те базови испански единици (A0 -> A2)
uv run worker seed-curriculum --lang es --packs 1..5 --max-usd 3.00

# 2. Автоматично намиране и проверка на снимки за всяка дума и ситуация
uv run worker fetch-images --lang es --pack es_01 --limit 200

# 3. Генериране на интерактивни карти (по 3-4 различни типа карти на всяка единица)
uv run worker generate-cards --lang es --pack es_01 --max-usd 2.00
# За големи партиди с 50% отстъпка през Anthropic Batch API:
uv run worker batch-submit --lang es --pack es_02 --max-usd 4.00
uv run worker batch-collect <batch_id>

# 4. Локално генериране на аудио (Kokoro-82M на компютъра на Петър)
uv run worker generate-audio --lang es --pack es_01 --voice ef_dora
```

### 7.2. Пайплайн за снимки (`services/worker/src/ezik_worker/images.py`)
За да може всяка дума (*el gato, el edificio, el café, la estación*) и всяка ситуация да има красива и точна снимка:
1. За всяка единица (`ezik_app_items`) Claude генерира поле `image_search_query_en` с конкретна визуална заявка на английски (напр. за *el gato* → `"tabby cat sitting closeup"`, за *Un café con leche, por favor* → `"espresso coffee with milk cafe table madrid"`, за *la cuenta* → `"paying restaurant bill waiter cafe"`).
2. `fetch-images` търси по следния ред на приоритет:
   - **Приоритет 1: Pixabay API** (`https://pixabay.com/api/?key=...&q=...&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`) — идеален за конкретни предмети, храни, животни и ежедневни сцени.
   - **Приоритет 2: Pexels API / Unsplash API** (ако е зададен ключ) — отлични за житейски ситуации с хора (кафене, летище, разговор, хотел).
   - **Приоритет 3: Wikimedia Commons API** (`action=query&generator=search&gsrsearch=File:...&prop=imageinfo&iiprop=url|extmetadata`) — за географски места (Мадрид, Барселона), култура и обекти с проверен лиценз (`CC0`, `PD`, `CC BY`, `CC BY-SA`).
3. Снимката се записва в `image_url`, `image_source`, `image_license`, `image_author`. Ако потребителят натисне ⚑ в приложението → „Bad image“, worker-ът автоматично взима следващата снимка от резултатите.

### 7.3. Промптове за Claude и правила за валидация (`validators.py`)
- **Модели:**
  - `claude-haiku-4-5` (или актуалният Haiku 5.5 в константа в `config.py`) със **задължително `thinking: disabled`** за `visual_word`, `phrase_situation`, `micro_builder`, `diglot_weave`, `audio_blur`, `say_it`, `trap_choice`.
  - `claude-sonnet-4-5` (Sonnet 5.5, **без** `thinking: disabled`) за `story_xray` и `sound_rule`.
- **Автоматични проверки преди запис в `ezik_app_cards` (`status = 'ok'`):**
  1. Валиден JSON по Pydantic схемата за съответния `card_type`.
  2. Испанска пунктуация: всички въпросителни и възклицателни изречения на испански трябва да имат отварящи знаци `¿` и `¡`.
  3. Ниво на речника ($i+1$ контрол): В картите за `Stage 1–3` не се допускат думи извън текущия и предходните пакети (или ясни международни думи / cognates).
  4. Точно 1 верен отговор в `options`; при запис в базата редът на `options` се разбърква случайно и индексът `answer` се преизчислява (за да не е верният отговор винаги на позиция `0`, където LLM обича да го слага!).
  5. В `micro_builder` масивът `tiles` винаги съдържа всички елементи от `correct_sequence` в разбъркан ред + 1 или 2 подлъгващи блокчета.
  6. Проверка `mixed_script()` за българските полета (`bg_gloss`, `bg_bridge`, `phonetic_bg`) — да няма латински букви-близнаци вътре в кирилски думи.

### 7.4. Пайплайн за аудио (`services/worker/src/ezik_worker/tts.py`)
- **Основен двигател (локално, $0):** **Kokoro-82M** (`kokoro-onnx` или `kokoro` Python пакет) с испанските гласове `ef_dora` (женски) и `em_alex` (мъжки) — редуват се при диалози!
- **Резервен двигател (ако Kokoro не е инсталиран на машината):** `edge-tts` (`es-ES-ElviraNeural` / `es-ES-AlvaroNeural`) или Google/OpenAI TTS.
- **Формат:** `.mp3` (64 kbps моно, 24 kHz → ~15–40 KB на карта).
- **Времеви маркери (`word_timings`):** Изчисляват се по дължината на фонемите/думите от TTS изхода и се записват в `ezik_app_cards.word_timings`, за да могат думите да светват синхронно при слушане.

---

## 8. Спецификация на Frontend-а (`apps/web/`)

### 8.1. Визуална система и CSS променливи (`apps/web/src/app/globals.css`)
- **Строго правило:** Никакви твърди (`hex`/`rgb`) цветове в React компонентите — само CSS променливи!
- **Шрифтове (през `next/font/google`):**
  - `--font-sans`: **Onest** (400, 500, 600, 700) — за цялата навигация, бутони, английски и български обяснения.
  - `--font-serif`: **Literata** (500, 600, 700) — за испанските думи, фрази и истории (дава топло, четливо и запомнящо се усещане).

```css
:root {
  /* Основни повърхности — Тъмна тема (по подразбиране) */
  --bg: #0b0f19;
  --surface: #131b2e;
  --surface-elevated: #1c2742;
  --border: rgba(255, 255, 255, 0.09);

  /* Текст */
  --fg: #f8fafc;
  --muted: #94a3b8;
  --meta: #64748b;

  /* Основен акцент (Топъл испански кехлибар/теракота) */
  --accent: #f59e0b;
  --accent-ink: #0b0f19;
  --accent-soft: rgba(245, 158, 11, 0.15);

  /* Цветово кодиране на граматичния род в испанския */
  --gender-m: #38bdf8;          /* Синьо за мъжки род: el / un */
  --gender-m-bg: rgba(56, 189, 248, 0.14);
  --gender-f: #fb7185;          /* Коралово-розово за женски род: la / una */
  --gender-f-bg: rgba(251, 113, 133, 0.14);

  /* Семантични цветове за отговори */
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

### 8.2. Макет на главния екран (Reels Лентата `/`)

```text
┌──────────────────────────────────────────┐
│ [▓▓▓▓▓▓▓▓░░░░] 12/20 min   Pack 01   🔊 │  <- TopProgressBar (44px височина)
├──────────────────────────────────────────┤
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │       СНИМКА НА ОБЕКТА /         │   │  <- 35-42% от височината на картата
│   │       СИТУАЦИЯТА (с плавен       │   │     (с малък надпис за лиценз долу вдясно)
│   │        градиент надолу)          │   │
│   └──────────────────────────────────┘   │
│                                          │
│     [el]  gato                  🔊  🐢   │  <- Испанска дума/фраза (Literata 32px)
│     [ел ГА-то] · the cat                 │     'el' е в синя капсула (--gender-m)
│                                          │     🐢 пуска аудиото бавно (0.75x)
│     "El gato duerme en el sofá."         │  <- Кликаемо мини-изречение (X-Ray)
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ How do you say 'the cat'?        │   │
│   │  [  el gato                   ]  │   │  <- Големи бутони за палец (min 48px)
│   │  [  el perro                  ]  │   │
│   │  [  la casa                   ]  │   │
│   └──────────────────────────────────┘   │
│                                          │
│   [✓ I know this]          [⭐]   [⚑]    │  <- Долен ред за бързи действия на картата
├──────────────────────────────────────────┤
│    🔥 Feed    📅 Today   📚 Words  ⚙️    │  <- BottomNav (56px височина)
└──────────────────────────────────────────┘
```

### 8.3. Ключови UX детайли за Reels лентата
1. **Еднопосочен поток с плавно щракване:**
   - Контейнерът `.feed-viewport` има `height: calc(100dvh - 100px); overflow-y: scroll; scroll-snap-type: y mandatory; overscroll-behavior-y: contain;`.
   - Всяка карта `.feed-card` има `height: 100%; scroll-snap-align: start; scroll-snap-stop: always;`.
2. **Два бутона за аудио на всяка карта:**
   - 🔊 **Нормална скорост (1.0x)** — пуска `.mp3` файла (или `speechSynthesis` с `es-ES`, ако файлът още не е генериран).
   - 🐢 **Бавно и ясно (0.75x)** — задава `audio.playbackRate = 0.75`. Изключително полезно за начинаещ от нулата!
3. **Долен панел „Рентген“ (`XRaySheet.tsx`):**
   - При докосване на която и да е испанска дума в картата се отваря долен панел (bottom sheet) с:
     - Думата + членът (оцветен по род) + бутони 🔊 и 🐢;
     - Значение на английски и български;
     - Основна речникова форма (`lemma`) и граматична роля;
     - Полето `bg_bridge` (ако има такова);
     - Бутон **„✓ I already know this word“** (маркира я като `mastered = true`).
   - Отварянето на панела добавя запис в `history.pushState`, така че бутонът „Назад“ на телефона го затваря без да излиза от приложението.
4. **Автоматично отчитане на времето (15–30 мин/ден):**
   - Таймер в клиента брои активните секунди (само докато разделът е видим `document.visibilityState === 'visible'` и е имало докосване/скрол през последните 45 секунди).
   - На всеки 30 секунди (или при завършване на карта) праща `active_seconds_delta` към `POST /api/events`, което обновява `ezik_app_daily_stats` и горната прогрес лента `12 / 20 min`.
5. **Офлайн памет (`sw.js` + `sessionStorage`):**
   - Клиентът винаги изтегля следващия пакет от 10 карти, когато потребителят стигне до 7-мата карта в текущия пакет, и предварително зарежда (`new Image()`, `<link rel="preload" as="audio">`) снимките и аудиото на следващите 3 карти, за да няма никакво забавяне при скролване.

---

## 9. API Маршрути (Next.js Route Handlers)

Всички маршрути проверяват сесийна бисквитка `ezik_session` (подписана с `SESSION_SECRET`). При липса връщат `401 Unauthorized`.

| Маршрут | Метод | Вход | Изход / Действие |
| --- | --- | --- | --- |
| `/api/auth/login` | `POST` | `{ username, password }` | Проверява `bcrypt` хеша в `ezik_app_users`, задава `HttpOnly` бисквитка за 90 дни |
| `/api/auth/logout` | `POST` | — | Изчиства бисквитката |
| `/api/feed` | `GET` | `?limit=10&pack=es_01` (по избор) | Извиква Миксера (`mixer.ts`), връща `{ cards: CardDTO[], activePack, stage, todayStats }` |
| `/api/events` | `POST` | `{ cardId, itemId, eventType, rating, responseMs, dwellMs, activeSecondsDelta }` | Записва в `ezik_app_events`, обновява `ezik_app_item_state` чрез `ts-fsrs`, обновява `ezik_app_daily_stats`, проверява дали се отключва следващият пакет |
| `/api/today` | `GET` | — | Връща дневния прогрес (минути, карти, нови думи, преговори), текущата серия от дни (streak) и списък на всички 20 пакета с % завършеност |
| `/api/items` | `GET` | `?pack=es_01&filter=learning\|due\|mastered&q=...` | Връща списък с думите/фразите на потребителя заедно с тяхната сила (0–5) и следваща дата за преговор |
| `/api/items/[id]` | `PATCH` | `{ action: 'know' \| 'reset' \| 'review_now' }` | Променя `ezik_app_item_state` за конкретна дума |
| `/api/settings` | `GET / PATCH` | Частичен обект `SettingsDTO` | Чете или обновява `ezik_app_settings` (вкл. смяна на активен пакет, дневна цел, звук, помощ на български, тема) |

---

## 10. План за изпълнение по фази (Чеклист за агента-разработчик)

Всяка фаза завършва с работещо и проверимо състояние.

### Фаза 0 (Ф0): Основа, База данни, Скелет на приложенията и Вход (1–2 дни)
- [ ] **Задача 0.1:** Създаване на `database/migrations/001_ezik_app_init.sql` (по т. 3.1 от тази спецификация) и изпълнението ѝ върху `<your-supabase-db-container>` като `supabase_admin`.
- [ ] **Задача 0.2:** Създаване на началния потребител на Петър в `ezik_app_users` (копиране на потребител/парола от `art_app_users` в същата база, за да влиза със същите данни!) и начален ред в `ezik_app_settings` (`target_lang = 'es'`, `ui_lang = 'en'`, `daily_minutes_goal = 20`).
- [ ] **Задача 0.3:** Инициализиране на Next.js 16 (App Router, TypeScript) в `apps/web/` с `globals.css` (CSS променливите от т. 8.1), шрифтовете `Onest` и `Literata`, вход `/login`, навигация `BottomNav` и `TopProgressBar`.
- [ ] **Задача 0.4:** Инициализиране на Python worker-а (`uv`) в `services/worker/` с `config.py`, `db.py`, `models.py` (Pydantic моделите за 10-те типа карти) и `pytest`.
- [ ] **Задача 0.5:** Подготовка на `deploy/docker-compose.yml`, `deploy/nginx/ezik.example.com.conf` и `deploy/push.sh`.
- **Готово, когато:** Влизам на `http://localhost:3000` (и `https://ezik.example.com` след DNS насочване) с паролата си и виждам основния интерфейс.

### Фаза 1 (Ф1): Първите 3 пакета за Испански от нулата + Визуална Reels лента (3–4 дни)
- [ ] **Задача 1.1:** Имплементиране на `curriculum.py` в worker-а и пускане на `seed-curriculum` за **Pack 01 (Произношение и международни думи)**, **Pack 02 (Поздрави и оцеляване)** и **Pack 03 (Кой съм аз)** (~120 испански единици в `ezik_app_items`).
- [ ] **Задача 1.2:** Имплементиране на `images.py` (Pixabay + Wikimedia Commons + Pexels) и изтегляне на снимки за всички 120 единици.
- [ ] **Задача 1.3:** Генериране на първите ~350 карти в `ezik_app_cards` от 5-те основни типа за начинаещ:
  1. `sound_rule` (12 карти за четене и произношение)
  2. `visual_word` (снимка + дума с цветен род `el`/`la` + мини-изречение + тест)
  3. `phrase_situation` (житейска ситуация със снимка)
  4. `micro_builder` (магнитни блокчета за сглобяване на фраза)
  5. `trap_choice` (род, `ser/estar`, произношение)
- [ ] **Задача 1.4:** Изграждане на `FeedContainer.tsx` (Reels scroll-snap), 5-те компонента за карти, `XRaySheet.tsx` (долен панел при докосване на дума) и `AudioButton.tsx` (1.0x + 0.75x със синтезатор на браузъра като временна резерва преди Ф3).
- **Готово, когато:** Скролвам като в Reels през първите 50 карти на испански от нулата, виждам снимки, чувам произношението (нормално и бавно), сглобявам фрази с един пръст и докосвам думи за обяснение.

### Фаза 2 (Ф2): Двигателят на паметта (FSRS), Миксерът и „Моите думи“ (2–3 дни)
- [ ] **Задача 2.1:** Интегриране на `ts-fsrs` в `apps/web/src/lib/fsrs.ts` и свързване на `POST /api/events` с обновяване на `ezik_app_item_state` и `ezik_app_daily_stats`.
- [ ] **Задача 2.2:** Пълна имплементация на `mixer.ts` (адаптивен пакет от 10 карти, краткосрочно ехо след 4–5 карти, автоматично отключване на следващия пакет при ≥ 75% преминати единици).
- [ ] **Задача 2.3:** Екран `/words` („My Words & Phrases“): списък по пакети, търсачка, индикатор за сила (0–5 чертички), бутони „I know this“ и „Practice now“.
- [ ] **Задача 2.4:** Екран `/today`: дневен пръстен за 15–30 мин., серия от дни (streak), карта на 20-те пакета с бутон за избор на пакет.
- **Готово, когато:** Сбъркана или докосната дума се връща след няколко карти в нов формат, а прогресът ми и дневните минути се пазят на сървъра.

### Фаза 3 (Ф3): Kokoro-82M Аудио пайплайн, „Чуй преди да видиш“ и Говорене (2–3 дни)
- [ ] **Задача 3.1:** Имплементиране на `tts.py` (Kokoro-82M с испански гласове `ef_dora` и `em_alex` + времеви маркери `word_timings`) и генериране на `.mp3` файлове за всички единици и карти.
- [ ] **Задача 3.2:** Имплементиране на `AudioBlurCard.tsx` („Чуй преди да видиш“ със замъглен текст и синхронно светване на думите).
- [ ] **Задача 3.3:** Имплементиране на `SayItCard.tsx` (Активно казване на глас → обръщане → самооценка) и `ShadowingCard.tsx` (Гласово ехо с микрофон през Web Speech API `es-ES`).
- **Готово, когато:** Всички карти звучат с естествен испански глас, мога да тренирам разбиране на слух и да изговарям фрази на глас.

### Фаза 4 (Ф4): „Мостът“ към четене (`Diglot Weave` + `Story X-Ray`) и Пакети 04–12 (2–3 дни)
- [ ] **Задача 4.1:** Имплементиране на `DiglotWeaveCard.tsx` (английско изречение с вплетени испански думи) и `StoryXRayCard.tsx` (кратки илюстрирани истории на испански, в които всяка дума е кликаема).
- [ ] **Задача 4.2:** Генериране на съдържанието, снимките и аудиото за **Пакети 04 до 12** (кафене, град, числа, посоки, основни глаголи, семейство, харесване, ежедневие — ~450 нови единици и ~1 500 карти).
- **Готово, когато:** След базовите думи в лентата се появяват хибридни изречения и първите кратки истории на испански с рентген на всяка дума.

### Фаза 5 (Ф5): Пакети 13–20, Динамични Ехо-карти, Офлайн PWA и Известия (2–3 дни)
- [ ] **Задача 5.1:** Генериране на **Пакети 13 до 20** (пазаруване, време, здраве, планове, минало време, любопитни истории и идеи на прост испански).
- [ ] **Задача 5.2:** Endpoint `/api/echo` — когато дума е `due` за преговор и всички налични карти с нея вече са видени, Haiku генерира нова карта на момента и я записва в `ezik_app_cards`.
- [ ] **Задача 5.3:** Service Worker (`public/sw.js`) за офлайн кеширане на следващите 20 карти (заедно със снимките и аудиото им) + сутрешно Web Push известие.
- **Готово, когато:** Приложението работи гладко и в метрото без интернет, а пълната програма от 20 пакета (~1 000 испански единици и ~3 000+ карти) е налична.

### Фаза 6 (Ф6 — Следваща голяма цел): Надграждане с Английски C1 (Бизнес, ИИ, Философия, Книги)
- [ ] Добавяне на `target_lang = 'en'`, `current_cefr = 'C1'` в превключвателя за език в горната лента.
- [ ] Добавяне на C1 типовете карти за говорене и аргументиране („Идея за разговор / Talking Point“, „Как би го казал носител на C1?“, „Български капани за напреднали“) върху същата база и интерфейс.
