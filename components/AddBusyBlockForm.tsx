"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AddBusyBlockFormProps = {
  userId: string;
  timezone: string;
};

export default function AddBusyBlockForm({
  userId,
  timezone,
}: AddBusyBlockFormProps) {
  const router = useRouter();

  const supabase =
    createClient();

  const [
    startsAt,
    setStartsAt,
  ] = useState("");

  const [
    endsAt,
    setEndsAt,
  ] = useState("");

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

    if (
      !startsAt ||
      !endsAt
    ) {
      setErrorMessage(
        "Please choose both a start and end time.",
      );

      return;
    }

    const startDate =
      new Date(startsAt);

    const endDate =
      new Date(endsAt);

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
      await supabase
        .from("busy_blocks")
        .insert({
          user_id:
            userId,

          starts_at:
            startDate.toISOString(),

          ends_at:
            endDate.toISOString(),
        });

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsSaving(false);

      return;
    }

    setStartsAt("");
    setEndsAt("");

    setIsSaving(false);

    router.refresh();
  }

  return (
    <div className="sakura-card relative overflow-hidden p-6 sm:p-7">

      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#f5d2dc]/40 blur-3xl" />

      <div className="relative">

        <div>
          <p className="sakura-label">
            Your availability
          </p>

          <h2 className="sakura-title mt-2 text-2xl font-semibold">
            Add busy time
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#74676d]">
            Tell NoClash when you&apos;re unavailable and
            we&apos;ll keep that time out of shared results.
          </p>

          <p className="mt-1 text-xs text-[#9d8e93]">
            Times are shown in {timezone}.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        >

          <div>
            <label
              htmlFor="busyStart"
              className="block text-sm font-semibold text-[#5f5358]"
            >
              Start
            </label>

            <input
              id="busyStart"
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
            <label
              htmlFor="busyEnd"
              className="block text-sm font-semibold text-[#5f5358]"
            >
              End
            </label>

            <input
              id="busyEnd"
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

          <button
            type="submit"
            disabled={isSaving}
            className="sakura-button min-h-[50px] px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving
              ? "Adding..."
              : "Add Busy Time"}
          </button>

        </form>

        {errorMessage && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

      </div>

    </div>
  );
}