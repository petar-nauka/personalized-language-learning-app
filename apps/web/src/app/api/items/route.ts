import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supaFetch } from "@/lib/db";
import { computeWordStrength, type ItemStateRow } from "@/lib/fsrs";
import type { ItemDTO } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pack = searchParams.get("pack");
  const filter = searchParams.get("filter"); // all | learning | due | mastered
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  try {
    const itemParams: Record<string, string> = {
      target_lang: "eq.es",
      order: "pack_code.asc,seq_order.asc",
      limit: "1000",
    };
    if (pack && pack !== "all") {
      itemParams.pack_code = `eq.${pack}`;
    }

    const [items, states] = await Promise.all([
      supaFetch<ItemDTO[]>("ezik_app_items", { params: itemParams }),
      supaFetch<ItemStateRow[]>("ezik_app_item_state", {
        params: { user_id: `eq.${user.id}` },
      }),
    ]);

    const stateByItem = new Map(states.map((s) => [s.item_id, s]));
    const nowMs = Date.now();

    let enriched = items.map((it) => {
      const st = stateByItem.get(it.id);
      return {
        ...it,
        strength: computeWordStrength(st),
        due: st?.due || null,
        mastered: st?.mastered || false,
        seen_count: st?.seen_count || 0,
      };
    });

    if (filter === "learning") {
      enriched = enriched.filter((it) => (it.seen_count || 0) > 0 && !it.mastered);
    } else if (filter === "due") {
      enriched = enriched.filter(
        (it) =>
          (it.seen_count || 0) > 0 &&
          !it.mastered &&
          it.due &&
          new Date(it.due).getTime() <= nowMs
      );
    } else if (filter === "mastered") {
      enriched = enriched.filter((it) => it.mastered || (it.strength || 0) >= 5);
    }

    if (q) {
      enriched = enriched.filter(
        (it) =>
          it.text.toLowerCase().includes(q) ||
          it.en_gloss.toLowerCase().includes(q) ||
          it.bg_gloss.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ items: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load items" },
      { status: 500 }
    );
  }
}
