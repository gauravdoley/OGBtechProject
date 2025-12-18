import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  {
    params,
  }: { params: { slug: string; chapterSlug: string } }
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chapters")
    .select(`
      id,
      title,
      chapter_number,
      content,
      reading_time_minutes,
      points_reward
    `)
    .eq("slug", params.chapterSlug)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Chapter not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
