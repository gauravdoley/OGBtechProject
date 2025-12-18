import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { chapterId } = await req.json();
  const supabase = await createSupabaseServerClient();

  await supabase.from("chapter_completions").insert({
    user_id: userId,
    chapter_id: chapterId,
  });

  return NextResponse.json({ success: true });
}
