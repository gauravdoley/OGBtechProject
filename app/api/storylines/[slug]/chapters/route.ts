import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createSupabaseServerClient();

  // 1. Get storyline ID
  const { data: storyline, error: storylineError } =
    await supabase
      .from("storylines")
      .select("id")
      .eq("slug", params.slug)
      .single();

  if (storylineError || !storyline) {
    return NextResponse.json(
      { error: "Storyline not found" },
      { status: 404 }
    );
  }

  // 2. Get chapters
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select(`
      id,
      chapter_number,
      slug,
      title,
      reading_time_minutes,
      points_reward
    `)
    .eq("storyline_id", storyline.id)
    .order("chapter_number");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(chapters);
}
