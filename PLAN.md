# PLAN — Language Feed ("Like a Local" / `ezik.example.com`)

> An endless vertical feed, like Reels/TikTok, where you scroll through visual, interactive cards with photos, audio and real-life situations — learning a language step by step from absolute zero, while the system quietly brings back exactly what you are about to forget (FSRS).
> The full technical development specification is in **[SPEC.md](SPEC.md)**.

**Version:** 2 · 2026-10-18 · status: **Approved for implementation (Spanish from scratch as the first language)**

---

## 1. Goal and success metrics

- **Who it is for:** built first for the author's own learning; open for anyone.
- **First goal (now, P0 → P5):** **Spanish from absolute zero (`A0 → A1 → A2`)** — from how every letter is read and the most common words with photos, through ordering a coffee and finding your way around a city, to understanding short stories and saying phrases fluently out loud.
- **Second goal (P6, built on top of the same architecture):** **English at C1 level** (business English, plus exercises and speaking prompts about artificial intelligence, philosophy and books).
- **Base language (interface, instructions, translations):** **English (`en`)** + short **Bulgarian "bridges" (`bg_bridge`)** wherever Bulgarian makes Spanish much easier (pronunciation, the reflexive *се/си*, dropping *аз/ти* ("I/you"), grammatical gender, *ти/Вие* (informal/formal "you")).

| Metric | Target after 3 months |
| --- | --- |
| Daily activity in the feed | 15–30 min per day (≥ 5 days a week) |
| Spanish words and phrases learned (FSRS stability ≥ 21 days) | ≥ 800–1,000 items (all 20 packs for A0→A2) |
| Accuracy on interactive cards | 80–90% |
| Ability to handle real situations (café, hotel, directions, meeting people) | Understanding effortlessly and saying it out loud without hesitation |

---

## 2. Why the base is English + a Bulgarian "bridge" (the easiest way to learn Spanish from zero)

1. **English gives you ~3,000 Spanish words for free (cognates):**
   Words like *hotel, restaurante, hospital, animal, importante, diferente, idea, problema, information/información (-tion = -ción)* are almost identical in English and Spanish. When the interface and translations are in English, the brain sees the connection immediately (and keeps English active at the same time).
2. **Bulgarian gives 4 huge advantages that English speakers don't have (`bg_bridge`):**
   - **1:1 phonetics:** Spanish vowels (*a, e, i, o, u*) are pure and short, exactly like the Bulgarian *а, е, и, о, у*. *Ñ* is exactly the Bulgarian *нь* (*баня → mañana*), *ll/y* is *й* (*pollo → пойо*), *j* is *х* (*trabajo → трабахо*).
   - **No "I" in front of every verb:** In Spanish you say *Hablo español* = *Говоря испански* ("I speak Spanish") — no *Yo* needed, unlike the English *I speak*.
   - **The particle "се" (`me / te / se`):** *Me llamo* = *Казвам се* ("my name is"), *Se vende* = *Продава се* ("for sale").
   - **Gender of nouns and "ти / Вие":** Every noun has a gender (*el / la*), and *tú / usted* works exactly like the Bulgarian *ти / Вие* (informal/formal "you").
3. **Direct visual link (Photo → Spanish word):**
   Every word and situation has a real photo (from Pixabay, Wikimedia Commons, Pexels). You see a cat → you hear and see **el gato** (with a blue pill for the masculine `el`); you see a building → **el edificio**; you see a cup of coffee → **Un café con leche, por favor**.

---

## 3. The teaching ladder: 5 stages from zero to reading and speaking

The feed doesn't throw a beginner into long texts on day one; instead, it unlocks new card types gradually across **20 themed packs (`Pack 01` → `Pack 20`)**:

1. **Stage 0 — The secret code of reading + Transparent words (Day 1):**
   12 interactive cards for the letters that are read differently (*h, ñ, ll, j, ge/gi, c/z, qu, rr, v/b*) + 25 international words with photos that you already know before you've studied any Spanish.
2. **Stage 1 — Visual core (The first 150 words with photos and color-coded gender):**
   Objects, food, places, people, numbers and basic verbs (*ser, estar, tener, querer, ir*). Masculine (`el`) always glows sky blue, and feminine (`la`) coral pink.
3. **Stage 2 — Surviving real situations (Survival Chunks):**
   Ready-made phrases for the café, restaurant, airport, hotel, street and shopping + building sentences from magnetic tiles.
4. **Stage 3 — "The Bridge" (Diglot Weave + Micro-stories with an X-ray of every word):**
   - **Diglot Weave:** Short, interesting sentences in English with the Spanish words you've learned woven directly into them.
   - **Story X-Ray:** The first short dialogues and stories in Spanish (15–30 words), where **every word can be tapped** for an instant translation and pronunciation.
5. **Stage 4 — Listening and actively speaking (A1 → A2):**
   "Hear before you see" (blurred text), "Say it out loud → check" and "Voice echo with the microphone".

---

