"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type RemoveGroupMemberButtonProps = {
  groupId: string;
  userId: string;
  displayName: string;
};

export default function RemoveGroupMemberButton({
  groupId,
  userId,
  displayName,
}: RemoveGroupMemberButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isRemoving, setIsRemoving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleRemove() {
    const confirmed =
      window.confirm(
        `Remove ${displayName} from this group?`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setIsRemoving(true);

    const { error } =
      await supabase.rpc(
        "remove_group_member",
        {
          target_group_id:
            groupId,

          target_user_id:
            userId,
        },
      );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsRemoving(false);

      return;
    }

    setIsRemoving(false);

    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#b9687d] transition hover:bg-[#fff7f9] hover:text-[#945064] disabled:opacity-50"
      >
        {isRemoving
          ? "Removing..."
          : "Remove"}
      </button>

      {errorMessage && (
        <p className="mt-1 max-w-48 text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}