"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type OnboardingFormProps = {
  userId: string;
  initialDisplayName?: string | null;
};

export default function OnboardingForm({
  userId,
  initialDisplayName,
}: OnboardingFormProps) {
  const router = useRouter();

  const supabase =
    createClient();

  const [
    displayName,
    setDisplayName,
  ] = useState(
    initialDisplayName ?? "",
  );

  const [
    timezone,
    setTimezone,
  ] = useState("");

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    setTimezone(
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone ||
        "UTC",
    );
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    const trimmedName =
      displayName.trim();

    if (!trimmedName) {
      setErrorMessage(
        "Please enter your name.",
      );

      return;
    }

    if (!timezone) {
      setErrorMessage(
        "We could not detect your timezone.",
      );

      return;
    }

    setIsSaving(true);

    const { error } =
      await supabase
        .from("profiles")
        .update({
          display_name:
            trimmedName,

          timezone,
        })
        .eq(
          "id",
          userId,
        );

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsSaving(false);

      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
    >

      <div>

        <label
          htmlFor="displayName"
          className="block text-sm font-semibold text-[#5f5358]"
        >
          What should we call you?
        </label>

        <input
          id="displayName"
          type="text"
          value={displayName}
          maxLength={60}
          onChange={(event) =>
            setDisplayName(
              event.target.value,
            )
          }
          placeholder="Tom"
          className="sakura-input mt-2 px-4 py-3"
        />

      </div>

      <div className="mt-5">

        <p className="text-sm font-semibold text-[#5f5358]">
          Your timezone
        </p>

        <div className="mt-2 rounded-xl border border-[#a9b59f]/25 bg-[#f5f7f2]/70 px-4 py-3">

          <p className="break-words text-sm font-medium text-[#5f6c58]">
            {timezone ||
              "Detecting timezone..."}
          </p>

        </div>

        <p className="mt-2 text-xs leading-5 text-[#8c7c82]">
          NoClash uses this to display schedules at the
          correct local time.
        </p>

      </div>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={
          isSaving ||
          !timezone
        }
        className="sakura-button mt-6 w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving
          ? "Saving..."
          : "Continue to NoClash"}
      </button>

    </form>
  );
}