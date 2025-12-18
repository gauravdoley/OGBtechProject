import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("🔥 /api/me/storylines HIT");

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();

  /* 1️⃣ Fetch all storylines */
  const { data: storylines } = await supabase
    .from("storylines")
    .select("id, slug, title, display_order")
    .order("display_order", { ascending: true });

  if (!storylines || storylines.length === 0) {
    return NextResponse.json({ storylines: [] });
  }

  /* 2️⃣ Fetch user progress */
  const { data: progress } = await supabase
    .from("user_progress")
    .select("storyline_id")
    .eq("user_id", userId);

  /* 3️⃣ AUTO‑UNLOCK FIRST STORYLINE */
  if (!progress || progress.length === 0) {
    const firstStoryline = storylines[0];

    const { error } = await supabaseAdmin
      .from("user_progress")
      .insert({
        user_id: userId,
        storyline_id: firstStoryline.id,
        chapters_completed: 0,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      storylines: [firstStoryline],
    });
  }

  /* 4️⃣ Normal unlocked logic */
  const unlockedIds = new Set(
    progress.map((p) => p.storyline_id)
  );

  const unlockedStorylines = storylines.filter((s) =>
    unlockedIds.has(s.id)
  );

  return NextResponse.json({
    storylines: unlockedStorylines,
  });
}
