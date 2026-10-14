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

type ScheduleEventButtonProps = {
  groupId: string;
  slotStart: string | Date;
  slotEnd: string | Date;
  timezone: string;
};

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
    utcToLocalInput(
      slotStart,
      timezone,
    ),
  );

  const [
    endsAt,
    setEndsAt,
  ] = useState(
    utcToLocalInput(
      slotEnd,
      timezone,
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
        "Please enter an event title.",
      );

      return;
    }

    let startsAtIso: string;
    let endsAtIso: string;

    try {
      startsAtIso =
        localInputToUtcIso(
          startsAt,
          timezone,
        );

      endsAtIso =
        localInputToUtcIso(
          endsAt,
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

    const start =
      new Date(
        startsAtIso,
      );

    const end =
      new Date(
        endsAtIso,
      );

    const allowedStart =
      new Date(slotStart);

    const allowedEnd =
      new Date(slotEnd);

    if (
      end.getTime() <=
      start.getTime()
    ) {
      setErrorMessage(
        "End time must be after start time.",
      );

      return;
    }

    if (
      start.getTime() <
        allowedStart.getTime() ||
      end.getTime() >
        allowedEnd.getTime()
    ) {
      setErrorMessage(
        "The event must stay inside this available time window.",
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
    setIsOpen(false);
    setTitle("");

    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() =>
          setIsOpen(true)
        }
        className="sakura-button w-full px-4 py-2.5 sm:w-auto"
      >
        Schedule Event
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-[#b9687d]/10 bg-white/65 p-4"
    >

      <div className="grid gap-4 md:grid-cols-3">

        <div className="md:col-span-3">

          <label className="block text-sm font-semibold text-[#5f5358]">
            Event name
          </label>

          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            placeholder="Dinner"
            className="sakura-input mt-2 px-4 py-3"
          />

        </div>

        <div>

          <label className="block text-sm font-semibold text-[#5f5358]">
            Start
          </label>

          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) =>
              setStartsAt(
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
            value={endsAt}
            onChange={(event) =>
              setEndsAt(
                event.target.value,
              )
            }
            className="sakura-input mt-2 px-4 py-3"
          />

        </div>

        <div className="flex items-end gap-2">

          <button
            type="submit"
            disabled={isSaving}
            className="sakura-button flex-1 px-4 py-3 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : "Create"}
          </button>

          <button
            type="button"
            onClick={() =>
              setIsOpen(false)
            }
            className="sakura-button-secondary px-4 py-3"
          >
            Cancel
          </button>

        </div>

      </div>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <p className="mt-3 text-xs text-[#9a898f]">
        Timezone: {timezone}
      </p>

    </form>
  );
}