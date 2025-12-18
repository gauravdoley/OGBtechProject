import { SupabaseClient } from "@supabase/supabase-js";

export async function unlockNextStorylineIfCompleted({
  supabase,
  userId,
  storylineId,
}: {
  supabase: SupabaseClient;
  userId: string;
  storylineId: string;
}) {
  /* 1️⃣ Total chapters in this storyline */
  const { count: totalChapters } = await supabase
    .from("chapters")
    .select("id", { count: "exact", head: true })
    .eq("storyline_id", storylineId);

  /* 2️⃣ Completed chapters by user */
  const { count: completedChapters } = await supabase
    .from("chapter_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("storyline_id", storylineId);

  if (!totalChapters || !completedChapters) return;
  if (completedChapters < totalChapters) return;

  /* 3️⃣ Get current storyline order */
  const { data: current } = await supabase
    .from("storylines")
    .select("display_order")
    .eq("id", storylineId)
    .single();

  if (!current) return;

  /* 4️⃣ Get next storyline */
  const { data: nextStoryline } = await supabase
    .from("storylines")
    .select("id")
    .eq("display_order", current.display_order + 1)
    .single();

  if (!nextStoryline) return;

  /* 5️⃣ Unlock next storyline (if not already unlocked) */
  await supabase
    .from("user_progress")
    .insert({
      user_id: userId,
      storyline_id: nextStoryline.id,
      chapters_completed: 0,
    })
    .select()
    .maybeSingle();
}
