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
  const router = useRouter();
  const supabase = createClient();

  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function joinGroup() {
    setErrorMessage("");
    setIsJoining(true);

    const { data, error } = await supabase.rpc(
      "accept_group_invite",
      {
        invite_token: token,
      }
    );

    if (error) {
      setErrorMessage(error.message);
      setIsJoining(false);
      return;
    }

    router.push(`/groups/${data}`);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={joinGroup}
        disabled={isJoining}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isJoining ? "Joining..." : "Join Group"}
      </button>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}