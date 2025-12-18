import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { auth } from "@clerk/nextjs/server";
import { unlockNextStorylineIfCompleted } from "@/lib/storylineProgress";


export async function POST(
  req: Request,
  context: {
    params: Promise<{ slug: string; chapterSlug: string }>;
  }
) {
  /* 1️⃣ Next.js 15 params fix */
  const { slug, chapterSlug } = await context.params;

  /* 2️⃣ Clerk auth */
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { choices_made, quiz_score, quiz_total } = await req.json();

  /* 3️⃣ Fetch storyline */
  const { data: storyline } = await supabase
    .from("storylines")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!storyline) {
    return NextResponse.json({ error: "Storyline not found" }, { status: 404 });
  }

  /* 4️⃣ Fetch chapter */
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, points_reward")
    .eq("slug", chapterSlug)
    .eq("storyline_id", storyline.id)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  /* 5️⃣ Prevent duplicate completion */
  const { data: existing } = await supabase
    .from("chapter_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("chapter_id", chapter.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Chapter already completed" },
      { status: 409 }
    );
  }

  /* 6️⃣ Calculate points */
  const pointsEarned = chapter.points_reward + quiz_score * 20;

  /* 7️⃣ Insert chapter completion */
  const { error: completionError } = await supabase
    .from("chapter_completions")
    .insert({
      user_id: userId,
      chapter_id: chapter.id,
      choices_made,
      quiz_score,
      quiz_total,
      points_earned: pointsEarned,
    });

  if (completionError) {
    return NextResponse.json(
      { error: completionError.message },
      { status: 500 }
    );
  }

  /* 8️⃣ Upsert user_progress safely */
  await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: userId,
        storyline_id: storyline.id,
        chapters_completed: 1,
      },
      { onConflict: "user_id,storyline_id" }
    );

  /* 9️⃣ Increment chapters_completed */
  await supabase.rpc("increment_chapters_completed", {
    uid: userId,
    sid: storyline.id,
  });

  /* 🔟 Add points */
  const { error: pointsError } = await supabase.rpc("add_points", {
    uid: userId,
    points: pointsEarned,
  });


  if (pointsError) {
    return NextResponse.json(
      { error: pointsError.message },
      { status: 500 }
    );
  }
  
  await unlockNextStorylineIfCompleted({
  supabase,
  userId,
  storylineId: storyline.id,
});

  return NextResponse.json({
    success: true,
    points_earned: pointsEarned,
  });
}
