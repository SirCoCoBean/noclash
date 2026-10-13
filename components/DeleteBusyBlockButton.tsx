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
  const router = useRouter();
  const supabase = createClient();

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteBusyBlock() {
    const confirmed = window.confirm(
      "Delete this busy time?",
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setIsDeleting(true);

    const { error } = await supabase
      .from("busy_blocks")
      .delete()
      .eq("id", busyBlockId);

    if (error) {
      setErrorMessage(error.message);
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={deleteBusyBlock}
        disabled={isDeleting}
        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>

      {errorMessage && (
        <p className="mt-1 text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}