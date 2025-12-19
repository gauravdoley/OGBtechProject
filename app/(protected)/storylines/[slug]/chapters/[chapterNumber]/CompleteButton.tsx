"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CompleteButton({
  chapterId,
  isCompleted,
}: {
  chapterId: string;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  async function markComplete() {
    if (completed || loading) return;

    setLoading(true);

    const res = await fetch("/api/chapters/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId }),
    });

    if (res.ok) {
      setCompleted(true);

      // 🎉 Toast feedback
      toast.success("Chapter completed!");

      // 🔄 Re-fetch server data
      router.refresh();

      // 🔓 Small delay so unlock feels intentional
      setTimeout(() => {
        toast("Next chapter unlocked 🔓", {
          icon: "🚀",
        });
      }, 600);
    } else {
      toast.error("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <button
      onClick={markComplete}
      disabled={completed || loading}
      className={`mt-8 px-6 py-3 rounded-lg font-semibold transition ${
        completed
          ? "bg-green-600 text-white cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {completed
        ? "Completed ✔"
        : loading
        ? "Saving..."
        : "Mark as Complete"}
    </button>
  );
}
