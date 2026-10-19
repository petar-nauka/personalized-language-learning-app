from __future__ import annotations

import random
import re
from typing import Any
from ezik_worker.claude_client import ClaudeClient
from ezik_worker.config import HAIKU_MODEL, SONNET_MODEL
from ezik_worker.curriculum_a1_b2 import (
    EXTRA_STORIES,
    EXTRA_TRAPS,
    ITEMS_A1_TO_B2,
    PACKS_B1_B2,
)
from ezik_worker.validators import validate_and_normalize_card

# 1. All 40 structured packs (A0 -> A1 -> A2 -> B1 -> B2)
SPANISH_PACKS: list[dict[str, Any]] = [
    {
        "code": "es_01",
        "target_lang": "es",
        "seq_order": 1,
        "stage": 0,
        "cefr": "A0",
        "title_en": "Read & Speak Spanish in 10 Minutes",
        "title_bg": "Прочети и проговори испански за 10 минути",
        "description_en": "10 secret sound rules (h, ñ, ll, j, qu, c/z) + 25 instant international words you already know.",
        "icon": "✨",
    },
    {
        "code": "es_02",
        "target_lang": "es",
        "seq_order": 2,
        "stage": 0,
        "cefr": "A0",
        "title_en": "Greetings, Courtesy & Survival Basics",
        "title_bg": "Поздрави, учтивост и оцеляване",
        "description_en": "Say hello, thank you, excuse me, and handle any first conversation politely.",
        "icon": "👋",
    },
    {
        "code": "es_03",
        "target_lang": "es",
        "seq_order": 3,
        "stage": 0,
        "cefr": "A0",
        "title_en": "Who I Am (Origin, Name & Languages)",
        "title_bg": "Кой съм аз (име, произход, езици)",
        "description_en": "Introduce yourself, say where you are from and where you live using ser, llamarse, and vivir.",
        "icon": "🪪",
    },
    {
        "code": "es_04",
        "target_lang": "es",
        "seq_order": 4,
        "stage": 0,
        "cefr": "A0",
        "title_en": "At the Café & Restaurant",
        "title_bg": "В кафенето и ресторанта",
        "description_en": "Order coffee, water, tapas, and ask for the bill like a local in Madrid.",
        "icon": "☕",
    },
    {
        "code": "es_05",
        "target_lang": "es",
        "seq_order": 5,
        "stage": 0,
        "cefr": "A0",
        "title_en": "Everyday Objects, Places & Visual Gender (el / la)",
        "title_bg": "Ежедневни предмети, места и род (el / la)",
        "description_en": "Build direct mental images for the most common nouns around the house and city.",
        "icon": "🏠",
    },
    {
        "code": "es_06",
        "target_lang": "es",
        "seq_order": 6,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Numbers, Prices, Time & Days",
        "title_bg": "Числа, цени, час и дни",
        "description_en": "Ask how much things cost, pay by card or cash, and tell the time.",
        "icon": "🕒",
    },
    {
        "code": "es_07",
        "target_lang": "es",
        "seq_order": 7,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Getting Around Town (Directions & Transport)",
        "title_bg": "Ориентиране в града и транспорт",
        "description_en": "Find the metro, train station, hotel, or bathroom using estar and ir.",
        "icon": "🧭",
    },
    {
        "code": "es_08",
        "target_lang": "es",
        "seq_order": 8,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Core Verbs in Action (-ar, -er, -ir)",
        "title_bg": "Основни глаголи в действие",
        "description_en": "Speak about speaking, working, eating, reading, and living in the present tense.",
        "icon": "⚡",
    },
    {
        "code": "es_09",
        "target_lang": "es",
        "seq_order": 9,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Ser vs. Estar & Describing the World",
        "title_bg": "Ser срещу Estar и описание на света",
        "description_en": "Master the difference between permanent qualities (es) and current states (está).",
        "icon": "⚖️",
    },
    {
        "code": "es_10",
        "target_lang": "es",
        "seq_order": 10,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Family, People & Tener Expressions",
        "title_bg": "Семейство, хора и изрази с tener",
        "description_en": "Talk about friends, family, and feelings like hungry, thirsty, or right (tener hambre/razón).",
        "icon": "👨‍👩‍👧",
    },
    {
        "code": "es_11",
        "target_lang": "es",
        "seq_order": 11,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Likes, Interests & Preferences (Me gusta)",
        "title_bg": "Харесване и предпочитания (Me gusta)",
        "description_en": "Express what you love, like, and prefer in food, books, and travel.",
        "icon": "❤️",
    },
    {
        "code": "es_12",
        "target_lang": "es",
        "seq_order": 12,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Daily Routine & Reflexive Verbs (me / se)",
        "title_bg": "Дневен режим и възвратни глаголи (се)",
        "description_en": "Wake up, get dressed, go to work, and relax — using 'me/te/se' just like Bulgarian 'се'.",
        "icon": "🌅",
    },
    {
        "code": "es_13",
        "target_lang": "es",
        "seq_order": 13,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Shopping, Clothes & Colors",
        "title_bg": "Пазаруване, дрехи и цветове",
        "description_en": "Ask for sizes, colors, and try things on in a shop.",
        "icon": "🛍️",
    },
    {
        "code": "es_14",
        "target_lang": "es",
        "seq_order": 14,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Weather, Seasons & Nature",
        "title_bg": "Времето, сезоните и природата",
        "description_en": "Talk about sunny days, rain, mountains, and the sea.",
        "icon": "☀️",
    },
    {
        "code": "es_15",
        "target_lang": "es",
        "seq_order": 15,
        "stage": 1,
        "cefr": "A1",
        "title_en": "Health, Body & Pharmacy",
        "title_bg": "Здраве, тяло и аптека",
        "description_en": "Explain what hurts and ask for help at a pharmacy or doctor.",
        "icon": "🩺",
    },
    {
        "code": "es_16",
        "target_lang": "es",
        "seq_order": 16,
        "stage": 2,
        "cefr": "A2",
        "title_en": "Making Plans & Near Future (Voy a...)",
        "title_bg": "Правене на планове и близко бъдеще",
        "description_en": "Talk about what you are going to do tonight, tomorrow, and next weekend.",
        "icon": "📅",
    },
    {
        "code": "es_17",
        "target_lang": "es",
        "seq_order": 17,
        "stage": 2,
        "cefr": "A2",
        "title_en": "Conversational Glue & Connectors",
        "title_bg": "Свързващи думи и естествен разговор",
        "description_en": "Sound natural with porque, pero, además, entonces, sin embargo, creo que.",
        "icon": "💬",
    },
    {
        "code": "es_18",
        "target_lang": "es",
        "seq_order": 18,
        "stage": 2,
        "cefr": "A2",
        "title_en": "Talking About the Past",
        "title_bg": "Разказване в минало време",
        "description_en": "Share what you did today and yesterday using high-frequency past forms.",
        "icon": "⏳",
    },
    {
        "code": "es_19",
        "target_lang": "es",
        "seq_order": 19,
        "stage": 2,
        "cefr": "A2",
        "title_en": "Stories, Culture & Childhood Memories",
        "title_bg": "Истории, култура и спомени",
        "description_en": "Read short engaging stories about Spain, Latin America, and past habits.",
        "icon": "🏛️",
    },
    {
        "code": "es_20",
        "target_lang": "es",
        "seq_order": 20,
        "stage": 2,
        "cefr": "A2",
        "title_en": "Ideas, Books, AI & Future in Spanish",
        "title_bg": "Идеи, книги, ИИ и бъдещето на испански",
        "description_en": "Express your thoughts on books, philosophy, and technology in clear Spanish.",
        "icon": "🤖",
    },
    *PACKS_B1_B2,
]

PACK_META_BY_CODE: dict[str, dict[str, Any]] = {p["code"]: p for p in SPANISH_PACKS}


