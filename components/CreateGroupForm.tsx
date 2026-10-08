"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CreateGroupFormProps = {
  userId: string;
};

export default function CreateGroupForm({
  userId,
}: CreateGroupFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = groupName.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter a group name.");
      return;
    }

    setErrorMessage("");
    setIsCreating(true);

    const { error } = await supabase
      .from("groups")
      .insert({
        name: trimmedName,
        created_by: userId,
      });

    if (error) {
      setErrorMessage(error.message);
      setIsCreating(false);
      return;
    }

    setGroupName("");
    setIsCreating(false);

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">
        Create a group
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Create a group for the friends you want to schedule with.
      </p>

      <div className="mt-5 flex gap-3">
        <input
          type="text"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="Weekend Crew"
          maxLength={80}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={isCreating}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Group"}
        </button>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </form>
  );
}