"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type DeleteBusyBlockButtonProps = {
  busyBlockId: string;
};

export default function DeleteBusyBlockButton({
  busyBlockId,
}: DeleteBusyBlockButtonProps) {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function deleteBusyBlock() {
    const confirmed =
      window.confirm(
        "Delete this busy time?",
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setIsDeleting(true);

    const { error } =
      await supabase
        .from("busy_blocks")
        .delete()
        .eq(
          "id",
          busyBlockId,
        );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsDeleting(false);

      return;
    }

    router.refresh();
  }

  return (
    <div className="shrink-0">

      <button
        type="button"
        onClick={deleteBusyBlock}
        disabled={isDeleting}
        className="rounded-xl border border-[#e9a6b8]/30 bg-white/70 px-4 py-2 text-sm font-semibold text-[#b9687d] transition hover:bg-[#fff7f9] hover:text-[#945064] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting
          ? "Deleting..."
          : "Delete"}
      </button>

      {errorMessage && (
        <p className="mt-2 text-xs text-red-600">
          {errorMessage}
        </p>
      )}

    </div>
  );
}