# 2. Sound rules for Pack 01 (Stage 0)
SOUND_RULES_DATA: list[dict[str, Any]] = [
    {
        "text": "Rule 1: H is always silent",
        "lemma": "h",
        "phonetic_hint": "нямо H (не се чете!)",
        "en_gloss": "Silent letter H (hola -> ola)",
        "bg_gloss": "Буквата H никога не се произнася",
        "bg_bridge": "Забрави за английското H! В испанския H е напълно нямо: hola се чете „О-ла“, hotel се чете „о-ТЕЛ“.",
        "wiki_title": "Hotel",
        "content": {
            "grapheme": "H / h",
            "phonetic_en": "100% Silent — never pronounced!",
            "phonetic_bg": "Напълно нямо — пропускаш го: hola → О-ла, hotel → о-ТЕЛ",
            "rule_title": "Rule #1: The letter H is invisible to your ears",
            "rule_summary": "In Spanish, 'h' at the start of a word makes zero sound. Start directly with the vowel after it.",
            "examples": [
                {"es": "hola", "phonetic": "О-ла", "en": "hello"},
                {"es": "el hotel", "phonetic": "ел о-ТЕЛ", "en": "the hotel"},
                {"es": "el hospital", "phonetic": "ел ос-пи-ТАЛ", "en": "the hospital"},
            ],
            "question": {
                "prompt": "How do you pronounce 'el helado' (the ice cream)?",
                "options": ["ел е-ЛА-до (silent H)", "ел хе-ЛА-до (hard H)", "ел ше-ЛА-до"],
                "answer": 0,
                "explain": "Because 'h' is always silent in Spanish, 'helado' starts directly with the 'e' sound: е-ЛА-до.",
            },
        },
    },
    {
        "text": "Rule 2: Ñ sounds like Bulgarian НЬ",
        "lemma": "ñ",
        "phonetic_hint": "ñ = НЬ (като в „баня“)",
        "en_gloss": "NY sound as in canyon (mañana)",
        "bg_gloss": "Звучи точно като българско „НЬ“",
        "bg_bridge": "Точно като мекото „нь“ в българската дума „баня“ или „коняк“!",
        "wiki_title": "Espresso",
        "content": {
            "grapheme": "Ñ / ñ",
            "phonetic_en": "Sounds like 'ny' in 'canyon'",
            "phonetic_bg": "Точно като българското „НЬ“ в „баня“: mañana → ма-НЯ-на",
            "rule_title": "Rule #2: The famous Spanish Ñ",
            "rule_summary": "The wave on top (tilde) softens N into a 'ny' sound — identical to Bulgarian 'нь'.",
            "examples": [
                {"es": "mañana", "phonetic": "ма-НЯ-на", "en": "tomorrow / morning"},
                {"es": "el español", "phonetic": "ел ес-па-НЬОЛ", "en": "Spanish"},
                {"es": "el baño", "phonetic": "ел БА-ньо", "en": "the bathroom"},
            ],
            "question": {
                "prompt": "How is 'el niño' (the boy) pronounced?",
                "options": ["ел НИ-ньо", "ел НИ-но", "ел НИН-го"],
                "answer": 0,
                "explain": "Ñ always sounds like Bulgarian 'нь' (ni-nyo).",
            },
        },
    },
    {
        "text": "Rule 3: LL and Y sound like Й",
        "lemma": "ll",
        "phonetic_hint": "ll = Й (като в „йога“)",
        "en_gloss": "Double L sounds like Y in 'yes'",
        "bg_gloss": "Двойно L се чете като „Й“",
        "bg_bridge": "Когато видиш двойно LL, никога не чети „Л“! Чети го като българско „Й“: calle → КА-йе, pollo → ПО-йо.",
        "wiki_title": "Paella",
        "content": {
            "grapheme": "LL / Y",
            "phonetic_en": "Sounds like 'y' in 'yes'",
            "phonetic_bg": "Чете се като българско „Й“: calle → КА-йе, pollo → ПО-йо",
            "rule_title": "Rule #3: Double L is a Y sound!",
            "rule_summary": "Never read 'll' as an L. In Spanish, 'll' and 'y' sound like Bulgarian 'й'.",
            "examples": [
                {"es": "la calle", "phonetic": "ла КА-йе", "en": "the street"},
                {"es": "el pollo", "phonetic": "ел ПО-йо", "en": "the chicken"},
                {"es": "me llamo", "phonetic": "ме Я-мо", "en": "my name is"},
            ],
            "question": {
                "prompt": "How do you pronounce 'la llave' (the key)?",
                "options": ["ла Я-ве (Y sound)", "ла ЛА-ве (L sound)", "ла ХА-ве"],
                "answer": 0,
                "explain": "'ll' is pronounced like 'y' (ла Я-ве).",
            },
        },
    },
    {
        "text": "Rule 4: J and GE/GI sound like Bulgarian Х",
        "lemma": "j",
        "phonetic_hint": "j / ge / gi = Х",
        "en_gloss": "Strong H sound (like Loch / Bulgarian Х)",
        "bg_gloss": "Буквата J (и G пред E/I) се чете като „Х“",
        "bg_bridge": "Още едно предимство за българи: испанското J е просто нашето „Х“! Jamón → ха-МОН, trabajo → тра-БА-хо.",
        "wiki_title": "Jamón",
        "content": {
            "grapheme": "J / GE / GI",
            "phonetic_en": "Crisp throat 'kh' sound (never like English J!)",
            "phonetic_bg": "Точно като българското „Х“: trabajo → тра-БА-хо, gente → ХЕН-те",
            "rule_title": "Rule #4: J is a Bulgarian 'Х' sound",
            "rule_summary": "Spanish J (and G before E or I) is pronounced exactly like the Bulgarian letter 'Х'.",
            "examples": [
                {"es": "el trabajo", "phonetic": "ел тра-БА-хо", "en": "the work / job"},
                {"es": "el jamón", "phonetic": "ел ха-МОН", "en": "cured ham"},
                {"es": "la gente", "phonetic": "ла ХЕН-те", "en": "the people"},
            ],
            "question": {
                "prompt": "How do you read 'el jardín' (the garden)?",
                "options": ["ел хар-ДИН (с „Х“)", "ел джар-ДИН (с „ДЖ“)", "ел яр-ДИН"],
                "answer": 0,
                "explain": "Spanish 'j' is always read as 'х': хар-ДИН.",
            },
        },
    },
    {
        "text": "Rule 5: QU is always K (silent U)",
        "lemma": "qu",
        "phonetic_hint": "que = КЕ, qui = КИ",
        "en_gloss": "QU sounds like K (quiero -> kiero)",
        "bg_gloss": "QU се чете просто като „К“ (U не се чете)",
        "bg_bridge": "В комбинациите QUE и QUI буквата U е няма: queso се чете „КЕ-со“, quiero се чете „КИЕ-ро“.",
        "wiki_title": "Manchego",
        "content": {
            "grapheme": "QUE / QUI",
            "phonetic_en": "Sounds like 'ke' and 'ki' (never 'kwe'!)",
            "phonetic_bg": "Чете се „КЕ“ и „КИ“ (буквата U след Q не се чете!)",
            "rule_title": "Rule #5: QU is a pure K sound",
            "rule_summary": "In 'que' and 'qui', the 'u' is silent. Read them as 'ke' and 'ki'.",
            "examples": [
                {"es": "el queso", "phonetic": "ел КЕ-со", "en": "the cheese"},
                {"es": "quiero", "phonetic": "КИЕ-ро", "en": "I want"},
                {"es": "aquí", "phonetic": "а-КИ", "en": "here"},
            ],
            "question": {
                "prompt": "How do you pronounce '¿Qué pasa?' (What's happening?)?",
                "options": ["КЕ ПА-са", "КУЕ ПА-са", "ЧЕ ПА-са"],
                "answer": 0,
                "explain": "'Qué' is pronounced simply 'КЕ' — the U is silent.",
            },
        },
    },
    {
        "text": "Rule 6: V and B sound the same",
        "lemma": "v/b",
        "phonetic_hint": "v ≈ b (меко Б)",
        "en_gloss": "V and B share the same soft B sound",
        "bg_gloss": "Буквите V и B звучат еднакво — като меко „Б“",
        "bg_bridge": "Затова испанците казват „Барселона“ и „Баленсия“ (Valencia → ба-ЛЕН-сия, vino → БИ-но)!",
        "wiki_title": "Red_wine",
        "content": {
            "grapheme": "V = B",
            "phonetic_en": "Both V and B sound like a soft 'B'",
            "phonetic_bg": "И двете се четат като меко „Б“: vino → БИ-но, vale → БА-ле",
            "rule_title": "Rule #6: Spanish V is actually a soft B!",
            "rule_summary": "In Spanish, there is no difference between B and V. Both sound like a soft B with your lips lightly touching.",
            "examples": [
                {"es": "el vino", "phonetic": "ел БИ-но", "en": "the wine"},
                {"es": "vale", "phonetic": "БА-ле", "en": "okay / sounds good"},
                {"es": "vamos", "phonetic": "БА-мос", "en": "let's go"},
            ],
            "question": {
                "prompt": "How does a native speaker pronounce 'vamos' (let's go)?",
                "options": ["БА-мос (soft B sound)", "ФА-мос", "УА-мос"],
                "answer": 0,
                "explain": "At the start of a word, 'v' sounds like a soft 'b': БА-мос.",
            },
        },
    },
    {
        "text": "Rule 7: C before E/I and Z",
        "lemma": "c/z",
        "phonetic_hint": "ce/ci/z = С (или испанско th)",
        "en_gloss": "Soft S or TH sound in cerveza, gracias",
        "bg_gloss": "C пред E/I и Z се четат като „С“ (или меко междузъбно С в Испания)",
        "bg_bridge": "Пред A, O, U буквата C е „К“ (casa = КА-са), но пред E и I става „С“ (центр → centro = СЕН-тро, gracias = ГРА-сиас).",
        "wiki_title": "Tapas",
        "content": {
            "grapheme": "CE / CI / Z",
            "phonetic_en": "Soft 's' (Latin America) or 'th' in 'think' (Spain)",
            "phonetic_bg": "Чете се като „С“ (или леко междузъбно в Мадрид): gracias → ГРА-сиас, cerveza → сер-БЕ-са",
            "rule_title": "Rule #7: When C becomes soft",
            "rule_summary": "Before A, O, U, 'c' is hard K (casa, café). Before E or I, and whenever you see Z, it is soft S/TH (cerveza, ciudad).",
            "examples": [
                {"es": "gracias", "phonetic": "ГРА-сиас", "en": "thank you"},
                {"es": "la cerveza", "phonetic": "ла сер-БЕ-са", "en": "the beer"},
                {"es": "el centro", "phonetic": "ел СЕН-тро", "en": "the city center"},
            ],
            "question": {
                "prompt": "In which word is 'C' pronounced like 'K'?",
                "options": ["la casa (the house)", "el centro (the center)", "la ciudad (the city)"],
                "answer": 0,
                "explain": "Before 'a', 'o', 'u', C is pronounced 'K' (КА-са). Before 'e' and 'i', it is soft (СЕН-тро, сиу-ДАД).",
            },
        },
    },
]


