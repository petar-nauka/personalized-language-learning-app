import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assembleFeedBatch } from "@/lib/mixer";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || "10")));
  const pack = searchParams.get("pack");

  try {
    const data = await assembleFeedBatch(user.id, limit, pack);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load feed" },
      { status: 500 }
    );
  }
}
