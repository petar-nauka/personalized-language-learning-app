import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supaFetch } from "@/lib/db";
import { computeNextItemState, type ItemStateRow } from "@/lib/fsrs";
import { Rating } from "ts-fsrs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as "know" | "reset" | "review_now";

    const existingRows = await supaFetch<ItemStateRow[]>("ezik_app_item_state", {
      params: {
        user_id: `eq.${user.id}`,
        item_id: `eq.${id}`,
        limit: "1",
      },
    });
    const existing = existingRows[0] || null;

    let nextState: ItemStateRow;
    if (action === "know") {
      nextState = computeNextItemState(user.id, id, existing, Rating.Easy, true);
    } else {
      // reset or review_now -> mark due immediately and not mastered
      nextState = computeNextItemState(user.id, id, existing, Rating.Again, false);
      nextState.mastered = false;
      nextState.due = new Date().toISOString();
    }

    const upserted = await supaFetch<ItemStateRow[]>("ezik_app_item_state", {
      method: "POST",
      params: { on_conflict: "user_id,item_id" },
      prefer: "resolution=merge-duplicates,return=representation",
      body: nextState,
    });

    return NextResponse.json({ ok: true, itemState: upserted[0] || nextState });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update item" },
      { status: 500 }
    );
  }
}
