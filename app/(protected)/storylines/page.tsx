import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";

/* ✅ Type */
type Storyline = {
  id: string;
  slug: string;
  title: string;
  display_order: number;
};

export default async function StorylinesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();

  /* ✅ Fetch directly from DB (NO headers(), NO internal fetch) */
  const { data: storylines, error } = await supabase
    .from("storylines")
    .select("id, slug, title, display_order")
    .order("display_order", { ascending: true });

  if (error || !storylines) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <p className="text-red-500">Failed to load storylines.</p>
      </div>
    );
  }

/* 2️⃣ Fetch all chapters */
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, storyline_id");

  /* 3️⃣ Fetch completed chapters for user */
  const { data: completed } = await supabase
    .from("chapter_completions")
    .select("chapter_id")
    .eq("user_id", userId);

  const completedIds = new Set(
    (completed ?? []).map((c) => c.chapter_id)
  );

  function getStorylineProgress(storylineId: string) {
  const storylineChapters =
    chapters?.filter((c) => c.storyline_id === storylineId) ?? [];

  if (storylineChapters.length === 0) {
    return { percent: 0, completed: 0, total: 0 };
  }

  const completedCount = storylineChapters.filter((c) =>
    completedIds.has(c.id)
  ).length;

  const percent = Math.round(
    (completedCount / storylineChapters.length) * 100
  );

  return {
    percent,
    completed: completedCount,
    total: storylineChapters.length,
  };
}

  /* 4️⃣ Helper: check if storyline is fully completed */
  function isStorylineCompleted(storylineId: string) {
    const storylineChapters =
      chapters?.filter((c) => c.storyline_id === storylineId) ?? [];

    if (storylineChapters.length === 0) return false;

    return storylineChapters.every((c) =>
      completedIds.has(c.id)
    );
  }

  function isStorylineUnlocked(index: number) {
  return (
    index === 0 ||
    isStorylineCompleted(storylines![index - 1].id)
  );
}


  /* 5️⃣ Unlock logic */
  const unlockedStorylines = storylines.filter(
    (storyline, index) =>
      index === 0 ||
      isStorylineCompleted(storylines[index - 1].id)
  );

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Storylines</h1>

      {unlockedStorylines.length === 0 && (
        <p className="text-gray-500">
          No storylines unlocked yet.
        </p>
      )}

      <ul className="space-y-4">
        {storylines.map((storyline, index) => {
          const unlocked = isStorylineUnlocked(index);
          const progress = getStorylineProgress(storyline.id);
          const isCompleted = progress.percent === 100;

          const content = (
            <>
              {/* Title row */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">
                  {storyline.title}
                </h2>

                {isCompleted && (
                  <span className="text-sm text-green-600 font-medium">
                    ✔ Completed
                  </span>
                )}

                {!unlocked && (
                  <span className="text-sm text-gray-500">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 transition-all ${
                    isCompleted
                      ? "bg-green-600"
                      : unlocked
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Helper text */}
              <p className="text-sm text-gray-600 mt-1">
                {progress.completed}/{progress.total} chapters ·{" "}
                {progress.percent}%
              </p>

              {!unlocked && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  Complete the previous storyline to unlock
                </p>
              )}
            </>
          );

          return (
            <li
              key={storyline.id}
              className={`border rounded-lg p-4 transition ${
                unlocked
                  ? "hover:bg-gray-50"
                  : "opacity-60 blur-[1px]"
              }`}
            >
              {unlocked ? (
                <Link href={`/storylines/${storyline.slug}`}>
                  {content}
                </Link>
              ) : (
                <div>{content}</div>
              )}
            </li>
          );
        })}
      </ul>


    </div>
  );
}
