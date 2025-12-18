import { SupabaseClient } from "@supabase/supabase-js";

type EvaluateBadgesParams = {
  supabase: SupabaseClient;
  userId: string;
  storylineId: string;
};

export async function evaluateBadges({
  supabase,
  userId,
  storylineId,
}: EvaluateBadgesParams) {
  // 1️⃣ Get user stats
  const { data: progress } = await supabase
    .from("user_progress")
    .select("chapters_completed, total_points")
    .eq("user_id", userId)
    .eq("storyline_id", storylineId)
    .single();

  if (!progress) return;

  // 2️⃣ Fetch all badges
  const { data: badges } = await supabase
    .from("badges")
    .select("*");

  for (const badge of badges ?? []) {
    let unlocked = false;

    if (
      badge.condition_type === "chapters" &&
      progress.chapters_completed >= badge.condition_value
    ) {
      unlocked = true;
    }

    if (
      badge.condition_type === "points" &&
      progress.total_points >= badge.condition_value
    ) {
      unlocked = true;
    }

    if (!unlocked) continue;

    // 3️⃣ Insert safely (idempotent)
    await supabase
      .from("user_badges")
      .insert({
        user_id: userId,
        badge_id: badge.id,
      })
      .select()
      .maybeSingle();
  }
}
