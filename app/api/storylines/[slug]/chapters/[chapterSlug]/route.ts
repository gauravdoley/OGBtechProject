import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  context: {
    params: Promise<{ slug: string; chapterSlug: string }>;
  }
) {
  const supabase = await createSupabaseServerClient();

  // ✅ MUST await params
  const { slug, chapterSlug } = await context.params;

  // 1️⃣ Validate storyline
  const { data: storyline } = await supabase
    .from("storylines")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!storyline) {
    return NextResponse.json(
      { error: "Storyline not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Fetch chapter
  const { data: chapter, error } = await supabase
    .from("chapters")
    .select(
      "id, title, chapter_number, slug, content, reading_time_minutes, points_reward"
    )
    .eq("slug", chapterSlug)
    .eq("storyline_id", storyline.id)
    .single();

  if (error || !chapter) {
    return NextResponse.json(
      { error: "Chapter not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(chapter);
}
