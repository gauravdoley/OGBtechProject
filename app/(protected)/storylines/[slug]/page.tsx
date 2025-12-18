import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StorylinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  /* ✅ MUST await params (Next.js 15) */
  const { slug } = await params;

  const { userId } = await auth();
  if (!userId) return notFound();

  const supabase = await createSupabaseServerClient();

  /* 1️⃣ Fetch storyline */
  const { data: storyline, error: storylineError } = await supabase
    .from("storylines")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (storylineError || !storyline) {
    return notFound();
  }

  /* 2️⃣ Fetch chapters (ORDER IS IMPORTANT) */
  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, title, chapter_number")
    .eq("storyline_id", storyline.id)
    .order("chapter_number", { ascending: true });

  if (chaptersError || !chapters) {
    return notFound();
  }

  /* 3️⃣ Fetch completed chapters */
  const { data: completed } = await supabase
    .from("chapter_completions")
    .select("chapter_id")
    .eq("user_id", userId);

  /* 4️⃣ Build completion lookup */
  const completedIds = new Set(
    (completed ?? []).map((c) => c.chapter_id)
  );

  /* 5️⃣ Render */
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        {storyline.title}
      </h1>

      <ul className="space-y-4">
        {chapters.map((chapter, index) => {
          const isCompleted = completedIds.has(chapter.id);
          const isUnlocked =
            index === 0 ||
            completedIds.has(chapters[index - 1].id);

          if (!isUnlocked) {
            return (
              <li
                key={chapter.id}
                className="border rounded-lg p-4 opacity-50"
              >
                🔒 Chapter {chapter.chapter_number}: {chapter.title}
              </li>
            );
          }

          return (
            <Link
              key={chapter.id}
              href={`/storylines/${slug}/chapters/${chapter.chapter_number}`}
            >
              <li className="border rounded-lg p-4 hover:bg-gray-50">
                {isCompleted && "✔ "}
                Chapter {chapter.chapter_number}: {chapter.title}
              </li>
            </Link>
          );
        })}
      </ul>
    </div>
  );
}
