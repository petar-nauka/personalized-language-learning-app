import { supaFetch } from "./db";
import type {
  CardType,
  FeedCardDTO,
  PackDTO,
  TodayStatsDTO,
  UserSettingsDTO,
} from "./types";
import type { ItemStateRow } from "./fsrs";

const FORMAT_ORDER_RANK: Record<CardType, number> = {
  sound_rule: 1,
  visual_word: 1,
  phrase_situation: 2,
  diglot_weave: 3,
  audio_blur: 4,
  micro_builder: 5,
  say_it: 6,
  shadowing: 7,
  trap_choice: 8,
  story_xray: 9,
};

const AUDIO_REQUIRED_TYPES: Set<CardType> = new Set(["audio_blur", "shadowing"]);

/** Minimum number of multi-format exposures before a word counts as completed in a pack */
export const MIN_EXPOSURES_PER_ITEM = 5;

export async function getOrCreateUserSettings(
  userId: string,
  targetLang: string = "es"
): Promise<UserSettingsDTO> {
  const rows = await supaFetch<UserSettingsDTO[]>("ezik_app_settings", {
    params: {
      user_id: `eq.${userId}`,
      target_lang: `eq.${targetLang}`,
      limit: "1",
    },
  });
  if (rows.length > 0) return rows[0];

  const created = await supaFetch<UserSettingsDTO[]>("ezik_app_settings", {
    method: "POST",
    prefer: "return=representation",
    body: {
      user_id: userId,
      target_lang: targetLang,
      ui_lang: "en",
      current_cefr: "A0",
      current_stage: 0,
      active_pack_code: "es_01",
      daily_minutes_goal: 20,
      daily_new_items_limit: 15,
    },
  });
  return created[0];
}

