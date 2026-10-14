"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type EventActionsProps = {
  eventId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
};

function toLocalInputValue(
  dateString: string,
) {
  const date =
    new Date(dateString);

  const offset =
    date.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

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
    editedStartsAt,
    setEditedStartsAt,
  ] = useState(
    toLocalInputValue(
      startsAt,
    ),
  );

  const [
    editedEndsAt,
    setEditedEndsAt,
  ] = useState(
    toLocalInputValue(
      endsAt,
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

  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    const trimmedTitle =
      editedTitle.trim();

    if (!trimmedTitle) {
      setErrorMessage(
        "Please enter an event name.",
      );

      return;
    }

    const startDate =
      new Date(
        editedStartsAt,
      );

    const endDate =
      new Date(
        editedEndsAt,
      );

    if (
      endDate <= startDate
    ) {
      setErrorMessage(
        "The end time must be after the start time.",
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
            startDate.toISOString(),

          event_ends_at:
            endDate.toISOString(),
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

    router.refresh();
  }

  if (!isEditing) {
    return (
      <div className="mt-4">

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setIsEditing(true)
            }
            className="rounded-xl border border-[#86678a]/20 bg-white/70 px-4 py-2 text-sm font-semibold text-[#725576] transition hover:bg-[#f8f3f9]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl border border-[#e9a6b8]/25 bg-white/70 px-4 py-2 text-sm font-semibold text-[#b9687d] transition hover:bg-[#fff7f9] disabled:opacity-50"
          >
            {isDeleting
              ? "Deleting..."
              : "Delete"}
          </button>

        </div>

        {errorMessage && (
          <p className="mt-2 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

      </div>
    );
  }

  return (
    <form
      onSubmit={handleEdit}
      className="mt-4 rounded-xl border border-[#86678a]/15 bg-white/65 p-4"
    >

      <p className="sakura-title font-semibold">
        Edit event
      </p>

      <p className="mt-1 text-xs text-[#8c7c82]">
        Times shown in {timezone}.
      </p>

      <div className="mt-4">

        <label className="block text-sm font-semibold text-[#5f5358]">
          Event name
        </label>

        <input
          type="text"
          value={editedTitle}
          onChange={(event) =>
            setEditedTitle(
              event.target.value,
            )
          }
          maxLength={100}
          className="sakura-input mt-2 px-3 py-2"
        />

      </div>

      <div className="mt-4">

        <label className="block text-sm font-semibold text-[#5f5358]">
          Start
        </label>

        <input
          type="datetime-local"
          value={editedStartsAt}
          onChange={(event) =>
            setEditedStartsAt(
              event.target.value,
            )
          }
          className="sakura-input mt-2 px-3 py-2"
        />

      </div>

      <div className="mt-4">

        <label className="block text-sm font-semibold text-[#5f5358]">
          End
        </label>

        <input
          type="datetime-local"
          value={editedEndsAt}
          onChange={(event) =>
            setEditedEndsAt(
              event.target.value,
            )
          }
          className="sakura-input mt-2 px-3 py-2"
        />

      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">

        <button
          type="submit"
          disabled={isSaving}
          className="sakura-button px-4 py-2 text-sm disabled:opacity-50"
        >
          {isSaving
            ? "Saving..."
            : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsEditing(false);

            setErrorMessage("");

            setEditedTitle(
              title,
            );

            setEditedStartsAt(
              toLocalInputValue(
                startsAt,
              ),
            );

            setEditedEndsAt(
              toLocalInputValue(
                endsAt,
              ),
            );
          }}
          className="sakura-button-secondary px-4 py-2 text-sm"
        >
          Cancel
        </button>

      </div>

    </form>
  );
}