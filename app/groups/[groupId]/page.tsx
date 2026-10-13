import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import AddBusyBlockForm from "@/components/AddBusyBlockForm";
import DeleteBusyBlockButton from "@/components/DeleteBusyBlockButton";
import GroupSchedule from "@/components/GroupSchedule";
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

  // ======================================================
  // AUTHENTICATION
  // ======================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ======================================================
  // GROUP
  // ======================================================

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, created_by, created_at")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  // ======================================================
  // CURRENT USER PROFILE
  // ======================================================

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  const userTimezone =
    currentProfile?.timezone ?? "UTC";

  // ======================================================
  // GROUP MEMBERS
  // ======================================================

  const {
    data: members,
    error: membersError,
  } = await supabase
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

  const memberIds =
    members?.map(
      (member) => member.user_id,
    ) ?? [];

  // ======================================================
  // CURRENT USER BUSY TIMES
  // ======================================================

  const {
    data: personalBusyBlocks,
    error: busyBlocksError,
  } = await supabase
    .from("busy_blocks")
    .select(
      "id, user_id, starts_at, ends_at",
    )
    .eq("user_id", user.id)
    .order("starts_at", {
      ascending: true,
    });

  // ======================================================
  // WHOLE GROUP BUSY TIMES
  // ======================================================

  let groupBusyBlocks: {
    id: string;
    user_id: string;
    starts_at: string;
    ends_at: string;
  }[] = [];

  if (memberIds.length > 0) {
    const {
      data: groupBusyData,
    } = await supabase
      .from("busy_blocks")
      .select(
        "id, user_id, starts_at, ends_at",
      )
      .in("user_id", memberIds)
      .order("starts_at", {
        ascending: true,
      });

    groupBusyBlocks =
      groupBusyData ?? [];
  }

  // ======================================================
  // PREPARE GROUP SCHEDULE DATA
  // ======================================================

  const scheduleMembers =
    members?.map((member) => ({
      userId: member.user_id,

      displayName:
        member.profiles?.display_name ??
        "Unknown user",
    })) ?? [];

  const scheduleBusyBlocks =
    groupBusyBlocks.map((block) => ({
      id: block.id,
      userId: block.user_id,
      startsAt: block.starts_at,
      endsAt: block.ends_at,
    }));

  // ======================================================
  // OTHER VALUES
  // ======================================================

  const isOwner =
    group.created_by === user.id;

  const dateFormatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: userTimezone,
        dateStyle: "medium",
        timeStyle: "short",
      },
    );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}

        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to dashboard
        </Link>

        {/* GROUP HEADER */}

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

        {/* ================================================= */}
        {/* MEMBERS */}
        {/* ================================================= */}

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

                  {member.user_id === user.id && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      You
                    </span>
                  )}

                </div>
              ))}

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* ADD BUSY TIME */}
        {/* ================================================= */}

        <section className="mt-10">
          <AddBusyBlockForm
            userId={user.id}
            timezone={userTimezone}
          />
        </section>

        {/* ================================================= */}
        {/* YOUR BUSY TIMES */}
        {/* ================================================= */}

        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Your busy times
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            These times are used when NoClash
            searches for times everyone is free.
          </p>

          {busyBlocksError && (
            <p className="mt-6 text-red-600">
              Could not load your busy times.
            </p>
          )}

          {!busyBlocksError &&
            (!personalBusyBlocks ||
              personalBusyBlocks.length === 0) && (
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
            personalBusyBlocks &&
            personalBusyBlocks.length > 0 && (
              <div className="mt-6 divide-y divide-gray-200">

                {personalBusyBlocks.map(
                  (block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between gap-6 py-4"
                    >
                      <div>
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

                      <DeleteBusyBlockButton
                        busyBlockId={block.id}
                      />
                    </div>
                  ),
                )}

              </div>
            )}

        </section>

        {/* ================================================= */}
        {/* GROUP SCHEDULE */}
        {/* ================================================= */}

        <section className="mt-10">
          <GroupSchedule
            members={scheduleMembers}
            busyBlocks={scheduleBusyBlocks}
            timezone={userTimezone}
          />
        </section>

      </div>
    </main>
  );
}