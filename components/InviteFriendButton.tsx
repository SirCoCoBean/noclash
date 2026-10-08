"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type InviteFriendButtonProps = {
  groupId: string;
};

export default function InviteFriendButton({
  groupId,
}: InviteFriendButtonProps) {
  const supabase = createClient();

  const [inviteLink, setInviteLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createInvite() {
    setErrorMessage("");
    setCopied(false);
    setIsCreating(true);

    const { data, error } = await supabase.rpc(
      "create_group_invite",
      {
        target_group_id: groupId,
      }
    );

    if (error) {
      setErrorMessage(error.message);
      setIsCreating(false);
      return;
    }

    const link = `${window.location.origin}/join/${data}`;

    setInviteLink(link);
    setIsCreating(false);
  }

  async function copyInvite() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);

    setCopied(true);
  }

  return (
    <div>
      {!inviteLink ? (
        <button
          type="button"
          onClick={createInvite}
          disabled={isCreating}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Invite Friend"}
        </button>
      ) : (
        <div className="flex max-w-xl flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">
            Share this invite link:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />

            <button
              type="button"
              onClick={copyInvite}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button
            type="button"
            onClick={createInvite}
            disabled={isCreating}
            className="self-start text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Generate a new link
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}