# 3. Curated Core Vocabulary & Phrases for Packs 01 to 05
# Tuple schema:
# (pack_code, kind, text, lemma, article, phonetic_hint, en_gloss, bg_gloss, en_explain, bg_bridge, example_text, example_en, wiki_query)
SEED_ITEMS: list[tuple[str, str, str, str, str | None, str, str, str, str, str, str, str, str]] = [
    # --- PACK 01: Instant Cognates (Stage 0) ---
    ("es_01", "cognate", "el hotel", "hotel", "el", "ел о-ТЕЛ", "the hotel", "хотелът", "Identical to English 'hotel', just remember the silent H!", "Членът 'el' показва мъжки род. H не се чете: ел о-ТЕЛ.", "El hotel está en el centro.", "The hotel is in the center.", "Hotel"),
    ("es_01", "cognate", "el café", "café", "el", "ел ка-ФЕ", "the coffee / the café", "кафето / кафенето", "Means both the drink (coffee) and the place (café).", "Ударението пада на последната сричка заради знака над é: ка-ФЕ.", "Quiero un café, por favor.", "I want a coffee, please.", "Espresso"),
    ("es_01", "cognate", "el restaurante", "restaurante", "el", "ел рес-тау-РАН-те", "the restaurant", "ресторантът", "Almost identical to English 'restaurant', with a final -e.", "Чете се буква по буква: рес-тау-РАН-те.", "El restaurante es muy bueno.", "The restaurant is very good.", "Restaurant"),
    ("es_01", "cognate", "el taxi", "taxi", "el", "ел ТАК-си", "the taxi", "таксито", "100% identical to English and Bulgarian.", "Мъжки род в испанския: el taxi.", "Necesito un taxi al aeropuerto.", "I need a taxi to the airport.", "Taxicab"),
    ("es_01", "cognate", "el aeropuerto", "aeropuerto", "el", "ел а-е-ро-ПУЕР-то", "the airport", "летището", "aero (air) + puerto (port) = airport!", "Всяка гласна се чете ясно: а-е-ро-ПУЕР-то.", "El autobús va al aeropuerto.", "The bus goes to the airport.", "Airport"),
    ("es_01", "cognate", "el tren", "tren", "el", "ел ТРЕН", "the train", "влакът", "Sounds just like English 'train'.", "Кратка и лесна дума от мъжки род: el tren.", "El tren sale a las diez.", "The train leaves at ten.", "High-speed_rail_in_Spain"),
    ("es_01", "cognate", "el autobús", "autobús", "el", "ел ау-то-БУС", "the bus", "автобусът", "Identical to Bulgarian 'автобус'!", "Точно като на български, с ударение на -bús.", "El autobús está aquí.", "The bus is here.", "Bus"),
    ("es_01", "cognate", "el hospital", "hospital", "el", "ел ос-пи-ТАЛ", "the hospital", "болницата", "Spelled like English 'hospital' (silent H!).", "Внимание: H не се чете → ос-пи-ТАЛ.", "¿Dónde está el hospital?", "Where is the hospital?", "Hospital"),
    ("es_01", "cognate", "el banco", "banco", "el", "ел БАН-ко", "the bank", "банката", "Cognate with English 'bank'.", "В испанския е от мъжки род: el banco.", "El banco está abierto.", "The bank is open.", "Bank"),
    ("es_01", "cognate", "el museo", "museo", "el", "ел му-СЕ-о", "the museum", "музеят", "Cognate with 'museum' (-um becomes -o in Spanish).", "Латинското -um става -o в испанския: museum → el museo.", "El museo del Prado es famoso.", "The Prado Museum is famous.", "Museo_del_Prado"),
    ("es_01", "cognate", "la música", "música", "la", "ла МУ-си-ка", "the music", "музиката", "Ends in -a → feminine ('la música').", "Завършва на -a, затова е женски род с розова капсула 'la'.", "Me gusta mucho la música.", "I like the music a lot.", "Flamenco"),
    ("es_01", "cognate", "la universidad", "universidad", "la", "ла у-ни-вер-си-ДАД", "the university", "унивърситетът", "English '-ty' (university, city) is '-dad' in Spanish!", "Златно правило: английското -ty е -dad на испански (university → universidad, city → ciudad) и винаги е женски род (la)!", "Estudio en la universidad.", "I study at the university.", "University_of_Salamanca"),
    ("es_01", "cognate", "la información", "información", "la", "ла ин-фор-ма-СИОН", "the information", "информацията", "English '-tion' becomes '-ción' (always feminine 'la'!).", "Всички думи на -ция в българския (-tion на английски) стават -ción на испански: la información, la nación, la estación!", "Necesito más información.", "I need more information.", "Information"),
    ("es_01", "cognate", "la idea", "idea", "la", "ла и-ДЕ-а", "the idea", "идеята", "Identical to English and Bulgarian.", "Женски род: la idea, una buena idea.", "¡Es una buena idea!", "It is a good idea!", "Light_bulb"),
    ("es_01", "cognate", "el problema", "problema", "el", "ел про-БЛЕ-ма", "the problem", "проблемът", "Greek origin word ending in -ma → masculine ('el problema')!", "Капан: въпреки че завършва на -a, е мъжки род като на български („проблемът“) → el problema!", "No hay ningún problema.", "There is no problem.", "Puzzle"),
    ("es_01", "adjective", "importante", "importante", None, "им-пор-ТАН-те", "important", "важен / важно", "Same form for masculine and feminine (-e ending).", "Прилагателните на -e не се менят по род: es muy importante.", "Es un tema muy importante.", "It is a very important topic.", "Exclamation_mark"),

    # --- PACK 02: Greetings, Courtesy & Survival Basics ---
    ("es_02", "survival_phrase", "¡Hola! ¿Qué tal?", "hola", None, "О-ла! КЕ тал?", "Hello! How's it going?", "Здравей! Как е / как върви?", "The most natural everyday greeting in Spain.", "Най-естественият поздрав в Испания за всяко време на деня.", "¡Hola! ¿Qué tal? —¡Muy bien, gracias!", "Hi! How's it going? —Very well, thanks!", "Handshake"),
    ("es_02", "survival_phrase", "Buenos días", "buenos días", None, "БУЕ-нос ДИ-ас", "Good morning", "Добро утро / Добър ден (до обяд)", "Used from waking up until lunch (~2:00 PM in Spain).", "Използва се до обяд (~14:00 ч.). Буквално: „Добри дни“.", "Buenos días, un café, por favor.", "Good morning, a coffee, please.", "Sunrise"),
    ("es_02", "survival_phrase", "Buenas tardes", "buenas tardes", None, "БУЕ-нас ТАР-дес", "Good afternoon / early evening", "Добър ден / следобед (от 14:00 до мръкване)", "Used from ~2:00 PM until dinner time (~8:30 PM).", "Забележи: días е м.р. (Buenos días), но tardes и noches са ж.р. (Buenas tardes / noches)!", "Buenas tardes, ¿tiene una mesa?", "Good afternoon, do you have a table?", "Sunset"),
    ("es_02", "survival_phrase", "Buenas noches", "buenas noches", None, "БУЕ-нас НО-чес", "Good evening / Good night", "Добър вечер / Лека нощ", "Used both as a greeting at night and when saying goodnight.", "Ползва се и при среща вечер („Добър вечер“), и при лягане („Лека нощ“).", "Buenas noches y hasta mañana.", "Good night and see you tomorrow.", "Night_sky"),
    ("es_02", "survival_phrase", "Por favor", "por favor", None, "пор фа-ВОР", "Please", "Моля (при молба)", "Literally 'as a favor'. Essential in every polite request.", "Слага се в края на всяка поръчка: Un agua, por favor.", "La cuenta, por favor.", "The bill, please.", "Coffee_cup"),
    ("es_02", "survival_phrase", "Muchas gracias", "gracias", None, "МУ-час ГРА-сиас", "Thank you very much", "Много благодаря", "Literally 'many graces'. Reply with 'De nada' (You're welcome).", "Отговорът е „De nada“ (букв. „От нищо“ = За нищо / Моля).", "Muchas gracias por tu ayuda.", "Thank you very much for your help.", "Thank_you"),
    ("es_02", "survival_phrase", "De nada", "de nada", None, "де НА-да", "You're welcome", "За нищо / Моля (в отговор на благодаря)", "Literally 'of nothing' (just like Bulgarian 'за нищо'!).", "1:1 с българското „За нищо!“ (nada = нищо).", "—Muchas gracias. —De nada.", "—Thank you very much. —You're welcome.", "Smile"),
    ("es_02", "survival_phrase", "Disculpe / Perdón", "disculpe", None, "дис-КУЛ-пе / пер-ДОН", "Excuse me / Sorry", "Извинете (за внимание) / Пардон", "Use 'Disculpe' to get a waiter's or stranger's attention; 'Perdón' if you bump into someone.", "Когато искаш да попиташ нещо на улицата или да извикаш сервитьора, започни с „Disculpe…“.", "Disculpe, ¿dónde está el metro?", "Excuse me, where is the metro?", "Madrid_Metro"),
    ("es_02", "survival_phrase", "Hasta luego", "hasta luego", None, "АС-та ЛУЕ-го", "See you later / Goodbye", "До скоро / Довиждане", "More common and friendly in everyday Spain than 'adiós'.", "H в 'hasta' не се чете → АС-та ЛУЕ-го.", "¡Muchas gracias, hasta luego!", "Thank you very much, see you later!", "Wave_(gesture)"),
    ("es_02", "survival_phrase", "No entiendo. ¿Más despacio, por favor?", "no entiendo", None, "но ен-ТИЕН-до. мас дес-ПА-сио, пор фа-ВОР", "I don't understand. Slower, please?", "Не разбирам. По-бавно, моля?", "Your #1 lifesaver when natives speak fast!", "despacio = бавно, más despacio = по-бавно.", "Perdón, no entiendo. ¿Más despacio, por favor?", "Sorry, I don't understand. Slower, please?", "Ear"),
    ("es_02", "survival_phrase", "¡Claro! / Vale", "vale", None, "КЛА-ро! / БА-ле", "Of course! / Okay (in Spain)", "Разбира се! / Окей (важи)", "In Spain, you will hear 'Vale' ('Okay / Agreed') every 30 seconds!", "„Vale“ (чете се БА-ле) е най-испанската дума за „Окей / Разбрахме се“.", "—¿Vamos al café? —¡Vale, claro!", "—Shall we go to the café? —Okay, of course!", "Thumbs_signal"),

    # --- PACK 03: Who I Am (Identity, Origin, Languages) ---
    ("es_03", "survival_phrase", "Me llamo Petar", "llamarse", None, "ме Я-мо Пе-тар", "My name is Petar (lit. I call myself Petar)", "Казвам се Петър", "Reflexive verb 'llamarse' — works exactly like Bulgarian 'Казвам се'!", "1:1 с българския: Me (се) + llamo (казвам) = Казвам се!", "Hola, me llamo Petar. ¿Cómo te llamas?", "Hi, my name is Petar. What's your name?", "Name_tag"),
    ("es_03", "survival_phrase", "¿Cómo te llamas?", "llamarse", None, "КО-мо те Я-мас?", "What is your name?", "Как се казваш?", "Literally 'How do you call yourself?'.", "cómo = как, te = се (за „ти“), llamas = казваш.", "¿Cómo te llamas? —Me llamo Elena.", "What is your name? —My name is Elena.", "Conversation"),
    ("es_03", "survival_phrase", "Soy de Bulgaria", "ser", None, "СОЙ де Бул-ГА-рия", "I am from Bulgaria", "Аз съм от България", "'Soy' = I am (for permanent identity and origin); 'de' = from/of.", "Също като на български не ти трябва „Аз“ (Yo): просто казваш „Soy de Bulgaria“ (Съм от България).", "Soy de Bulgaria y vivo en Sofía.", "I am from Bulgaria and I live in Sofia.", "Sofia"),
    ("es_03", "verb", "yo soy / tú eres / es", "ser", None, "йо СОЙ / ту Е-рес / ЕС", "I am / you are / he-she-it is", "аз съм / ти си / той-тя-то е", "The verb 'ser' (to be) is used for who you are, origin, profession, and permanent traits.", "В испанския глаголът показва лицето (soy = съм, eres = си, es = е), затова yo/tú обикновено се пропускат.", "Él es mi amigo y es de Madrid.", "He is my friend and he is from Madrid.", "Madrid"),
    ("es_03", "survival_phrase", "Vivo en Sofía", "vivir", None, "БИ-бо ен со-ФИ-я", "I live in Sofia", "Живея в София", "From 'vivir' (to live). Note both V's sound like a soft B: БИ-бо!", "vivir = живея; en = в.", "Vivo en Sofía, la capital de Bulgaria.", "I live in Sofia, the capital of Bulgaria.", "Alexander_Nevsky_Cathedral,_Sofia"),
    ("es_03", "survival_phrase", "Hablo inglés y un poco de español", "hablar", None, "А-бло ин-ГЛЕС и ун ПО-ко де ес-па-НЬОЛ", "I speak English and a little Spanish", "Говоря английски и малко испански", "'Hablo' = I speak (silent H!); 'y' = and (pronounced 'и'!); 'un poco de' = a little bit of.", "Забележи: испанското 'y' („и“) се чете точно като българския съюз „и“!", "Hablo inglés y aprendo español.", "I speak English and I am learning Spanish.", "Language"),
    ("es_03", "adjective", "Mucho gusto / Encantado", "encantado", None, "МУ-чо ГУС-то / ен-кан-ТА-до", "Nice to meet you (Pleased / Enchanted)", "Приятно ми е да се запознаем", "Men say 'Encantado', women say 'Encantada'; 'Mucho gusto' works for everyone!", "encantado = очарован съм (мъж казва encantado, жена казва encantada).", "Hola Ana, mucho gusto.", "Hello Ana, nice to meet you.", "Greeting"),

    # --- PACK 04: At the Café & Restaurant ---
    ("es_04", "survival_phrase", "Un café con leche, por favor", "café con leche", None, "ун ка-ФЕ кон ЛЕ-че, пор фа-ВОР", "A coffee with milk, please", "Едно кафе с мляко, моля", "'con' = with, 'la leche' = milk. Opposite: 'sin leche' (without milk).", "Най-поръчваната напитка в Испания сутрин (50% еспресо + 50% горещо мляко).", "Buenos días, quiero un café con leche, por favor.", "Good morning, I want a coffee with milk, please.", "Café_con_leche"),
    ("es_04", "noun", "el agua", "agua", "el", "ел А-гуа", "the water", "водата", "Special rule: 'agua' is feminine (water is cold = el agua fría), but takes 'el' in singular for smooth pronunciation!", "Тънкост: agua започва с ударено 'а', затова взима член 'el' (el agua), за да не се слеят две 'а'-та в la agua!", "Un vaso de agua fría, por favor.", "A glass of cold water, please.", "Drinking_water"),
    ("es_04", "noun", "la cerveza", "cerveza", "la", "ла сер-БЕ-са", "the beer", "бирата", "In Spain, a small draft beer is also called 'una caña'.", "C пред E се чете „С“, V се чете „Б“, Z се чете „С“ → сер-БЕ-са.", "Dos cervezas frías, por favor.", "Two cold beers, please.", "Beer"),
    ("es_04", "noun", "el vino tinto", "vino tinto", "el", "ел БИ-но ТИН-то", "the red wine", "червеното вино", "In Spanish, red wine is 'vino tinto' (tinted/dark wine), not 'vino rojo'!", "Важен капан: за червено вино никога не се казва rojo, а tinto (el vino tinto)! Бяло вино е el vino blanco.", "Para mí, una copa de vino tinto.", "For me, a glass of red wine.", "Red_wine"),
    ("es_04", "noun", "el pan", "pan", "el", "ел ПАН", "the bread", "хлябът", "Short and essential masculine noun.", "Мъжки род: el pan.", "El pan con tomate es delicioso.", "Bread with tomato is delicious.", "Pa_amb_tomàquet"),
    ("es_04", "noun", "el pollo", "pollo", "el", "ел ПО-йо", "the chicken", "пилето / пилешкото", "Remember: double L = Y sound (ПО-йо).", "Двойното LL се чете като „Й“: ел ПО-йо.", "Quiero arroz con pollo.", "I want rice with chicken.", "Roast_chicken"),
    ("es_04", "noun", "la ensalada", "ensalada", "la", "ла ен-са-ЛА-да", "the salad", "салатата", "Cognate with 'salad' / 'салата' (feminine 'la').", "Женски род на -a: la ensalada.", "Una ensalada fresca, por favor.", "A fresh salad, please.", "Salad"),
    ("es_04", "noun", "el desayuno", "desayuno", "el", "ел де-са-Ю-но", "the breakfast", "закуската", "Literally 'breaking the fast'.", "Мъжки род: el desayuno.", "El desayuno está incluido en el hotel.", "Breakfast is included at the hotel.", "Breakfast"),
    ("es_04", "verb", "Quiero... / ¿Qué quieres?", "querer", None, "КИЕ-ро / КЕ КИЕ-рес?", "I want... / What do you want?", "Искам... / Какво искаш?", "Core verb 'querer' (to want): yo quiero, tú quieres, él/ella quiere.", "QU се чете „К“: КИЕ-ро (искам), КИЕ-рес (искаш).", "¿Qué quieres tomar? —Quiero un té.", "What do you want to drink/have? —I want a tea.", "Tea"),
    ("es_04", "survival_phrase", "La cuenta, por favor", "la cuenta", "la", "ла КУЕН-та, пор фа-ВОР", "The bill / check, please", "Сметката, моля", "'la cuenta' = the bill / account (feminine).", "Запомня се веднага: ла КУЕН-та, пор фа-ВОР.", "Disculpe, la cuenta, por favor.", "Excuse me, the bill, please.", "Receipt"),
    ("es_04", "survival_phrase", "¿Puedo pagar con tarjeta?", "pagar con tarjeta", None, "ПУЕ-до па-ГАР кон тар-ХЕ-та?", "Can I pay by card?", "Мога ли да платя с карта?", "'puedo' = can I, 'pagar' = to pay, 'la tarjeta' = the card (J = Х!).", "В 'tarjeta' буквата J се чете „Х“: тар-ХЕ-та. В брой е 'en efectivo'.", "¿Puedo pagar con tarjeta o solo en efectivo?", "Can I pay by card or only in cash?", "Payment_card"),

    # --- PACK 05: Everyday Objects, Places & Visual Gender (el vs la) ---
    ("es_05", "noun", "el gato", "gato", "el", "ел ГА-то", "the cat", "котката (котаракът)", "Masculine noun ending in -o ('el gato').", "В испанския el gato е мъжки род (на -o); женска котка е la gata.", "El gato duerme en el sofá.", "The cat sleeps on the sofa.", "Cat"),
    ("es_05", "noun", "el perro", "perro", "el", "ел ПЕ-рро", "the dog", "кучето", "Double RR is rolled strongly just like a Bulgarian 'Р'!", "Двойното RR се произнася силно и ясно като българско „Р“!", "El perro corre en el parque.", "The dog runs in the park.", "Dog"),
    ("es_05", "noun", "la casa", "casa", "la", "ла КА-са", "the house / home", "къщата / домът", "Feminine noun ending in -a ('la casa'). 'En casa' = at home.", "Женски род на -a: la casa. Изразът „вкъщи“ е просто „en casa“.", "Estoy en casa hoy.", "I am at home today.", "House"),
    ("es_05", "noun", "el edificio", "edificio", "el", "ел е-ди-ФИ-сио", "the building", "сградата", "Cognate with English 'edifice' (masculine 'el edificio').", "Завършва на -o → мъжки род: el edificio.", "Es un edificio muy alto y moderno.", "It is a very tall and modern building.", "Casa_Batlló"),
    ("es_05", "noun", "la calle", "calle", "la", "ла КА-йе", "the street", "улицата", "Feminine ('la calle'). Remember LL = Y!", "Въпреки че завършва на -e, улицата е женски род (като на български!): la calle.", "El café está en esta calle.", "The café is on this street.", "Gran_Vía"),
    ("es_05", "noun", "la ciudad", "ciudad", "la", "ла сиу-ДАД", "the city", "градът", "Words ending in -dad are ALWAYS feminine ('la ciudad')!", "Внимание: на български „градът“ е м.р., но на испански всички думи на -dad са женски род → la ciudad!", "Madrid es una ciudad grande y bonita.", "Madrid is a big and beautiful city.", "Plaza_Mayor,_Madrid"),
    ("es_05", "noun", "el libro", "libro", "el", "ел ЛИ-бро", "the book", "книгата", "Root of English 'library'. Masculine ('el libro').", "Завършва на -o → мъжки род: el libro.", "Leo un libro muy interesante.", "I am reading a very interesting book.", "Book"),
    ("es_05", "noun", "la mesa", "mesa", "la", "ла МЕ-са", "the table", "масата", "Almost identical to Bulgarian 'маса' ('la mesa')!", "Супер лесно за българи: la mesa = масата!", "Una mesa para dos personas, por favor.", "A table for two people, please.", "Table_(furniture)"),
    ("es_05", "noun", "la llave", "llave", "la", "ла Я-ве", "the key", "ключът", "Feminine ('la llave'). LL = Y, V = soft B → ла Я-ве.", "Двете правила в една дума: LL = Й, V = Б → ла Я-ве.", "¿Dónde está la llave de la habitación?", "Where is the key to the room?", "Key_(lock)"),
    ("es_05", "noun", "el coche", "coche", "el", "ел КО-че", "the car", "колата", "In Spain 'el coche' is used for car (in Latin America 'el carro' or 'el auto').", "В Испания за кола се казва el coche (м.р.).", "El coche está en la calle.", "The car is on the street.", "Seat_(car)"),
    ("es_05", "noun", "el sol", "sol", "el", "ел СОЛ", "the sun", "слънцето", "Solar -> el sol (masculine). 'Hace sol' = It's sunny.", "Мъжки род: el sol. Изразът за „Слънчево е“ е „Hace sol“.", "Hoy hace mucho sol en España.", "Today it is very sunny in Spain.", "Sun"),
    ("es_05", "noun", "el mar", "mar", "el", "ел МАР", "the sea", "морето", "Marine -> el mar (masculine).", "Мъжки род: el mar. „На морето“ = „en el mar“ / „en la playa“ (на плажа).", "Me gusta nadar en el mar.", "I like swimming in the sea.", "Mediterranean_Sea"),
    *ITEMS_A1_TO_B2,
]


