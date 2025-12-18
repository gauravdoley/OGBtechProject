import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import CompleteButton from "./CompleteButton";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterNumber: string }>;
}) {
  const { slug, chapterNumber } = await params;

  const { userId } = await auth();
  if (!userId) return notFound();

  const supabase = await createSupabaseServerClient();

  /* 1️⃣ Fetch storyline */
  const { data: storyline } = await supabase
    .from("storylines")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (!storyline) notFound();

  /* 2️⃣ Fetch chapter */
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, content, chapter_number")
    .eq("storyline_id", storyline.id)
    .eq("chapter_number", Number(chapterNumber))
    .single();

  if (!chapter) notFound();

  /* 3️⃣ CHECK if chapter already completed ✅ */
  const { data: completion } = await supabase
    .from("chapter_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("chapter_id", chapter.id)
    .single();

  const isCompleted = !!completion;

  /* 4️⃣ Render */
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">
        {chapter.title}
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Chapter {chapter.chapter_number} · {storyline.title}
      </p>

      <div className="space-y-6">
        {chapter.content.sections.map(
          (section: any, index: number) => {
            if (section.type === "text") {
              return (
                <p
                  key={index}
                  className="text-lg leading-relaxed"
                >
                  {section.value}
                </p>
              );
            }

            if (section.type === "heading") {
              return (
                <h2
                  key={index}
                  className="text-2xl font-bold"
                >
                  {section.value}
                </h2>
              );
            }

            return null;
          }
        )}
      </div>

      {/* ✅ FIXED: pass isCompleted */}
      <CompleteButton
        chapterId={chapter.id}
        isCompleted={isCompleted}
      />
    </div>
  );
}
