import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition_type: "chapters" | "points";
  condition_value: number;
};

type UserBadgeRow = {
  unlocked_at: string;
  badges: Badge[];
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_badges")
    .select(`
      unlocked_at,
      badges (
        id,
        title,
        description,
        icon,
        condition_type,
        condition_value
      )
    `)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as UserBadgeRow[];

  const badges = rows.flatMap((row) =>
    row.badges.map((badge) => ({
      id: badge.id,
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      condition_type: badge.condition_type,
      condition_value: badge.condition_value,
      unlocked_at: row.unlocked_at,
    }))
  );

  return NextResponse.json({ badges });
}