# 4. Curated Grammar & Vocabulary Traps (trap_choice cards)
SEED_TRAPS: list[dict[str, Any]] = [
    {
        "pack_code": "es_01",
        "stage": 0,
        "cefr": "A0",
        "topic": "grammar",
        "content": {
            "situation_en": "You want to say 'No problem!' in Spanish.",
            "prompt": "Which article is correct for 'problema'?",
            "options": [
                "el problema (No hay ningún problema)",
                "la problema (No hay ninguna problema)",
            ],
            "answer": 0,
            "trap_title": "Greek -ma words are Masculine!",
            "explain_en": "Words of Greek origin ending in -ma (el problema, el sistema, el tema, el idioma, el clima) are masculine and take 'el'!",
            "bg_bridge": "Свържи го с българския род: „проблемът“, „климатът“ са от мъжки род → el problema, el clima!",
        },
    },
    {
        "pack_code": "es_03",
        "stage": 1,
        "cefr": "A0",
        "topic": "identity",
        "content": {
            "situation_en": "You want to introduce your origin: 'I am from Bulgaria.'",
            "prompt": "How does a native speaker say this?",
            "options": [
                "Soy de Bulgaria.",
                "Estoy de Bulgaria.",
                "Soy desde Bulgaria.",
            ],
            "answer": 0,
            "trap_title": "Origin is always SER (Soy de...), never ESTAR!",
            "explain_en": "Where you come from is a permanent part of who you are, so Spanish always uses 'Soy de...' (never 'Estoy de...').",
            "bg_bridge": "За произход и националност винаги се ползва Soy (от глагола ser): Soy de Bulgaria. Estoy се ползва за местоположение в момента (Estoy en Madrid = Намирам се в Мадрид).",
        },
    },
    {
        "pack_code": "es_04",
        "stage": 2,
        "cefr": "A0",
        "topic": "cafe",
        "content": {
            "situation_en": "You are at a tapas bar in Madrid and want to order a glass of red wine.",
            "prompt": "How do you say 'red wine' in Spanish?",
            "options": [
                "el vino tinto",
                "el vino rojo",
                "el vino negro",
            ],
            "answer": 0,
            "trap_title": "Red wine is 'vino tinto', never 'vino rojo'!",
            "explain_en": "While the color red is 'rojo', red wine is always called 'vino tinto' (literally 'tinted/dyed wine').",
            "bg_bridge": "Запомни: червена кола е coche rojo, но червено вино винаги е vino tinto!",
        },
    },
    {
        "pack_code": "es_04",
        "stage": 2,
        "cefr": "A0",
        "topic": "cafe",
        "content": {
            "situation_en": "You want to order cold water at a café.",
            "prompt": "Which article is used before 'agua'?",
            "options": [
                "el agua fría",
                "la agua fría",
                "el agua frío",
            ],
            "answer": 0,
            "trap_title": "Why is it 'el agua', not 'la agua'?",
            "explain_en": "To avoid saying two stressed 'a' sounds together ('la a-gua'), Spanish switches 'la' to 'el' directly before 'agua' — even though the word stays feminine ('el agua fría')!",
            "bg_bridge": "За благозвучие пред ударено А се слага 'el' (el agua), но прилагателното след него остава в женски род (fría = студена)!",
        },
    },
    {
        "pack_code": "es_05",
        "stage": 1,
        "cefr": "A0",
        "topic": "city",
        "content": {
            "situation_en": "You want to say 'Madrid is a big city.'",
            "prompt": "Which gender is 'ciudad' (city) and 'universidad' (university)?",
            "options": [
                "Feminine: la ciudad, la universidad",
                "Masculine: el ciudad, el universidad",
            ],
            "answer": 0,
            "trap_title": "All -dad and -ción words are 100% Feminine (la)!",
            "explain_en": "Every single Spanish noun ending in -dad (la ciudad, la universidad, la verdad) or -ción (la estación, la información) is feminine!",
            "bg_bridge": "В българския „градът“ и „университетът“ са в мъжки род, но в испанския всички думи на -dad са винаги в женски род (la ciudad, la universidad)!",
        },
    },
    *EXTRA_TRAPS,
]


