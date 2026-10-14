"use client";

import {
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type InviteFriendButtonProps = {
  groupId: string;
};

export default function InviteFriendButton({
  groupId,
}: InviteFriendButtonProps) {
  const supabase =
    createClient();

  const [
    inviteUrl,
    setInviteUrl,
  ] = useState("");

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function createInvite() {
    setErrorMessage("");
    setCopied(false);
    setIsCreating(true);

    const {
      data,
      error,
    } = await supabase.rpc(
      "create_group_invite",
      {
        target_group_id:
          groupId,
      },
    );

    if (
      error ||
      !data
    ) {
      setErrorMessage(
        error?.message ??
          "Could not create invite.",
      );

      setIsCreating(false);

      return;
    }

    const url =
      `${window.location.origin}/join/${data}`;

    setInviteUrl(url);
    setIsCreating(false);
  }

  async function copyInvite() {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(
      inviteUrl,
    );

    setCopied(true);

    window.setTimeout(
      () =>
        setCopied(false),
      2000,
    );
  }

  if (!inviteUrl) {
    return (
      <div>

        <button
          type="button"
          onClick={createInvite}
          disabled={isCreating}
          className="sakura-button px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating
            ? "Creating..."
            : "Invite friends"}
        </button>

        {errorMessage && (
          <p className="mt-2 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

      </div>
    );
  }

  return (
    <div className="w-full max-w-md">

      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9b6575]">
        Invite link
      </p>

      <div className="flex gap-2">

        <input
          type="text"
          readOnly
          value={inviteUrl}
          className="sakura-input min-w-0 flex-1 px-3 py-2 text-xs"
        />

        <button
          type="button"
          onClick={copyInvite}
          className="sakura-button-secondary shrink-0 px-4 py-2 text-sm"
        >
          {copied
            ? "Copied!"
            : "Copy"}
        </button>

      </div>

      <button
        type="button"
        onClick={createInvite}
        className="mt-2 text-xs font-semibold text-[#b9687d] hover:text-[#945064]"
      >
        Generate a new link
      </button>

      {errorMessage && (
        <p className="mt-2 text-xs text-red-600">
          {errorMessage}
        </p>
      )}

    </div>
  );
}