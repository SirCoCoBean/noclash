"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ScheduleEventButtonProps = {
  groupId: string;
  slotStart: Date;
  slotEnd: Date;
  timezone: string;
};

function toLocalInputValue(date: Date) {
  const offset =
    date.getTimezoneOffset() * 60 * 1000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

export default function ScheduleEventButton({
  groupId,
  slotStart,
  slotEnd,
  timezone,
}: ScheduleEventButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [startsAt, setStartsAt] =
    useState(
      toLocalInputValue(slotStart),
    );

  const [endsAt, setEndsAt] =
    useState(
      toLocalInputValue(slotEnd),
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      setErrorMessage(
        "Please enter an event name.",
      );

      return;
    }

    const startDate =
      new Date(startsAt);

    const endDate =
      new Date(endsAt);

    if (endDate <= startDate) {
      setErrorMessage(
        "The end time must be after the start time.",
      );

      return;
    }

    if (
      startDate < slotStart ||
      endDate > slotEnd
    ) {
      setErrorMessage(
        "The event must stay inside this available time.",
      );

      return;
    }

    setIsSaving(true);

    const { error } =
      await supabase.rpc(
        "create_group_event",
        {
          target_group_id:
            groupId,

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

    setTitle("");
    setIsSaving(false);
    setIsOpen(false);

    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() =>
          setIsOpen(true)
        }
        className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
      >
        Schedule Event
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 border-t border-green-200 pt-4"
    >
      <p className="text-sm font-semibold text-gray-900">
        Create event
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Times shown in {timezone}.
      </p>

      <div className="mt-4">
        <label
          htmlFor={`title-${slotStart.toISOString()}`}
          className="block text-sm font-medium text-gray-700"
        >
          Event name
        </label>

        <input
          id={`title-${slotStart.toISOString()}`}
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value,
            )
          }
          placeholder="Dinner"
          maxLength={100}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start
          </label>

          <input
            type="datetime-local"
            value={startsAt}
            min={toLocalInputValue(
              slotStart,
            )}
            max={toLocalInputValue(
              slotEnd,
            )}
            onChange={(event) =>
              setStartsAt(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            End
          </label>

          <input
            type="datetime-local"
            value={endsAt}
            min={toLocalInputValue(
              slotStart,
            )}
            max={toLocalInputValue(
              slotEnd,
            )}
            onChange={(event) =>
              setEndsAt(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving
            ? "Creating..."
            : "Create Event"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setErrorMessage("");
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}