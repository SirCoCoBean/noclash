"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type GroupSettingsProps = {
  groupId: string;
  groupName: string;
  isOwner: boolean;
};

export default function GroupSettings({
  groupId,
  groupName,
  isOwner,
}: GroupSettingsProps) {
  const router = useRouter();

  const supabase =
    createClient();

  const [
    newGroupName,
    setNewGroupName,
  ] = useState(groupName);

  const [
    isRenaming,
    setIsRenaming,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    isLeaving,
    setIsLeaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // ======================================================
  // RENAME
  // ======================================================

  async function handleRename(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName =
      newGroupName.trim();

    if (!trimmedName) {
      setErrorMessage(
        "Please enter a group name.",
      );

      return;
    }

    setIsRenaming(true);

    const { error } =
      await supabase.rpc(
        "rename_group",
        {
          target_group_id:
            groupId,

          new_group_name:
            trimmedName,
        },
      );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsRenaming(false);

      return;
    }

    setIsRenaming(false);

    setSuccessMessage(
      "Group name updated.",
    );

    router.refresh();
  }

  // ======================================================
  // DELETE
  // ======================================================

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete "${groupName}" permanently?\n\nThis will remove the group, invitations, memberships, and group events.`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsDeleting(true);

    const { error } =
      await supabase.rpc(
        "delete_group",
        {
          target_group_id:
            groupId,
        },
      );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsDeleting(false);

      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // ======================================================
  // LEAVE
  // ======================================================

  async function handleLeave() {
    const confirmed =
      window.confirm(
        `Leave "${groupName}"?`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsLeaving(true);

    const { error } =
      await supabase.rpc(
        "leave_group",
        {
          target_group_id:
            groupId,
        },
      );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsLeaving(false);

      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="sakura-card relative overflow-hidden p-6 sm:p-7">

      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#f5d2dc]/35 blur-3xl" />

      <div className="relative">

        <p className="sakura-label">
          Settings
        </p>

        <h2 className="sakura-title mt-2 text-2xl font-semibold">
          Group settings
        </h2>

        <p className="mt-2 text-sm text-[#74676d]">
          {isOwner
            ? "Manage your group and its members."
            : "Manage your membership in this group."}
        </p>

        {errorMessage && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mt-5 rounded-xl bg-[#f5f7f2] px-4 py-3 text-sm text-[#718067]">
            {successMessage}
          </p>
        )}

        {/* =============================================== */}
        {/* OWNER SETTINGS */}
        {/* =============================================== */}

        {isOwner ? (
          <>
            <div className="mt-7 rounded-2xl border border-[#b9687d]/10 bg-white/55 p-5">

              <h3 className="sakura-title text-lg font-semibold">
                Rename group
              </h3>

              <p className="mt-1 text-sm text-[#8c7c82]">
                Change the name everyone sees.
              </p>

              <form
                onSubmit={handleRename}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(event) =>
                    setNewGroupName(
                      event.target.value,
                    )
                  }
                  maxLength={80}
                  className="sakura-input flex-1 px-4 py-3"
                />

                <button
                  type="submit"
                  disabled={isRenaming}
                  className="sakura-button shrink-0 px-5 py-3 disabled:opacity-50"
                >
                  {isRenaming
                    ? "Saving..."
                    : "Save Name"}
                </button>
              </form>

            </div>

            {/* DANGER ZONE */}

            <div className="mt-5 rounded-2xl border border-red-200/70 bg-red-50/45 p-5">

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-500">
                Danger zone
              </p>

              <h3 className="sakura-title mt-2 text-lg font-semibold">
                Delete group
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806c72]">
                This permanently removes the group,
                its invitations, memberships, and
                shared events.
              </p>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="mt-4 rounded-xl border border-red-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting
                  ? "Deleting..."
                  : "Delete Group"}
              </button>

            </div>
          </>
        ) : (
          /* ============================================= */
          /* MEMBER SETTINGS */
          /* ============================================= */

          <div className="mt-7 rounded-2xl border border-[#b9687d]/10 bg-white/55 p-5">

            <h3 className="sakura-title text-lg font-semibold">
              Leave group
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#74676d]">
              You&apos;ll lose access to this group&apos;s
              schedule and events. Your personal busy
              times will stay on your account.
            </p>

            <button
              type="button"
              onClick={handleLeave}
              disabled={isLeaving}
              className="mt-4 rounded-xl border border-[#e9a6b8]/35 bg-white/75 px-5 py-2.5 text-sm font-semibold text-[#b9687d] transition hover:bg-[#fff7f9] disabled:opacity-50"
            >
              {isLeaving
                ? "Leaving..."
                : "Leave Group"}
            </button>

          </div>
        )}

      </div>

    </section>
  );
}