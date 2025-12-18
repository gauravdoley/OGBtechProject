import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: storyline } = await supabase
    .from("storylines")
    .select("id")
    .eq("slug", params.slug)
    .single();

  if (!storyline) {
    return NextResponse.json({ chapters: [] });
  }

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, slug, title, chapter_number")
    .eq("storyline_id", storyline.id)
    .order("chapter_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ chapters });
}