export async function getTodayStats(
  userId: string,
  targetLang: string = "es"
): Promise<TodayStatsDTO> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const rows = await supaFetch<
    Array<{
      day: string;
      active_seconds: number;
      cards_completed: number;
      new_items_learned: number;
      reviews_completed: number;
      correct_answers: number;
      total_answers: number;
    }>
  >("ezik_app_daily_stats", {
    params: {
      user_id: `eq.${userId}`,
      target_lang: `eq.${targetLang}`,
      order: "day.desc",
      limit: "30",
    },
  });

  const todayRow = rows.find((r) => r.day === todayIso) || {
    day: todayIso,
    active_seconds: 0,
    cards_completed: 0,
    new_items_learned: 0,
    reviews_completed: 0,
    correct_answers: 0,
    total_answers: 0,
  };

  // Calculate consecutive day streak (where active_seconds >= 60 or cards_completed >= 3)
  const activeDays = new Set(
    rows
      .filter((r) => r.active_seconds >= 60 || r.cards_completed >= 3)
      .map((r) => r.day)
  );
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i++) {
    const dStr = cursor.toISOString().slice(0, 10);
    if (activeDays.has(dStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // Count due reviews
  const nowIso = new Date().toISOString();
  const dueRows = await supaFetch<Array<{ item_id: string }>>("ezik_app_item_state", {
    params: {
      user_id: `eq.${userId}`,
      mastered: "eq.false",
      due: `lte.${nowIso}`,
      select: "item_id",
    },
  });

  return {
    ...todayRow,
    streak_days: streak,
    due_reviews_count: dueRows.length,
  };
}

export async function assembleFeedBatch(
  userId: string,
  limit: number = 10,
  overridePack?: string | null,
  excludeCardIds: string[] = [],
  recentWrongItemIds: string[] = []
): Promise<{
  cards: FeedCardDTO[];
  activePack: PackDTO | null;
  stage: number;
  settings: UserSettingsDTO;
  todayStats: TodayStatsDTO;
}> {
  let settings = await getOrCreateUserSettings(userId, "es");

  // 1. Load all packs, items, user's item states, cards, and recent events in parallel
  const [packs, allItems, itemStates, recentEvents, cardsRaw, cardLinks] = await Promise.all([
    supaFetch<PackDTO[]>("ezik_app_packs", {
      params: { target_lang: "eq.es", order: "seq_order.asc" },
    }),
    supaFetch<
      Array<{
        id: string;
        pack_code: string;
        seq_order: number;
        kind: string;
        audio_url: string | null;
        image_url: string | null;
      }>
    >("ezik_app_items", {
      params: {
        target_lang: "eq.es",
        select: "id,pack_code,seq_order,kind,audio_url,image_url",
        order: "pack_code.asc,seq_order.asc",
      },
    }),
    supaFetch<ItemStateRow[]>("ezik_app_item_state", {
      params: { user_id: `eq.${userId}` },
    }),
    supaFetch<Array<{ card_id: string; event_type: string }>>("ezik_app_events", {
      params: {
        user_id: `eq.${userId}`,
        event_type: "in.(complete,answer_correct,know,save)",
        order: "created_at.desc",
        limit: "600",
      },
    }),
    supaFetch<FeedCardDTO[]>("ezik_app_cards", {
      params: {
        target_lang: "eq.es",
        status: "eq.ok",
        order: "pack_code.asc,stage.asc,created_at.asc",
        limit: "1500",
      },
    }),
    supaFetch<Array<{ card_id: string; item_id: string; role: string }>>("ezik_app_card_items", {
      params: { select: "card_id,item_id,role", limit: "3000" },
    }),
  ]);

  const stateByItem = new Map<string, ItemStateRow>();
  for (const st of itemStates) {
    stateByItem.set(st.item_id, st);
  }
  const itemMetaById = new Map(allItems.map((it) => [it.id, it]));

  const targetItemByCard = new Map<string, string>();
  const cardCountByItem = new Map<string, number>();
  for (const link of cardLinks) {
    if (link.role === "target" || !targetItemByCard.has(link.card_id)) {
      targetItemByCard.set(link.card_id, link.item_id);
      cardCountByItem.set(link.item_id, (cardCountByItem.get(link.item_id) || 0) + 1);
    }
  }

  const requiredExposuresFor = (itemId: string, kind?: string): number => {
    if (kind === "sound_rule") return 1;
    const totalCards = cardCountByItem.get(itemId) || 1;
    return Math.min(MIN_EXPOSURES_PER_ITEM, totalCards);
  };

  // 2. Check Auto-Progression: if >= 75% of items in active_pack_code have reached MIN_EXPOSURES_PER_ITEM (5 formats) or mastered, unlock next pack
  let activePackCode = overridePack || settings.active_pack_code || "es_01";
  if (!overridePack) {
    const packItems = allItems.filter((it) => it.pack_code === activePackCode);
    if (packItems.length > 0) {
      const completedInPack = packItems.filter((it) => {
        const st = stateByItem.get(it.id);
        const req = requiredExposuresFor(it.id, it.kind);
        return st && (st.seen_count >= req || st.mastered);
      }).length;
      if (completedInPack / packItems.length >= 0.75) {
        const curPackIdx = packs.findIndex((p) => p.code === activePackCode);
        if (curPackIdx >= 0 && curPackIdx + 1 < packs.length) {
          const nextPack = packs[curPackIdx + 1];
          const nextPackItems = allItems.filter((it) => it.pack_code === nextPack.code);
          if (nextPackItems.length > 0) {
            activePackCode = nextPack.code;
            const patched = await supaFetch<UserSettingsDTO[]>(
              `ezik_app_settings?user_id=eq.${userId}&target_lang=eq.es`,
              {
                method: "PATCH",
                prefer: "return=representation",
                body: {
                  active_pack_code: nextPack.code,
                  current_stage: nextPack.stage,
                  current_cefr: nextPack.cefr,
                },
              }
            );
            if (patched.length > 0) settings = patched[0];
          }
        }
      }
    }
  }

  const activePack = packs.find((p) => p.code === activePackCode) || packs[0] || null;
  const stage = activePack ? activePack.stage : settings.current_stage;

  const excludeSet = new Set(excludeCardIds.filter(Boolean));
  const completedCardIds = new Set(
    recentEvents
      .filter((e) => e.event_type === "complete" || e.event_type === "answer_correct")
      .map((e) => e.card_id)
  );
  const savedCardIds = new Set(
    recentEvents.filter((e) => e.event_type === "save").map((e) => e.card_id)
  );

  // 3. Enrich cards with latest item image/audio & filter out muted/mastered
  const allCards: FeedCardDTO[] = cardsRaw
    .map((c) => {
      const itemId = targetItemByCard.get(c.id) || c.content?.item_id || null;
      const itemMeta = itemId ? itemMetaById.get(itemId) : undefined;
      return {
        ...c,
        image_url: c.image_url || itemMeta?.image_url || null,
        audio_url: c.audio_url || itemMeta?.audio_url || null,
        target_item_id: itemId,
        saved: savedCardIds.has(c.id),
      };
    })
    .filter((c) => {
      if (settings.muted && AUDIO_REQUIRED_TYPES.has(c.card_type)) {
        return false;
      }
      const itemId = c.target_item_id;
      if (itemId && stateByItem.get(itemId)?.mastered) {
        return false;
      }
      return true;
    });

  // 4. Group and sort cards per item by pedagogical format order (Step 1 -> Step 6)
  const cardsByItem = new Map<string, FeedCardDTO[]>();
  const standaloneCards: FeedCardDTO[] = [];

  for (const card of allCards) {
    if (card.target_item_id) {
      const list = cardsByItem.get(card.target_item_id) || [];
      list.push(card);
      cardsByItem.set(card.target_item_id, list);
    } else {
      standaloneCards.push(card);
    }
  }

  for (const [itemId, list] of cardsByItem.entries()) {
    list.sort(
      (a, b) => (FORMAT_ORDER_RANK[a.card_type] ?? 99) - (FORMAT_ORDER_RANK[b.card_type] ?? 99)
    );
    const total = list.length;
    list.forEach((c, idx) => {
      c.item_step = idx + 1;
      c.item_total_steps = total;
    });
    cardsByItem.set(itemId, list);
  }

  // 5. Build the Active Working Set of items for the Multi-Format Spiral
  // We keep 4–5 items active at a time and spiral through all 5–6 of their card formats
  const workingSetItemIds: string[] = [];
  const pushWorkingItem = (itemId: string) => {
    if (!itemId || workingSetItemIds.includes(itemId)) return;
    if (stateByItem.get(itemId)?.mastered) return;
    const itemCards = cardsByItem.get(itemId);
    if (!itemCards || itemCards.length === 0) return;
    workingSetItemIds.push(itemId);
  };

  // 5a. Priority: recently missed items in this session
  for (const wrongId of recentWrongItemIds) {
    pushWorkingItem(wrongId);
  }

  // 5b. Items in the active pack (in sequence order) that haven't finished their 5-format spiral
  const activePackItems = allItems.filter((it) => it.pack_code === activePackCode);
  for (const it of activePackItems) {
    const st = stateByItem.get(it.id);
    const req = requiredExposuresFor(it.id, it.kind);
    if (!st || st.seen_count < req) {
      pushWorkingItem(it.id);
    }
  }

  // 5c. Partially learned items from earlier packs that still have 1 <= seen_count < 5
  for (const it of allItems) {
    if (workingSetItemIds.length >= 6) break;
    const st = stateByItem.get(it.id);
    const req = requiredExposuresFor(it.id, it.kind);
    if (st && st.seen_count >= 1 && st.seen_count < req) {
      pushWorkingItem(it.id);
    }
  }

  // 5d. If active pack has < 4 items (e.g. 3-item pack), include items from the next pack so spacing between repeats is always >= 2 cards
  if (workingSetItemIds.length < 4) {
    const curPackIdx = packs.findIndex((p) => p.code === activePackCode);
    for (let offset = 1; offset <= 3 && workingSetItemIds.length < 5; offset++) {
      const nextPack = packs[curPackIdx + offset];
      if (!nextPack) break;
      for (const it of allItems.filter((x) => x.pack_code === nextPack.code)) {
        pushWorkingItem(it.id);
        if (workingSetItemIds.length >= 5) break;
      }
    }
  }

  // 5e. Fallback if user has completed almost everything
  if (workingSetItemIds.length === 0) {
    for (const it of activePackItems) pushWorkingItem(it.id);
    for (const it of allItems) {
      if (workingSetItemIds.length >= 6) break;
      pushWorkingItem(it.id);
    }
  }

  // 6. Due FSRS review pool (for items that already completed their initial spiral or are due)
  const nowMs = Date.now();
  const dueItemIds = new Set(
    itemStates
      .filter((st) => !st.mastered && st.seen_count >= 1 && new Date(st.due).getTime() <= nowMs)
      .map((st) => st.item_id)
  );
  const reviewPool = allCards.filter(
    (c) =>
      c.target_item_id &&
      dueItemIds.has(c.target_item_id) &&
      !excludeSet.has(c.id) &&
      !completedCardIds.has(c.id)
  );

  const selected: FeedCardDTO[] = [];
  const usedIds = new Set<string>(excludeSet);

  const canFollow = (candidate: FeedCardDTO, relaxItemGap = false): boolean => {
    if (selected.length === 0) return true;
    const prev = selected[selected.length - 1];

    // Never show the exact same target item twice in a row
    if (prev.target_item_id && prev.target_item_id === candidate.target_item_id) {
      return false;
    }

    // Keep at least 2 other cards between two formats of the same word when possible
    if (!relaxItemGap && selected.length >= 2) {
      const prev2 = selected[selected.length - 2];
      if (prev2.target_item_id && prev2.target_item_id === candidate.target_item_id) {
        return false;
      }
    }

    // Avoid two identical card_types in a row after the initial introduction card (step 1)
    if (
      prev.card_type === candidate.card_type &&
      (candidate.item_step ?? 1) > 1 &&
      candidate.card_type !== "sound_rule"
    ) {
      return false;
    }

    return true;
  };

  // Pick the next format card in the 1->6 spiral for a given itemId
  const pickNextFormatForItem = (itemId: string, relaxItemGap = false): FeedCardDTO | null => {
    const itemCards = cardsByItem.get(itemId) || [];
    // Prefer cards not yet completed in previous sessions and not used in this batch
    const uncompleted = itemCards.filter(
      (c) => !usedIds.has(c.id) && !completedCardIds.has(c.id)
    );
    const pool =
      uncompleted.length > 0 ? uncompleted : itemCards.filter((c) => !usedIds.has(c.id));

    for (const candidate of pool) {
      if (canFollow(candidate, relaxItemGap)) {
        usedIds.add(candidate.id);
        return candidate;
      }
    }
    return null;
  };

  const pickFromPool = (pool: FeedCardDTO[], markReview = false): FeedCardDTO | null => {
    const valid = pool.filter((c) => !usedIds.has(c.id) && canFollow(c, false));
    const list =
      valid.length > 0 ? valid : pool.filter((c) => !usedIds.has(c.id) && canFollow(c, true));
    if (list.length === 0) return null;
    const chosen = list[0];
    usedIds.add(chosen.id);
    return { ...chosen, is_review: markReview };
  };

  // 7. Assemble batch by spiraling through Working Set items across their 5–6 formats
  let cursor = 0;
  for (let slot = 0; slot < limit; slot++) {
    let picked: FeedCardDTO | null = null;

    // Slot 2 and 7: FSRS Due Review if available
    if ((slot === 2 || slot === 7) && reviewPool.length > 0) {
      picked = pickFromPool(reviewPool, true);
    }

    // Slot 5 or 9: Standalone pack story / trap card if available in active pack
    if (!picked && (slot === 5 || slot === 9)) {
      const packStandalone = standaloneCards.filter(
        (c) => c.pack_code === activePackCode && !completedCardIds.has(c.id)
      );
      if (packStandalone.length > 0) {
        picked = pickFromPool(packStandalone, false);
      }
    }

    // Main Spiral: cycle round-robin through workingSetItemIds to show each word in its next format
    if (!picked && workingSetItemIds.length > 0) {
      for (let attempt = 0; attempt < workingSetItemIds.length; attempt++) {
        const itemId = workingSetItemIds[(cursor + attempt) % workingSetItemIds.length];
        const candidate = pickNextFormatForItem(itemId, false);
        if (candidate) {
          picked = candidate;
          cursor = (cursor + attempt + 1) % workingSetItemIds.length;
          break;
        }
      }
      // Relax 2-card item gap if working set is small
      if (!picked) {
        for (let attempt = 0; attempt < workingSetItemIds.length; attempt++) {
          const itemId = workingSetItemIds[(cursor + attempt) % workingSetItemIds.length];
          const candidate = pickNextFormatForItem(itemId, true);
          if (candidate) {
            picked = candidate;
            cursor = (cursor + attempt + 1) % workingSetItemIds.length;
            break;
          }
        }
      }
    }

    // Fallback to any remaining uncompleted card in active pack or all cards
    if (!picked) {
      const activeRemaining = allCards.filter(
        (c) => c.pack_code === activePackCode && !completedCardIds.has(c.id)
      );
      picked =
        pickFromPool(activeRemaining, false) ||
        pickFromPool(
          allCards.filter((c) => !completedCardIds.has(c.id)),
          false
        ) ||
        pickFromPool(allCards, false);
    }

    if (picked) {
      selected.push(picked);
    }
  }

  const todayStats = await getTodayStats(userId, "es");
  return {
    cards: selected,
    activePack,
    stage,
    settings,
    todayStats,
  };
}

