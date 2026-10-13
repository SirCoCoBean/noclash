"use client";

import { FormEvent, useState } from "react";
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
  const supabase = createClient();

  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!startsAt || !endsAt) {
      setErrorMessage(
        "Please choose both a start and end time.",
      );
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setErrorMessage("Please enter valid dates and times.");
      return;
    }

    if (endDate <= startDate) {
      setErrorMessage(
        "The end time must be after the start time.",
      );
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("busy_blocks")
      .insert({
        user_id: userId,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
      });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setStartsAt("");
    setEndsAt("");
    setIsSaving(false);

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900">
        Add busy time
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Mark a period when you are unavailable.
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Your timezone: {timezone}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="startsAt"
            className="block text-sm font-medium text-gray-700"
          >
            Start
          </label>

          <input
            id="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(event) =>
              setStartsAt(event.target.value)
            }
            required
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="endsAt"
            className="block text-sm font-medium text-gray-700"
          >
            End
          </label>

          <input
            id="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(event) =>
              setEndsAt(event.target.value)
            }
            required
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Add Busy Time"}
      </button>
    </form>
  );
}