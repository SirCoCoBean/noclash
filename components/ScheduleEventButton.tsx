"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type ScheduleEventButtonProps = {
  groupId: string;
  slotStart: Date;
  slotEnd: Date;
  timezone: string;
};

function toLocalInputValue(
  date: Date,
) {
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

export default function ScheduleEventButton({
  groupId,
  slotStart,
  slotEnd,
  timezone,
}: ScheduleEventButtonProps) {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    startsAt,
    setStartsAt,
  ] = useState(
    toLocalInputValue(
      slotStart,
    ),
  );

  const [
    endsAt,
    setEndsAt,
  ] = useState(
    toLocalInputValue(
      slotEnd,
    ),
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

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

    if (
      endDate <= startDate
    ) {
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
        className="sakura-button mt-4 px-4 py-2.5 text-sm"
      >
        Schedule Event
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-xl border border-[#a9b59f]/20 bg-white/65 p-4"
    >

      <p className="sakura-title font-semibold">
        Create event
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
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value,
            )
          }
          placeholder="Dinner"
          maxLength={100}
          className="sakura-input mt-2 px-3 py-2"
        />

      </div>

      <div className="mt-4 grid gap-3">

        <div>

          <label className="block text-sm font-semibold text-[#5f5358]">
            Start
          </label>

          <input
            type="datetime-local"
            value={startsAt}
            min={
              toLocalInputValue(
                slotStart,
              )
            }
            max={
              toLocalInputValue(
                slotEnd,
              )
            }
            onChange={(event) =>
              setStartsAt(
                event.target.value,
              )
            }
            className="sakura-input mt-2 px-3 py-2"
          />

        </div>

        <div>

          <label className="block text-sm font-semibold text-[#5f5358]">
            End
          </label>

          <input
            type="datetime-local"
            value={endsAt}
            min={
              toLocalInputValue(
                slotStart,
              )
            }
            max={
              toLocalInputValue(
                slotEnd,
              )
            }
            onChange={(event) =>
              setEndsAt(
                event.target.value,
              )
            }
            className="sakura-input mt-2 px-3 py-2"
          />

        </div>

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
            ? "Creating..."
            : "Create Event"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setErrorMessage("");
          }}
          className="sakura-button-secondary px-4 py-2 text-sm"
        >
          Cancel
        </button>

      </div>

    </form>
  );
}