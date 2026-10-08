"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OnboardingFormProps = {
  userId: string;
};

export default function OnboardingForm({
  userId,
}: OnboardingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const detectedTimezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    setTimezone(detectedTimezone);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        timezone: timezone,
      })
      .eq("id", userId);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome to NoClash
      </h1>

      <p className="mt-2 text-gray-600">
        Let's finish setting up your profile.
      </p>

      <div className="mt-8">
        <label
          htmlFor="displayName"
          className="block font-medium text-gray-700"
        >
          What should your friends call you?
        </label>

        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          minLength={2}
          maxLength={50}
          placeholder="Tom"
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
        />
      </div>

      <div className="mt-6">
        <label
          htmlFor="timezone"
          className="block font-medium text-gray-700"
        >
          Your timezone
        </label>

        <input
          id="timezone"
          type="text"
          value={timezone}
          readOnly
          className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
        />

        <p className="mt-2 text-sm text-gray-500">
          We detected this automatically from your browser.
        </p>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}