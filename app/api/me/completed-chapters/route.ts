import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type CompletedChapter = {
  chapter_id: string;
  completed_at: string;
};

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

  /* 2️⃣ Fetch completed chapters */
  const { data, error } = await supabase
    .from("chapter_completions")
    .select("chapter_id, created_at")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const completedChapters: CompletedChapter[] = (data ?? []).map(
    (row) => ({
      chapter_id: row.chapter_id,
      completed_at: row.created_at,
    })
  );

  return NextResponse.json({
    completed_chapters: completedChapters,
  });
}
