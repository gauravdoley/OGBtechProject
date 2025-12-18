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

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Storylines</h1>

      {storylines.length === 0 && (
        <p className="text-gray-500">
          No storylines unlocked yet.
        </p>
      )}

      <ul className="space-y-4">
        {storylines.map((storyline) => (
          <li
            key={storyline.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <Link href={`/storylines/${storyline.slug}`}>
              <div className="text-xl font-semibold">
                {storyline.title}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
