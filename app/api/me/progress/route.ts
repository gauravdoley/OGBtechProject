import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  /* 1️⃣ Auth */
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();

  /* 2️⃣ Fetch user progress */
  const { data: progress } = await supabase
    .from("user_progress")
    .select("storyline_id, total_points, chapters_completed")
    .eq("user_id", userId);

  /* 3️⃣ Fetch completed chapters */
  const { data: completedChapters } = await supabase
    .from("chapter_completions")
    .select("chapter_id")
    .eq("user_id", userId);

  /* 4️⃣ Fetch unlocked storylines */
  const { data: unlockedStorylines } = await supabase
    .from("user_progress")
    .select("storyline_id")
    .eq("user_id", userId)
    .gt("chapters_completed", 0);

  return NextResponse.json({
    total_points: progress?.reduce(
      (sum, p) => sum + (p.total_points ?? 0),
      0
    ) ?? 0,

    chapters_completed: progress?.reduce(
      (sum, p) => sum + (p.chapters_completed ?? 0),
      0
    ) ?? 0,

    completed_chapters: completedChapters?.map(
      c => c.chapter_id
    ) ?? [],

    unlocked_storylines: unlockedStorylines?.map(
      s => s.storyline_id
    ) ?? [],
  });
}
