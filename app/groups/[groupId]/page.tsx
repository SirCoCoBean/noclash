import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import AddBusyBlockForm from "@/components/AddBusyBlockForm";
import InviteFriendButton from "@/components/InviteFriendButton";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type GroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupPage({
  params,
}: GroupPageProps) {
  await connection();

  const { groupId } = await params;

  const supabase = await createClient();

  // -------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // -------------------------------------------------------
  // GROUP
  // -------------------------------------------------------

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, created_by, created_at")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  // -------------------------------------------------------
  // CURRENT USER PROFILE
  // -------------------------------------------------------

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  const userTimezone =
    currentProfile?.timezone ?? "UTC";

  // -------------------------------------------------------
  // GROUP MEMBERS
  // -------------------------------------------------------

  const { data: members, error: membersError } =
    await supabase
      .from("group_members")
      .select(`
        user_id,
        role,
        joined_at,
        profiles (
          display_name
        )
      `)
      .eq("group_id", groupId)
      .order("joined_at", {
        ascending: true,
      });

  // -------------------------------------------------------
  // CURRENT USER'S BUSY TIMES
  // -------------------------------------------------------

  const {
    data: busyBlocks,
    error: busyBlocksError,
  } = await supabase
    .from("busy_blocks")
    .select("id, starts_at, ends_at")
    .eq("user_id", user.id)
    .order("starts_at", {
      ascending: true,
    });

  const isOwner =
    group.created_by === user.id;

  // Formatter so times display using the user's
  // saved timezone.
  const dateFormatter =
    new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">

        {/* Back button */}

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to dashboard
        </Link>

        {/* Group heading */}

        <div className="mt-6">
          <p className="font-semibold text-blue-600">
            NoClash
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            {group.name}
          </h1>

          <p className="mt-3 text-gray-600">
            Manage your group and see everyone
            you&apos;re scheduling with.
          </p>
        </div>

        {/* ------------------------------------------------ */}
        {/* MEMBERS */}
        {/* ------------------------------------------------ */}

        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">

          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Members
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                People currently in this group.
              </p>
            </div>

            {isOwner && (
              <InviteFriendButton
                groupId={group.id}
              />
            )}
          </div>

          {membersError && (
            <p className="mt-6 text-red-600">
              Could not load group members.
            </p>
          )}

          {!membersError && members && (
            <div className="mt-6 divide-y divide-gray-200">

              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.profiles
                        ?.display_name ??
                        "Unknown user"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {member.role === "owner"
                        ? "Group owner"
                        : "Member"}
                    </p>
                  </div>

                  {member.user_id ===
                    user.id && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      You
                    </span>
                  )}
                </div>
              ))}

            </div>
          )}

        </section>

        {/* ------------------------------------------------ */}
        {/* ADD BUSY TIME */}
        {/* ------------------------------------------------ */}

        <section className="mt-10">

          <AddBusyBlockForm
            userId={user.id}
            timezone={userTimezone}
          />

        </section>

        {/* ------------------------------------------------ */}
        {/* YOUR BUSY TIMES */}
        {/* ------------------------------------------------ */}

        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Your busy times
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            These times will be used when
            NoClash searches for times everyone
            is free.
          </p>

          {busyBlocksError && (
            <p className="mt-6 text-red-600">
              Could not load your busy times.
            </p>
          )}

          {!busyBlocksError &&
            (!busyBlocks ||
              busyBlocks.length === 0) && (
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <p className="font-medium text-gray-900">
                  No busy times yet.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add one using the form above.
                </p>
              </div>
            )}

          {!busyBlocksError &&
            busyBlocks &&
            busyBlocks.length > 0 && (
              <div className="mt-6 divide-y divide-gray-200">

                {busyBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="py-4"
                  >
                    <p className="font-medium text-gray-900">
                      {dateFormatter.format(
                        new Date(
                          block.starts_at,
                        ),
                      )}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      to{" "}
                      {dateFormatter.format(
                        new Date(
                          block.ends_at,
                        ),
                      )}
                    </p>
                  </div>
                ))}

              </div>
            )}

        </section>

      </div>
    </main>
  );
}