# 5. Curated Diglot Weave & Micro-Stories (Stage 2-3)
SEED_DIGLOTS: list[dict[str, Any]] = [
    {
        "pack_code": "es_04",
        "stage": 2,
        "cefr": "A0",
        "topic": "cafe",
        "wiki_title": "Café_con_leche",
        "content": {
            "segments": [
                {"type": "en", "text": "In Spain, people love starting the morning with "},
                {"type": "es", "text": "un café con leche", "en": "a coffee with milk", "phonetic": "ун ка-ФЕ кон ЛЕ-че"},
                {"type": "en", "text": " and fresh "},
                {"type": "es", "text": "pan", "en": "bread", "phonetic": "ПАН"},
                {"type": "en", "text": " before asking the waiter for "},
                {"type": "es", "text": "la cuenta, por favor", "en": "the bill, please", "phonetic": "ла КУЕН-та, пор фа-ВОР"},
                {"type": "en", "text": "."}
            ],
            "question": {
                "prompt": "Which Spanish phrase in the sentence means 'the bill, please'?",
                "options": ["la cuenta, por favor", "un café con leche", "el pan"],
                "answer": 0,
                "explain": "'la cuenta, por favor' = the bill, please."
            }
        }
    },
    {
        "pack_code": "es_05",
        "stage": 2,
        "cefr": "A1",
        "topic": "city",
        "wiki_title": "Plaza_Mayor,_Madrid",
        "content": {
            "segments": [
                {"type": "en", "text": "When you walk down "},
                {"type": "es", "text": "la calle", "en": "the street", "phonetic": "ла КА-йе"},
                {"type": "en", "text": " in the center of "},
                {"type": "es", "text": "la ciudad", "en": "the city", "phonetic": "ла сиу-ДАД"},
                {"type": "en", "text": ", you see historic cafés next to every tall "},
                {"type": "es", "text": "edificio", "en": "building", "phonetic": "е-ди-ФИ-сио"},
                {"type": "en", "text": "."}
            ],
            "question": {
                "prompt": "What does 'el edificio' mean?",
                "options": ["the building", "the street", "the city"],
                "answer": 0,
                "explain": "'el edificio' = the building (la calle = the street, la ciudad = the city)."
            }
        }
    },
]

