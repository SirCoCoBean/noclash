"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  localInputToUtcIso,
} from "@/lib/timezone";

type AddBusyBlockFormProps = {
  userId: string;
  timezone: string;
};

export default function AddBusyBlockForm({
  userId,
  timezone,
}: AddBusyBlockFormProps) {
  const router =
    useRouter();

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
      await supabase
        .from("busy_blocks")
        .insert({
          user_id:
            userId,

          starts_at:
            startsAtIso,

          ends_at:
            endsAtIso,
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
    <section className="sakura-card relative overflow-hidden p-6 sm:p-7">

      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#e6ebdf]/50 blur-3xl" />

      <div className="relative">

        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718067]">
          Availability
        </p>

        <h2 className="sakura-title mt-2 text-2xl font-semibold">
          Add busy time
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#74676d]">
          Mark a time when you&apos;re unavailable.
          Times are interpreted using{" "}
          <span className="font-semibold">
            {timezone}
          </span>
          .
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
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
              required
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
              required
              value={endsAt}
              onChange={(event) =>
                setEndsAt(
                  event.target.value,
                )
              }
              className="sakura-input mt-2 px-4 py-3"
            />

          </div>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 md:col-span-2">
              {errorMessage}
            </p>
          )}

          <div className="md:col-span-2">

            <button
              type="submit"
              disabled={isSaving}
              className="sakura-button w-full px-5 py-3 sm:w-auto disabled:opacity-50"
            >
              {isSaving
                ? "Adding..."
                : "Add Busy Time"}
            </button>

          </div>

        </form>

      </div>

    </section>
  );
}