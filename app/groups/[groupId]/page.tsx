import Link from "next/link";
import { connection } from "next/server";
import {
  notFound,
  redirect,
} from "next/navigation";

import AddBusyBlockForm from "@/components/AddBusyBlockForm";
import DeleteBusyBlockButton from "@/components/DeleteBusyBlockButton";
import GroupSchedule from "@/components/GroupSchedule";
import GroupSettings from "@/components/GroupSettings";
import InviteFriendButton from "@/components/InviteFriendButton";
import LogoutButton from "@/components/LogoutButton";
import RemoveGroupMemberButton from "@/components/RemoveGroupMemberButton";

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

  const { groupId } =
    await params;

  const supabase =
    await createClient();

  // ======================================================
  // AUTH
  // ======================================================

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ======================================================
  // GROUP
  // ======================================================

  const { data: group } =
    await supabase
      .from("groups")
      .select(
        "id, name, created_by, created_at",
      )
      .eq(
        "id",
        groupId,
      )
      .single();

  if (!group) {
    notFound();
  }

  // ======================================================
  // PROFILE
  // ======================================================

  const {
    data: currentProfile,
  } =
    await supabase
      .from("profiles")
      .select(
        "display_name, timezone",
      )
      .eq(
        "id",
        user.id,
      )
      .single();

  const userTimezone =
    currentProfile?.timezone ??
    "UTC";

  const userName =
    currentProfile?.display_name ??
    "Account";

  // ======================================================
  // MEMBERS
  // ======================================================

  const {
    data: members,
    error: membersError,
  } =
    await supabase
      .from(
        "group_members",
      )
      .select(`
        user_id,
        role,
        joined_at,
        profiles (
          display_name
        )
      `)
      .eq(
        "group_id",
        groupId,
      )
      .order(
        "joined_at",
        {
          ascending:
            true,
        },
      );

  const memberIds =
    members?.map(
      (member) =>
        member.user_id,
    ) ?? [];

  // ======================================================
  // PERSONAL BUSY TIMES
  // ======================================================

  const {
    data:
      personalBusyBlocks,
    error:
      busyBlocksError,
  } =
    await supabase
      .from(
        "busy_blocks",
      )
      .select(
        "id, user_id, starts_at, ends_at",
      )
      .eq(
        "user_id",
        user.id,
      )
      .order(
        "starts_at",
        {
          ascending:
            true,
        },
      );

  // ======================================================
  // GROUP BUSY TIMES
  // ======================================================

  let groupBusyBlocks: {
    id: string;
    user_id: string;
    starts_at: string;
    ends_at: string;
  }[] = [];

  if (
    memberIds.length > 0
  ) {
    const {
      data:
        groupBusyData,
    } =
      await supabase
        .from(
          "busy_blocks",
        )
        .select(
          "id, user_id, starts_at, ends_at",
        )
        .in(
          "user_id",
          memberIds,
        )
        .order(
          "starts_at",
          {
            ascending:
              true,
          },
        );

    groupBusyBlocks =
      groupBusyData ?? [];
  }

  // ======================================================
  // EVENTS
  // ======================================================

  const {
    data: groupEvents,
    error:
      groupEventsError,
  } =
    await supabase
      .from("events")
      .select(
        "id, created_by, title, starts_at, ends_at",
      )
      .eq(
        "group_id",
        groupId,
      )
      .order(
        "starts_at",
        {
          ascending:
            true,
        },
      );

  // ======================================================
  // FORMAT SCHEDULE DATA
  // ======================================================

  const scheduleMembers =
    members?.map(
      (member) => ({
        userId:
          member.user_id,

        displayName:
          member.profiles
            ?.display_name ??
          "Unknown user",
      }),
    ) ?? [];

  const scheduleBusyBlocks =
    groupBusyBlocks.map(
      (block) => ({
        id:
          block.id,

        userId:
          block.user_id,

        startsAt:
          block.starts_at,

        endsAt:
          block.ends_at,
      }),
    );

  const scheduleEvents =
    groupEvents?.map(
      (event) => ({
        id:
          event.id,

        title:
          event.title,

        startsAt:
          event.starts_at,

        endsAt:
          event.ends_at,

        canManage:
          event.created_by ===
            user.id ||
          group.created_by ===
            user.id,
      }),
    ) ?? [];

  const isOwner =
    group.created_by ===
    user.id;

  const dateFormatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          userTimezone,

        weekday:
          "short",

        month:
          "short",

        day:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit",
      },
    );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <main className="sakura-page px-5 py-8 sm:px-8 lg:px-12 lg:py-10">

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-two" />
      <span className="sakura-petal sakura-petal-three" />
      <span className="sakura-petal sakura-petal-four" />

      <div className="sakura-content mx-auto max-w-6xl">

        {/* ================================================= */}
        {/* NAV */}
        {/* ================================================= */}

        <header className="sakura-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-7">

          <Link
            href="/dashboard"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbe8ed] text-[#b9687d] transition group-hover:-translate-x-1">
              ←
            </div>

            <div>
              <p className="sakura-title text-lg font-semibold">
                NoClash
              </p>

              <p className="text-xs text-[#9d858e]">
                Back to dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">

            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-[#51474b]">
                {userName}
              </p>

              <p className="text-xs text-[#9d858e]">
                {userTimezone}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5d2dc] text-sm font-bold text-[#945064]">
              {userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <LogoutButton />

          </div>

        </header>

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <section className="mt-10">

          <div className="inline-flex items-center gap-2 rounded-full border border-[#e9a6b8]/30 bg-white/60 px-4 py-2 backdrop-blur">

            <span className="text-[#c56f88]">
              ✿
            </span>

            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9b6575]">
              Shared schedule
            </span>

          </div>

          <h1 className="sakura-title mt-5 text-4xl font-semibold sm:text-5xl">
            {group.name}
          </h1>

          <p className="mt-3 max-w-2xl text-lg leading-8 text-[#74676d]">
            Compare schedules, find an opening that
            works for everyone, and turn it into a plan.
          </p>

        </section>

        {/* ================================================= */}
        {/* MEMBERS */}
        {/* ================================================= */}

        <section className="sakura-card mt-10 p-6 sm:p-7">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

            <div>

              <p className="sakura-label">
                Your circle
              </p>

              <h2 className="sakura-title mt-2 text-2xl font-semibold">
                Group members
              </h2>

              <p className="mt-2 text-sm text-[#74676d]">
                Everyone currently planning together.
              </p>

            </div>

            {isOwner && (
              <InviteFriendButton
                groupId={
                  group.id
                }
              />
            )}

          </div>

          {membersError && (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Could not load group members.
            </p>
          )}

          {!membersError &&
            members && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              {members.map(
                (member) => {
                  const displayName =
                    member.profiles
                      ?.display_name ??
                    "Unknown user";

                  return (
                    <div
                      key={
                        member.user_id
                      }
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#b9687d]/10 bg-white/55 p-4"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fbe8ed] font-semibold text-[#945064]">
                          {displayName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-[#40373b]">
                            {displayName}
                          </p>

                          <p className="mt-1 text-xs text-[#8c7c82]">
                            {member.role ===
                            "owner"
                              ? "Group owner"
                              : "Member"}
                          </p>

                        </div>

                      </div>

                      <div className="flex shrink-0 items-center gap-2">

                        {member.user_id ===
                          user.id && (
                          <span className="sakura-badge">
                            You
                          </span>
                        )}

                        {isOwner &&
                          member.user_id !==
                            user.id && (
                          <RemoveGroupMemberButton
                            groupId={
                              group.id
                            }
                            userId={
                              member.user_id
                            }
                            displayName={
                              displayName
                            }
                          />
                        )}

                      </div>

                    </div>
                  );
                },
              )}

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* GROUP SETTINGS */}
        {/* ================================================= */}

        <section className="mt-8">
          <GroupSettings
            groupId={group.id}
            groupName={group.name}
            isOwner={isOwner}
          />
        </section>

        {/* ================================================= */}
        {/* ADD BUSY */}
        {/* ================================================= */}

        <section className="mt-8">
          <AddBusyBlockForm
            userId={user.id}
            timezone={
              userTimezone
            }
          />
        </section>

        {/* ================================================= */}
        {/* BUSY TIMES */}
        {/* ================================================= */}

        <section className="sakura-card mt-8 p-6 sm:p-7">

          <div className="flex items-start justify-between gap-5">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718067]">
                Availability
              </p>

              <h2 className="sakura-title mt-2 text-2xl font-semibold">
                Your busy times
              </h2>

              <p className="mt-2 text-sm text-[#74676d]">
                NoClash avoids these when finding
                shared availability.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e6ebdf] text-[#718067]">
              ◷
            </div>

          </div>

          {busyBlocksError && (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              Could not load your busy times.
            </p>
          )}

          {!busyBlocksError &&
            (!personalBusyBlocks ||
              personalBusyBlocks.length ===
                0) && (
              <div className="mt-7 rounded-2xl border border-dashed border-[#a9b59f]/35 bg-[#f5f7f2]/55 p-8 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6ebdf] text-[#718067]">
                  ✓
                </div>

                <p className="sakura-title mt-4 text-lg font-semibold">
                  Your schedule is clear
                </p>

                <p className="mt-2 text-sm text-[#8c7c82]">
                  Add an unavailable period above
                  whenever you need one.
                </p>

              </div>
            )}

          {!busyBlocksError &&
            personalBusyBlocks &&
            personalBusyBlocks.length >
              0 && (
              <div className="mt-7 space-y-3">

                {personalBusyBlocks.map(
                  (block) => (
                    <div
                      key={block.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#a9b59f]/20 bg-[#f5f7f2]/65 p-4 sm:flex-row sm:items-center"
                    >

                      <div className="flex items-start gap-3">

                        <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#a9b59f]" />

                        <div>

                          <p className="font-semibold text-[#4b5546]">
                            Busy
                          </p>

                          <p className="mt-1 text-sm text-[#718067]">
                            {dateFormatter.format(
                              new Date(
                                block.starts_at,
                              ),
                            )}
                          </p>

                          <p className="mt-1 text-xs text-[#8d9987]">
                            until{" "}
                            {dateFormatter.format(
                              new Date(
                                block.ends_at,
                              ),
                            )}
                          </p>

                        </div>

                      </div>

                      <DeleteBusyBlockButton
                        busyBlockId={
                          block.id
                        }
                      />

                    </div>
                  ),
                )}

              </div>
            )}

        </section>

        {/* ================================================= */}
        {/* EVENT ERROR */}
        {/* ================================================= */}

        {groupEventsError && (
          <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/80 p-5">
            <p className="text-sm text-red-700">
              Could not load group events.
            </p>
          </section>
        )}

        {/* ================================================= */}
        {/* SCHEDULE */}
        {/* ================================================= */}

        {!groupEventsError && (
          <section className="mt-8 pb-12">

            <GroupSchedule
              groupId={
                group.id
              }
              members={
                scheduleMembers
              }
              busyBlocks={
                scheduleBusyBlocks
              }
              events={
                scheduleEvents
              }
              timezone={
                userTimezone
              }
            />

          </section>
        )}

      </div>

    </main>
  );
}