SEED_STORIES: list[dict[str, Any]] = [
    {
        "pack_code": "es_04",
        "stage": 3,
        "cefr": "A1",
        "topic": "cafe",
        "wiki_title": "Café_Gijón",
        "audio_text": "Buenos días. Me llamo Petar y soy de Bulgaria. Quiero un café con leche y un vaso de agua, por favor.",
        "content": {
            "title_es": "En un café de Madrid",
            "title_en": "At a café in Madrid",
            "text_es": "—Buenos días. Me llamo Petar y soy de Bulgaria. Quiero un café con leche y un vaso de agua, por favor. —¡Claro! Aquí tiene.",
            "translation_en": "—Good morning. My name is Petar and I am from Bulgaria. I want a coffee with milk and a glass of water, please. —Of course! Here you go.",
            "highlights": [
                {
                    "phrase": "Quiero un café con leche",
                    "item": "quiero",
                    "en": "I want a coffee with milk",
                    "why": "'Quiero' (from querer) is the direct way to order in Spanish.",
                    "bg_bridge": "В испанския не казваш 'Yo quiero', а директно 'Quiero' = Искам."
                },
                {
                    "phrase": "un vaso de agua",
                    "item": "el agua",
                    "en": "a glass of water",
                    "why": "'el vaso' = the glass; 'de' = of.",
                    "bg_bridge": "vaso се чете БА-со (чаша за вода)."
                }
            ],
            "tokens": [
                {"w": "—Buenos", "en": "Good (masc. pl.)", "phonetic": "БУЕ-нос"},
                {"w": "días.", "en": "morning / days", "phonetic": "ДИ-ас"},
                {"w": "Me", "en": "myself (се)", "phonetic": "ме"},
                {"w": "llamo", "en": "I call", "lemma": "llamarse", "phonetic": "Я-мо"},
                {"w": "Petar", "en": "Petar"},
                {"w": "y", "en": "and", "phonetic": "и"},
                {"w": "soy", "en": "I am", "lemma": "ser", "phonetic": "СОЙ"},
                {"w": "de", "en": "from / of"},
                {"w": "Bulgaria.", "en": "Bulgaria"},
                {"w": "Quiero", "en": "I want", "lemma": "querer", "phonetic": "КИЕ-ро"},
                {"w": "un", "en": "a / one (masc.)"},
                {"w": "café", "en": "coffee", "lemma": "el café"},
                {"w": "con", "en": "with"},
                {"w": "leche", "en": "milk", "lemma": "la leche", "phonetic": "ЛЕ-че"},
                {"w": "y", "en": "and"},
                {"w": "un", "en": "a"},
                {"w": "vaso", "en": "glass", "lemma": "el vaso", "phonetic": "БА-со"},
                {"w": "de", "en": "of"},
                {"w": "agua,", "en": "water", "lemma": "el agua", "phonetic": "А-гуа"},
                {"w": "por", "en": "for / as"},
                {"w": "favor.", "en": "please"},
                {"w": "—¡Claro!", "en": "Of course!", "phonetic": "КЛА-ро"},
                {"w": "Aquí", "en": "Here", "phonetic": "а-КИ"},
                {"w": "tiene.", "en": "you have / here you go", "lemma": "tener"}
            ],
            "question": {
                "prompt": "What does Petar order alongside his coffee with milk?",
                "options": ["A glass of water", "A glass of red wine", "A salad"],
                "answer": 0,
                "explain": "'un vaso de agua' = a glass of water."
            }
        }
    },
    {
        "pack_code": "es_05",
        "stage": 3,
        "cefr": "A1",
        "topic": "home",
        "wiki_title": "Cat",
        "audio_text": "Mi casa está en una calle tranquila cerca del centro. En la casa tengo muchos libros y un gato blanco.",
        "content": {
            "title_es": "Mi casa y mi gato",
            "title_en": "My house and my cat",
            "text_es": "Mi casa está en una calle tranquila cerca del centro. En la casa tengo muchos libros y un gato blanco. El gato siempre duerme en el sofá.",
            "translation_en": "My house is on a quiet street near the center. In the house I have many books and a white cat. The cat always sleeps on the sofa.",
            "highlights": [
                {
                    "phrase": "está en una calle tranquila",
                    "item": "la calle",
                    "en": "is on a quiet street",
                    "why": "Location always uses 'está' (never 'es'), and adjectives come AFTER the noun ('calle tranquila' = street quiet).",
                    "bg_bridge": "В испанския прилагателното стои СЛЕД съществителното: улица тиха (calle tranquila), котка бяла (gato blanco)."
                },
                {
                    "phrase": "tengo muchos libros",
                    "item": "el libro",
                    "en": "I have many books",
                    "why": "'tengo' = I have (from tener)."
                }
            ],
            "tokens": [
                {"w": "Mi", "en": "My"},
                {"w": "casa", "en": "house", "lemma": "la casa"},
                {"w": "está", "en": "is (located)", "lemma": "estar", "phonetic": "ес-ТА"},
                {"w": "en", "en": "in / on"},
                {"w": "una", "en": "a (fem.)"},
                {"w": "calle", "en": "street", "lemma": "la calle", "phonetic": "КА-йе"},
                {"w": "tranquila", "en": "quiet / calm", "phonetic": "тран-КИ-ла"},
                {"w": "cerca", "en": "near", "phonetic": "СЕР-ка"},
                {"w": "del", "en": "of the (de + el)"},
                {"w": "centro.", "en": "center", "lemma": "el centro"},
                {"w": "En", "en": "In"},
                {"w": "la", "en": "the (fem.)"},
                {"w": "casa", "en": "house"},
                {"w": "tengo", "en": "I have", "lemma": "tener", "phonetic": "ТЕН-го"},
                {"w": "muchos", "en": "many", "phonetic": "МУ-чос"},
                {"w": "libros", "en": "books", "lemma": "el libro"},
                {"w": "y", "en": "and"},
                {"w": "un", "en": "a (masc.)"},
                {"w": "gato", "en": "cat", "lemma": "el gato"},
                {"w": "blanco.", "en": "white", "phonetic": "БЛАН-ко"},
                {"w": "El", "en": "The"},
                {"w": "gato", "en": "cat"},
                {"w": "siempre", "en": "always", "phonetic": "СИЕМ-пре"},
                {"w": "duerme", "en": "sleeps", "lemma": "dormir", "phonetic": "ДУЕР-ме"},
                {"w": "en", "en": "on / in"},
                {"w": "el", "en": "the"},
                {"w": "sofá.", "en": "sofa", "lemma": "el sofá"}
            ],
            "question": {
                "prompt": "What color is the cat in the story?",
                "options": ["White (un gato blanco)", "Black (un gato negro)", "Red (un gato rojo)"],
                "answer": 0,
                "explain": "'un gato blanco' = a white cat (in Spanish the color comes after the noun)."
            }
        }
    },
    *EXTRA_STORIES,
]


def build_seed_items_payload() -> list[dict[str, Any]]:
    """Build database rows for ezik_app_items from SOUND_RULES_DATA and SEED_ITEMS."""
    rows: list[dict[str, Any]] = []
    seq = 1
    for sr in SOUND_RULES_DATA:
        rows.append(
            {
                "target_lang": "es",
                "pack_code": "es_01",
                "seq_order": seq,
                "kind": "sound_rule",
                "text": sr["text"],
                "lemma": sr["lemma"],
                "article": None,
                "phonetic_hint": sr["phonetic_hint"],
                "en_gloss": sr["en_gloss"],
                "bg_gloss": sr["bg_gloss"],
                "en_explain": sr["content"]["rule_summary"],
                "bg_bridge": sr["bg_bridge"],
                "example_text": sr["content"]["examples"][0]["es"],
                "example_en": sr["content"]["examples"][0]["en"],
                "cefr": "A0",
                "frequency_rank": seq,
            }
        )
        seq += 1

    pack_counters: dict[str, int] = {"es_01": seq}
    for (
        pack_code,
        kind,
        text,
        lemma,
        article,
        phonetic_hint,
        en_gloss,
        bg_gloss,
        en_explain,
        bg_bridge,
        example_text,
        example_en,
        _wiki_query,
    ) in SEED_ITEMS:
        idx = pack_counters.get(pack_code, 1)
        pack_counters[pack_code] = idx + 1
        pack_meta = PACK_META_BY_CODE.get(pack_code, {})
        rows.append(
            {
                "target_lang": "es",
                "pack_code": pack_code,
                "seq_order": idx,
                "kind": kind,
                "text": text,
                "lemma": lemma,
                "article": article,
                "phonetic_hint": phonetic_hint,
                "en_gloss": en_gloss,
                "bg_gloss": bg_gloss,
                "en_explain": en_explain,
                "bg_bridge": bg_bridge,
                "example_text": example_text,
                "example_en": example_en,
                "cefr": pack_meta.get("cefr", "A1"),
                "frequency_rank": pack_meta.get("seq_order", 1) * 100 + idx,
            }
        )
    return rows


def wiki_query_for_item_text(text: str) -> str:
    for sr in SOUND_RULES_DATA:
        if sr["text"] == text:
            return sr["wiki_title"]
    for row in SEED_ITEMS:
        if row[2] == text:
            return row[12]
    return text


