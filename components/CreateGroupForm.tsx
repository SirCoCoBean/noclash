"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type CreateGroupFormProps = {
  userId: string;
};

export default function CreateGroupForm({
  userId,
}: CreateGroupFormProps) {
  const router = useRouter();

  const supabase =
    createClient();

  const [
    groupName,
    setGroupName,
  ] = useState("");

  const [
    isCreating,
    setIsCreating,
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

    const trimmedName =
      groupName.trim();

    if (!trimmedName) {
      setErrorMessage(
        "Please enter a group name.",
      );

      return;
    }

    setIsCreating(true);

    const { error } =
      await supabase
        .from("groups")
        .insert({
          name: trimmedName,
          created_by: userId,
        });

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsCreating(false);

      return;
    }

    setGroupName("");
    setIsCreating(false);

    router.refresh();
  }

  return (
    <div className="sakura-card relative overflow-hidden p-6 sm:p-8">

      {/* Decorative pink glow */}

      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#f5d2dc]/45 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#e6ebdf]/35 blur-3xl" />

      <div className="relative">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fbe8ed] text-xl text-[#b9687d] shadow-sm">
            ✿
          </div>

          <div>
            <p className="sakura-label">
              Start something
            </p>

            <h2 className="sakura-title mt-1 text-2xl font-semibold sm:text-3xl">
              Create a new group
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#74676d]">
              Make a shared space for your friends,
              invite everyone in, and let NoClash find
              the best time to get together.
            </p>
          </div>

        </div>

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-7"
        >
          <label
            htmlFor="groupName"
            className="block text-sm font-semibold text-[#5f5358]"
          >
            Group name
          </label>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">

            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(event) =>
                setGroupName(
                  event.target.value,
                )
              }
              placeholder="Weekend Crew"
              maxLength={80}
              className="sakura-input min-h-[50px] flex-1 px-4 py-3"
            />

            <button
              type="submit"
              disabled={isCreating}
              className="sakura-button min-h-[50px] shrink-0 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating
                ? "Creating..."
                : "Create Group"}
            </button>

          </div>

          {errorMessage && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

        </form>

        {/* ================================================= */}
        {/* SMALL FOOTER */}
        {/* ================================================= */}

        <div className="mt-6 flex flex-wrap gap-4 border-t border-[#b9687d]/10 pt-5">

          <div className="flex items-center gap-2 text-xs text-[#8c7c82]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbe8ed] text-[#b9687d]">
              ✓
            </span>
            Invite friends
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8c7c82]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e6ebdf] text-[#718067]">
              ✓
            </span>
            Compare schedules
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8c7c82]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eee6ef] text-[#725576]">
              ✓
            </span>
            Make plans
          </div>

        </div>

      </div>

    </div>
  );
}