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
    toLocalInputValue(startsAt),
  );

  const [
    editedEndsAt,
    setEditedEndsAt,
  ] = useState(
    toLocalInputValue(endsAt),
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


  // ======================================================
  // EDIT EVENT
  // ======================================================

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
      new Date(editedStartsAt);

    const endDate =
      new Date(editedEndsAt);

    if (
      Number.isNaN(
        startDate.getTime(),
      ) ||
      Number.isNaN(
        endDate.getTime(),
      )
    ) {
      setErrorMessage(
        "Please enter valid dates and times.",
      );

      return;
    }

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


  // ======================================================
  // DELETE EVENT
  // ======================================================

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


  // ======================================================
  // NORMAL BUTTONS
  // ======================================================

  if (!isEditing) {
    return (
      <div className="mt-4">

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              setIsEditing(true)
            }
            className="text-sm font-semibold text-purple-700 hover:text-purple-900"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={
              isDeleting
            }
            className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
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


  // ======================================================
  // EDIT FORM
  // ======================================================

  return (
    <form
      onSubmit={handleEdit}
      className="mt-4 border-t border-purple-200 pt-4"
    >

      <p className="font-semibold text-gray-900">
        Edit event
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Times shown in{" "}
        {timezone}.
      </p>


      {/* TITLE */}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Event name
        </label>

        <input
          type="text"
          value={
            editedTitle
          }
          onChange={(event) =>
            setEditedTitle(
              event.target.value,
            )
          }
          maxLength={100}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>


      {/* START */}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Start
        </label>

        <input
          type="datetime-local"
          value={
            editedStartsAt
          }
          onChange={(event) =>
            setEditedStartsAt(
              event.target.value,
            )
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>


      {/* END */}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          End
        </label>

        <input
          type="datetime-local"
          value={
            editedEndsAt
          }
          onChange={(event) =>
            setEditedEndsAt(
              event.target.value,
            )
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>


      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}


      <div className="mt-4 flex gap-2">

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
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
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

      </div>

    </form>
  );
}