def build_cards_for_items(
    db_items: list[dict[str, Any]],
    rng: random.Random | None = None,
) -> list[tuple[dict[str, Any], list[tuple[str, str]]]]:
    """
    Deterministically build a comprehensive set of validated interactive cards across all 10 card types
    for the seeded items so the feed has rich, varied cards immediately.
    Returns list of (card_dict, [(item_id, role), ...]).
    """
    r = rng or random.Random(42)
    item_by_text = {it["text"]: it for it in db_items}
    all_nouns_and_cognates = [
        it for it in db_items if it["kind"] in ("noun", "cognate", "adjective", "verb", "connector")
    ]
    all_phrases = [it for it in db_items if it["kind"] == "survival_phrase"]

    cards_out: list[tuple[dict[str, Any], list[tuple[str, str]]]] = []

    # 1. Sound Rule cards (Stage 0)
    for sr in SOUND_RULES_DATA:
        it = item_by_text.get(sr["text"])
        if not it:
            continue
        validated = validate_and_normalize_card("sound_rule", sr["content"], r)
        card = {
            "target_lang": "es",
            "card_type": "sound_rule",
            "stage": 0,
            "pack_code": "es_01",
            "cefr": "A0",
            "topic": "sounds",
            "content": validated,
            "image_url": it.get("image_url"),
            "image_source": it.get("image_source") or "wikimedia",
            "image_license": it.get("image_license") or "CC BY-SA",
            "image_author": it.get("image_author") or "Wikimedia Commons",
            "audio_url": it.get("audio_url"),
            "source_url": "https://en.wikipedia.org/wiki/Spanish_orthography",
            "source_license": "CC BY-SA 4.0",
            "ai_model": "curated-v1",
            "status": "ok",
        }
        cards_out.append((card, [(it["id"], "target")]))

    # 2. 6-Format Spiral for Nouns/Cognates/Verbs/Adjectives:
    #    (1) visual_word -> (2) diglot_weave -> (3) phrase_situation -> (4) audio_blur -> (5) micro_builder -> (6) say_it
    for it in all_nouns_and_cognates:
        pack_meta = PACK_META_BY_CODE.get(it.get("pack_code") or "es_01", {})
        stage_num = pack_meta.get("stage", 1)
        cefr_val = it.get("cefr") or pack_meta.get("cefr", "A1")

        distractors = [
            d["text"]
            for d in all_nouns_and_cognates
            if d["id"] != it["id"] and d["pack_code"] == it["pack_code"]
        ]
        if len(distractors) < 2:
            distractors = [d["text"] for d in all_nouns_and_cognates if d["id"] != it["id"]]
        chosen_distractors = r.sample(distractors, k=min(2, len(distractors)))

        en_gloss_distractors = [
            d["en_gloss"]
            for d in all_nouns_and_cognates
            if d["id"] != it["id"] and d["en_gloss"] != it["en_gloss"]
        ]
        chosen_en_gloss = r.sample(en_gloss_distractors, k=min(2, len(en_gloss_distractors)))

        raw_es = it["text"]
        art = it.get("article")
        noun_part = raw_es[len(art) :].strip() if art and raw_es.startswith(art + " ") else raw_es
        ex_es = it.get("example_text") or raw_es
        ex_en = it.get("example_en") or it["en_gloss"]
        ex_words = ex_es.split()

        tokens = [{"es": w, "en": ""} for w in ex_words]

        # Format 1: visual_word (EN -> ES recognition)
        vw_raw = {
            "item_id": it["id"],
            "es": raw_es,
            "article": art if art in ("el", "la", "los", "las") else None,
            "noun": noun_part,
            "phonetic": it.get("phonetic_hint") or raw_es,
            "en": it["en_gloss"],
            "bg": it["bg_gloss"],
            "cognate_or_memory_tip": it.get("en_explain"),
            "bg_bridge": it.get("bg_bridge"),
            "mini_sentence": {
                "es": ex_es,
                "en": ex_en,
                "tokens": tokens,
            },
            "question": {
                "mode": "en_to_es",
                "prompt": f"How do you say '{it['en_gloss']}' in Spanish?",
                "options": [raw_es, *chosen_distractors],
                "answer": 0,
                "explain": f"'{raw_es}' = {it['en_gloss']} ({it['bg_gloss']}).",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "visual_word",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "vocabulary",
                    "content": validate_and_normalize_card("visual_word", vw_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wiktionary.org/wiki/" + it["lemma"].replace(" ", "_"),
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 2: diglot_weave (English context with embedded Spanish word)
        dw_raw = {
            "segments": [
                {"type": "en", "text": f"In this situation ({ex_en}), the key Spanish word for '{it['en_gloss']}' is "},
                {
                    "type": "es",
                    "text": raw_es,
                    "en": it["en_gloss"],
                    "phonetic": it.get("phonetic_hint") or raw_es,
                    "item_id": it["id"],
                },
                {"type": "en", "text": f" — as in: “{ex_es}”."},
            ],
            "question": {
                "prompt": f"What does '{raw_es}' mean in this bridge sentence?",
                "options": [it["en_gloss"], *chosen_en_gloss],
                "answer": 0,
                "explain": f"'{raw_es}' means '{it['en_gloss']}' ({it['bg_gloss']}).",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "diglot_weave",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "bridge",
                    "content": validate_and_normalize_card("diglot_weave", dw_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wiktionary.org/wiki/" + it["lemma"].replace(" ", "_"),
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 3: phrase_situation (Word in full example sentence context)
        en_sent_distractors = [
            d.get("example_en") or d["en_gloss"]
            for d in all_nouns_and_cognates
            if d["id"] != it["id"] and (d.get("example_en") or d["en_gloss"]) != ex_en
        ]
        en_picks = r.sample(en_sent_distractors, k=min(2, len(en_sent_distractors)))
        ps_word_raw = {
            "situation_en": f"Using '{raw_es}' ({it['en_gloss']}) in a real sentence:",
            "es": ex_es,
            "phonetic": it.get("phonetic_hint") or raw_es,
            "en": ex_en,
            "bg_bridge": it.get("bg_bridge"),
            "tokens": tokens,
            "reply_preview": None,
            "question": {
                "prompt": f"What does '{ex_es}' mean?",
                "options": [ex_en, *en_picks],
                "answer": 0,
                "explain": f"'{ex_es}' = {ex_en} (key word: {raw_es} = {it['en_gloss']}).",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "phrase_situation",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "context",
                    "content": validate_and_normalize_card("phrase_situation", ps_word_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wiktionary.org/wiki/" + it["lemma"].replace(" ", "_"),
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 4: audio_blur (Listening comprehension)
        ab_raw = {
            "context_en": f"Listen carefully ({it['en_gloss']}):",
            "es": ex_es,
            "phonetic": it.get("phonetic_hint") or raw_es,
            "en": ex_en,
            "question": {
                "prompt": "What did you just hear?",
                "options": [ex_en, *en_picks],
                "answer": 0,
                "explain": f"'{ex_es}' means '{ex_en}'.",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "audio_blur",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "listening",
                    "content": validate_and_normalize_card("audio_blur", ab_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wiktionary.org/wiki/" + it["lemma"].replace(" ", "_"),
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 5: micro_builder (Assemble the example sentence from word tiles)
        if len(ex_words) >= 2:
            extra_tiles = ["no", "muy", "ayer"]
            distractor_tile = next((t for t in extra_tiles if t not in ex_words), "no")
            mb_word_raw = {
                "situation_en": f"Practice '{raw_es}' ({it['en_gloss']}) by building the sentence:",
                "prompt_en": ex_en,
                "target_es": ex_es,
                "tiles": [*ex_words, distractor_tile],
                "correct_sequence": ex_words,
                "phonetic": it.get("phonetic_hint") or raw_es,
                "explain": it.get("bg_bridge") or f"'{ex_es}' = {ex_en}.",
            }
            cards_out.append(
                (
                    {
                        "target_lang": "es",
                        "card_type": "micro_builder",
                        "stage": stage_num,
                        "pack_code": it["pack_code"],
                        "cefr": cefr_val,
                        "topic": "builder",
                        "content": validate_and_normalize_card("micro_builder", mb_word_raw, r),
                        "image_url": it.get("image_url"),
                        "image_source": it.get("image_source") or "wikimedia",
                        "image_license": it.get("image_license") or "CC BY-SA",
                        "image_author": it.get("image_author") or "Wikimedia Commons",
                        "audio_url": it.get("audio_url"),
                        "source_url": "https://en.wiktionary.org/wiki/" + it["lemma"].replace(" ", "_"),
                        "source_license": "CC BY-SA 4.0",
                        "ai_model": "curated-v1",
                        "status": "ok",
                    },
                    [(it["id"], "target")],
                )
            )

        # Format 6: say_it (Active spoken production of the word)
        say_word_raw = {
            "situation_en": f"Active Recall — Say '{it['en_gloss']}' ({it['bg_gloss']}) in Spanish:",
            "prompt_en": f"{it['en_gloss']} — Example: “{ex_en}”",
            "hint_en": f"Starts with: {raw_es[:3]}...",
            "target_es": raw_es,
            "alternative_es": ex_es,
            "phonetic": it.get("phonetic_hint") or raw_es,
            "notes": it.get("bg_bridge") or it.get("en_explain"),
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "say_it",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "speaking",
                    "content": validate_and_normalize_card("say_it", say_word_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wiktionary.org/wiki/" + it["lemma"].replace(" ", "_"),
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

    # 3. 6-Format Spiral for Survival & Conversational Phrases:
    #    (1) phrase_situation -> (2) diglot_weave -> (3) audio_blur -> (4) micro_builder -> (5) say_it -> (6) shadowing
    for it in all_phrases:
        pack_meta = PACK_META_BY_CODE.get(it.get("pack_code") or "es_02", {})
        stage_num = pack_meta.get("stage", 1)
        cefr_val = it.get("cefr") or pack_meta.get("cefr", "A1")

        en_distractors = [d["en_gloss"] for d in all_phrases if d["id"] != it["id"]]
        chosen_en = r.sample(en_distractors, k=min(2, len(en_distractors)))
        words = it["text"].split()

        # Format 1: phrase_situation
        ps_raw = {
            "situation_en": it.get("en_explain") or f"When you want to say: '{it['en_gloss']}'",
            "es": it["text"],
            "phonetic": it.get("phonetic_hint") or it["text"],
            "en": it["en_gloss"],
            "bg_bridge": it.get("bg_bridge"),
            "tokens": [{"es": w, "en": ""} for w in words],
            "reply_preview": {
                "waiter_es": it.get("example_text") or it["text"],
                "waiter_en": it.get("example_en") or it["en_gloss"],
            },
            "question": {
                "prompt": f"What does '{it['text']}' mean?",
                "options": [it["en_gloss"], *chosen_en],
                "answer": 0,
                "explain": f"'{it['text']}' = {it['en_gloss']} ({it['bg_gloss']}).",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "phrase_situation",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "situations",
                    "content": validate_and_normalize_card("phrase_situation", ps_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wikivoyage.org/wiki/Spanish_phrasebook",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 2: diglot_weave
        dw_phrase_raw = {
            "segments": [
                {"type": "en", "text": f"When you want to express “{it['en_gloss']}”, a native speaker says: "},
                {
                    "type": "es",
                    "text": it["text"],
                    "en": it["en_gloss"],
                    "phonetic": it.get("phonetic_hint") or it["text"],
                    "item_id": it["id"],
                },
                {"type": "en", "text": "."},
            ],
            "question": {
                "prompt": f"When do you use '{it['text']}'?",
                "options": [it["en_gloss"], *chosen_en],
                "answer": 0,
                "explain": f"'{it['text']}' = {it['en_gloss']} ({it['bg_gloss']}).",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "diglot_weave",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "bridge",
                    "content": validate_and_normalize_card("diglot_weave", dw_phrase_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wikivoyage.org/wiki/Spanish_phrasebook",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 3: audio_blur
        ab_phrase_raw = {
            "context_en": it.get("en_explain") or "Listen and identify the Spanish expression:",
            "es": it["text"],
            "phonetic": it.get("phonetic_hint") or it["text"],
            "en": it["en_gloss"],
            "question": {
                "prompt": "What did the speaker just say?",
                "options": [it["en_gloss"], *chosen_en],
                "answer": 0,
                "explain": f"'{it['text']}' means '{it['en_gloss']}'.",
            },
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "audio_blur",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "listening",
                    "content": validate_and_normalize_card("audio_blur", ab_phrase_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wikivoyage.org/wiki/Spanish_phrasebook",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 4: Micro Builder card if phrase has >= 2 words
        if len(words) >= 2:
            extra_tiles = ["el", "no", "casa"]
            distractor_tile = next((t for t in extra_tiles if t not in words), "el")
            mb_raw = {
                "situation_en": it.get("en_explain") or "Build the Spanish phrase for this situation:",
                "prompt_en": f"{it['en_gloss']} ({it['bg_gloss']})",
                "target_es": it["text"],
                "tiles": [*words, distractor_tile],
                "correct_sequence": words,
                "phonetic": it.get("phonetic_hint") or it["text"],
                "explain": it.get("bg_bridge") or it.get("en_explain") or f"'{it['text']}' = {it['en_gloss']}.",
            }
            cards_out.append(
                (
                    {
                        "target_lang": "es",
                        "card_type": "micro_builder",
                        "stage": stage_num,
                        "pack_code": it["pack_code"],
                        "cefr": cefr_val,
                        "topic": "builder",
                        "content": validate_and_normalize_card("micro_builder", mb_raw, r),
                        "image_url": it.get("image_url"),
                        "image_source": it.get("image_source") or "wikimedia",
                        "image_license": it.get("image_license") or "CC BY-SA",
                        "image_author": it.get("image_author") or "Wikimedia Commons",
                        "audio_url": it.get("audio_url"),
                        "source_url": "https://en.wikivoyage.org/wiki/Spanish_phrasebook",
                        "source_license": "CC BY-SA 4.0",
                        "ai_model": "curated-v1",
                        "status": "ok",
                    },
                    [(it["id"], "target")],
                )
            )

        # Format 5: Say It (Active speaking recall) card
        say_raw = {
            "situation_en": it.get("en_explain") or "Say this out loud in Spanish:",
            "prompt_en": it["en_gloss"],
            "hint_en": f"Starts with: {words[0]}...",
            "target_es": it["text"],
            "alternative_es": it.get("example_text"),
            "phonetic": it.get("phonetic_hint") or it["text"],
            "notes": it.get("bg_bridge") or it.get("en_explain"),
        }
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "say_it",
                    "stage": stage_num,
                    "pack_code": it["pack_code"],
                    "cefr": cefr_val,
                    "topic": "speaking",
                    "content": validate_and_normalize_card("say_it", say_raw, r),
                    "image_url": it.get("image_url"),
                    "image_source": it.get("image_source") or "wikimedia",
                    "image_license": it.get("image_license") or "CC BY-SA",
                    "image_author": it.get("image_author") or "Wikimedia Commons",
                    "audio_url": it.get("audio_url"),
                    "source_url": "https://en.wikivoyage.org/wiki/Spanish_phrasebook",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [(it["id"], "target")],
            )
        )

        # Format 6: Shadowing (Voice Echo) card
        clean_words = [re.sub(r"[^\wáéíóúñüÁÉÍÓÚÑÜ]", "", w).lower() for w in words]
        clean_words = [w for w in clean_words if w]
        if clean_words:
            sh_raw = {
                "es": it["text"],
                "phonetic": it.get("phonetic_hint") or it["text"],
                "en": it["en_gloss"],
                "target_words": clean_words,
            }
            cards_out.append(
                (
                    {
                        "target_lang": "es",
                        "card_type": "shadowing",
                        "stage": stage_num,
                        "pack_code": it["pack_code"],
                        "cefr": cefr_val,
                        "topic": "pronunciation",
                        "content": validate_and_normalize_card("shadowing", sh_raw, r),
                        "image_url": it.get("image_url"),
                        "image_source": it.get("image_source") or "wikimedia",
                        "image_license": it.get("image_license") or "CC BY-SA",
                        "image_author": it.get("image_author") or "Wikimedia Commons",
                        "audio_url": it.get("audio_url"),
                        "source_url": "https://en.wikivoyage.org/wiki/Spanish_phrasebook",
                        "source_license": "CC BY-SA 4.0",
                        "ai_model": "curated-v1",
                        "status": "ok",
                    },
                    [(it["id"], "target")],
                )
            )

    # 4. Trap Choice cards
    for trap in SEED_TRAPS:
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "trap_choice",
                    "stage": trap["stage"],
                    "pack_code": trap["pack_code"],
                    "cefr": trap["cefr"],
                    "topic": trap["topic"],
                    "content": validate_and_normalize_card("trap_choice", trap["content"], r),
                    "source_url": "https://en.wikipedia.org/wiki/Spanish_grammar",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [],
            )
        )

    # 5. Diglot Weave cards
    for dg in SEED_DIGLOTS:
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "diglot_weave",
                    "stage": dg["stage"],
                    "pack_code": dg["pack_code"],
                    "cefr": dg["cefr"],
                    "topic": dg["topic"],
                    "content": validate_and_normalize_card("diglot_weave", dg["content"], r),
                    "source_url": "https://en.wikipedia.org/wiki/Spanish_language",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [],
            )
        )

    # 6. Story X-Ray cards
    for st in SEED_STORIES:
        cards_out.append(
            (
                {
                    "target_lang": "es",
                    "card_type": "story_xray",
                    "stage": st["stage"],
                    "pack_code": st["pack_code"],
                    "cefr": st["cefr"],
                    "topic": st["topic"],
                    "content": validate_and_normalize_card("story_xray", st["content"], r),
                    "source_url": "https://en.wikivoyage.org/wiki/Spain",
                    "source_license": "CC BY-SA 4.0",
                    "ai_model": "curated-v1",
                    "status": "ok",
                },
                [],
            )
        )

    return cards_out


def generate_pack_items_with_claude(
    claude: ClaudeClient,
    pack: dict[str, Any],
    count: int = 20,
) -> list[dict[str, Any]]:
    """Use Claude Haiku 5.5 to generate additional vocabulary/phrases for any pack."""
    prompt = f"""Generate {count} essential Spanish learning items for a beginner starting from zero.
Pack code: {pack['code']}
Pack title: {pack['title_en']} ({pack['title_bg']})
Pack description: {pack['description_en']}
CEFR Level: {pack['cefr']}

Return a JSON array of objects, each with these exact keys:
- "kind": one of "noun", "verb", "adjective", "survival_phrase", "cognate", "connector"
- "text": Spanish word (include 'el ' or 'la ' if it's a noun!) or survival phrase
- "lemma": dictionary base form
- "article": "el" or "la" if noun, otherwise null
- "phonetic_hint": Bulgarian Cyrillic phonetic transcription with stressed syllable in CAPS (e.g. "ун ка-ФЕ кон ЛЕ-че", remember ll=й, ñ=нь, j=х, v=б, h=silent)
- "en_gloss": concise English translation
- "bg_gloss": concise Bulgarian translation (pure Cyrillic, no Latin twin letters!)
- "en_explain": 1 short sentence explaining cognates or usage in English
- "bg_bridge": 1 short sentence in Bulgarian showing why this is easy or notable for a Bulgarian speaker
- "example_text": 4-7 word simple Spanish example sentence (use ¿ and ¡ if question/exclamation)
- "example_en": English translation of example_text
- "wiki_query": 1-2 English words for searching a clear photo of this item on Wikipedia/Pixabay
"""
    raw_list = claude.generate_json(prompt, model=HAIKU_MODEL, max_tokens=3500)
    rows: list[dict[str, Any]] = []
    for idx, item in enumerate(raw_list, start=1):
        art = item.get("article")
        if art not in ("el", "la", "los", "las"):
            art = None
        rows.append(
            {
                "target_lang": "es",
                "pack_code": pack["code"],
                "seq_order": 100 + idx,
                "kind": item.get("kind", "noun"),
                "text": item["text"].strip(),
                "lemma": item.get("lemma", item["text"]).strip(),
                "article": art,
                "phonetic_hint": item.get("phonetic_hint", ""),
                "en_gloss": item["en_gloss"].strip(),
                "bg_gloss": item["bg_gloss"].strip(),
                "en_explain": item.get("en_explain", ""),
                "bg_bridge": item.get("bg_bridge", ""),
                "example_text": item.get("example_text", ""),
                "example_en": item.get("example_en", ""),
                "cefr": pack["cefr"],
                "frequency_rank": pack["seq_order"] * 100 + idx,
            }
        )
    return rows