## 4. The ten interactive card types in the Reels feed

Every card is full screen and takes **5–20 seconds to complete with one thumb**:

| # | Card type (`card_type`) | What's on screen and what I do | What it trains |
| --- | --- | --- | --- |
| 1 | **Sound & letter** (`sound_rule`) | A letter/combination (*ñ, ll, j, qu*) + rule + 3 examples with photos and audio + a quick question | Reading and pronunciation from Day 1 |
| 2 | **Visual word** (`visual_word`) | Large photo + word with a color-coded article (`el`/`la`) + 🔊 normal and 🐢 slow audio + mini-sentence + choice of 3 answers | Visual vocabulary and word gender |
| 3 | **Real-life situation** (`phrase_situation`) | Photo of a situation (café, train station, hotel) + conversational phrase + word-by-word breakdown + question | Ready-made phrases for real life |
| 4 | **Magnetic tiles** (`micro_builder`) | Situation in English + photo → I tap 3–6 shuffled Spanish tiles to build the phrase | Actively building sentences and word order |
| 5 | **Hybrid bridge** (`diglot_weave`) | An interesting English sentence where 2–3 key words are in Spanish (tappable) + micro-question | Smooth transition from single words to reading |
| 6 | **Story with X-ray** (`story_xray`) | A short illustrated story/dialogue in Spanish (15–50 words). **Every word is tappable** in a bottom panel + comprehension question | Reading comprehension and grammar from context |
| 7 | **Hear before you see** (`audio_blur`) | Photo + audio (1.0x and 0.75x); the text is blurred. I choose what it means → the text clears and the words light up | Understanding spoken Spanish by ear |
| 8 | **Say it yourself → check** (`say_it`) | Situation and phrase in English → I say it in Spanish out loud/in my head → flip → hear the audio and grade myself | Active recall from memory (speaking) |
| 9 | **Voice echo** (`shadowing`) | I listen to the phrase, press the microphone and read it out loud; recognized words light up green | Pronunciation and overcoming the speaking barrier |
| 10 | **Spanish trap** (`trap_choice`) | Choice between 2–3 options (*el problema* vs *la problema*, *soy* vs *estoy*, *por* vs *para*) + a clear explanation | Grammatical accuracy without dry rules |

---

## 5. The feed mixer and memory (FSRS)

- **Batch of 10 cards:**
  - **50% (5 cards):** New words/phrases from the currently active pack (`Pack 01` … `Pack 20`).
  - **30% (3 cards):** Active practice (`micro_builder`, `audio_blur`, `say_it`, `trap_choice`), including an **immediate echo** of a word seen 4–5 cards earlier in the same session.
  - **20% (2 cards):** Hidden review of words from previous days whose review time (`due`) under the **FSRS (`ts-fsrs`)** algorithm has arrived today.
- **Automatic progression:** Once you pass ≥ 75% of the words in the current pack, the next pack unlocks automatically.
- **"✓ I know this" button:** Any word can be marked as already known with a single tap, so no more time is wasted reviewing it.

---

## 6. Implementation phases

The detailed task checklist for each phase is in **[SPEC.md — Section 10](SPEC.md)**.

| Phase | Scope | Outcome |
| --- | --- | --- |
| **P0 Foundation** | SQL migration `001_ezik_app_init.sql`, Next.js 16 PWA skeleton, Python worker, login and deploy configuration for `ezik.example.com` | Working login and an empty Reels frame on the phone |
| **P1 First steps (Packs 01–03)** | Generator for Packs 01–03 (~120 items), photos from Pixabay/Wikimedia, ~350 cards (`sound_rule`, `visual_word`, `phrase_situation`, `micro_builder`, `trap_choice`), Reels feed and X-Ray panel | Scrolling through the first 50 visual Spanish cards from scratch |
| **P2 Memory & Progress** | FSRS (`ts-fsrs`), full Mixer with pack tracking, `/words` screen ("My Words") and `/today` screen (15–30 min daily goal + streak) | Spaced repetition system and full control over the vocabulary |
| **P3 Sound & Speaking** | Local Kokoro-82M (`es`) pipeline with timestamps, `audio_blur`, `say_it` and `shadowing` cards (Web Speech API) | Natural Spanish voice (1.0x and 🐢 0.75x), listening and speaking with the microphone |
| **P4 Bridge to reading (Packs 04–12)** | `diglot_weave` and `story_xray` cards (every word tappable) + generation of Packs 04–12 (~450 items, ~1,500 cards) | Transition from single words and phrases to short stories and dialogues |
| **P5 Full program & Offline (Packs 13–20)** | Packs 13–20, dynamic on-the-spot Echo cards (`/api/echo`), offline cache in the Service Worker and a morning notification | All 20 packs (~1,000 items) + works in the subway without internet |
| **P6 Second language: English C1** | `ES (A0→A2)` ↔ `EN (C1)` switch and specialized speaking cards for business, AI, philosophy and books | Two languages at two different levels in one app |
