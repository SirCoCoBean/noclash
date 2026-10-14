"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  localInputToUtcIso,
  utcToLocalInput,
} from "@/lib/timezone";

type EventActionsProps = {
  eventId: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  timezone: string;
};

export default function EventActions({
  eventId,
  title,
  startsAt,
  endsAt,
  timezone,
}: EventActionsProps) {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    editedTitle,
    setEditedTitle,
  ] = useState(title);

  const [
    editedStart,
    setEditedStart,
  ] = useState(
    utcToLocalInput(
      startsAt,
      timezone,
    ),
  );

  const [
    editedEnd,
    setEditedEnd,
  ] = useState(
    utcToLocalInput(
      endsAt,
      timezone,
    ),
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    const trimmedTitle =
      editedTitle.trim();

    if (!trimmedTitle) {
      setErrorMessage(
        "Please enter an event title.",
      );

      return;
    }

    let startsAtIso: string;
    let endsAtIso: string;

    try {
      startsAtIso =
        localInputToUtcIso(
          editedStart,
          timezone,
        );

      endsAtIso =
        localInputToUtcIso(
          editedEnd,
          timezone,
        );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Please enter valid times.",
      );

      return;
    }

    if (
      new Date(
        endsAtIso,
      ).getTime() <=
      new Date(
        startsAtIso,
      ).getTime()
    ) {
      setErrorMessage(
        "End time must be after start time.",
      );

      return;
    }

    setIsSaving(true);

    const { error } =
      await supabase.rpc(
        "update_group_event",
        {
          target_event_id:
            eventId,

          event_title:
            trimmedTitle,

          event_starts_at:
            startsAtIso,

          event_ends_at:
            endsAtIso,
        },
      );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsSaving(false);

      return;
    }

    setIsSaving(false);
    setIsEditing(false);

    router.refresh();
  }

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete "${title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setIsDeleting(true);

    const { error } =
      await supabase.rpc(
        "delete_group_event",
        {
          target_event_id:
            eventId,
        },
      );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsDeleting(false);

      return;
    }

    setIsDeleting(false);

    router.refresh();
  }

  if (!isEditing) {
    return (
      <div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setIsEditing(true)
            }
            className="rounded-xl border border-[#725576]/20 bg-white/70 px-4 py-2 text-sm font-semibold text-[#725576] transition hover:bg-[#f7f1f7]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl border border-[#e9a6b8]/30 bg-white/70 px-4 py-2 text-sm font-semibold text-[#b9687d] transition hover:bg-[#fff7f9] disabled:opacity-50"
          >
            {isDeleting
              ? "Deleting..."
              : "Delete"}
          </button>

        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

      </div>
    );
  }

  return (
    <form
      onSubmit={handleUpdate}
      className="mt-4 rounded-2xl border border-[#725576]/15 bg-white/65 p-4"
    >

      <div className="grid gap-4">

        <div>

          <label className="block text-sm font-semibold text-[#5f5358]">
            Event name
          </label>

          <input
            type="text"
            value={editedTitle}
            maxLength={100}
            onChange={(event) =>
              setEditedTitle(
                event.target.value,
              )
            }
            className="sakura-input mt-2 px-4 py-3"
          />

        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="block text-sm font-semibold text-[#5f5358]">
              Start
            </label>

            <input
              type="datetime-local"
              value={editedStart}
              onChange={(event) =>
                setEditedStart(
                  event.target.value,
                )
              }
              className="sakura-input mt-2 px-4 py-3"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-[#5f5358]">
              End
            </label>

            <input
              type="datetime-local"
              value={editedEnd}
              onChange={(event) =>
                setEditedEnd(
                  event.target.value,
                )
              }
              className="sakura-input mt-2 px-4 py-3"
            />

          </div>

        </div>

        {errorMessage && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">

          <button
            type="submit"
            disabled={isSaving}
            className="sakura-button px-5 py-2.5 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditedTitle(
                title,
              );

              setEditedStart(
                utcToLocalInput(
                  startsAt,
                  timezone,
                ),
              );

              setEditedEnd(
                utcToLocalInput(
                  endsAt,
                  timezone,
                ),
              );

              setErrorMessage("");
              setIsEditing(false);
            }}
            className="sakura-button-secondary px-5 py-2.5"
          >
            Cancel
          </button>

        </div>

      </div>

      <p className="mt-3 text-xs text-[#9a898f]">
        Timezone: {timezone}
      </p>

    </form>
  );
}