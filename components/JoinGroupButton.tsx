"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type JoinGroupButtonProps = {
  token: string;
};

export default function JoinGroupButton({
  token,
}: JoinGroupButtonProps) {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    isJoining,
    setIsJoining,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleJoin() {
    setErrorMessage("");
    setIsJoining(true);

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "accept_group_invite",
        {
          invite_token:
            token,
        },
      );

    if (
      error ||
      !data
    ) {
      setErrorMessage(
        error?.message ??
          "Could not join this group.",
      );

      setIsJoining(false);

      return;
    }

    router.push(
      `/groups/${data}`,
    );

    router.refresh();
  }

  return (
    <div>

      <button
        type="button"
        onClick={handleJoin}
        disabled={isJoining}
        className="sakura-button w-full px-6 py-3 disabled:opacity-50"
      >
        {isJoining
          ? "Joining..."
          : "Join Group"}
      </button>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

    </div>
  );
}