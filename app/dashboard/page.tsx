import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import CreateGroupForm from "@/components/CreateGroupForm";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();

  // ======================================================
  // AUTH
  // ======================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // ======================================================
  // PROFILE
  // ======================================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile?.display_name ||
    !profile?.timezone
  ) {
    redirect("/onboarding");
  }

  const userTimezone = profile.timezone;

  // ======================================================
  // CURRENT TIME
  // ======================================================

  const nowIso = new Date().toISOString();

  // ======================================================
  // GROUPS
  // ======================================================

  const {
    data: groups,
    error: groupsError,
  } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .order("created_at", {
      ascending: false,
    });

  const safeGroups = groups ?? [];

  const groupNameById = new Map(
    safeGroups.map((group) => [
      group.id,
      group.name,
    ]),
  );

  // ======================================================
  // EVENTS
  // ======================================================

  const {
    data: upcomingEvents,
    error: eventsError,
  } = await supabase
    .from("events")
    .select(
      "id, group_id, title, starts_at, ends_at",
    )
    .gte("ends_at", nowIso)
    .order("starts_at", {
      ascending: true,
    })
    .limit(5);

  // ======================================================
  // BUSY TIMES
  // ======================================================

  const {
    data: upcomingBusyBlocks,
    error: busyError,
  } = await supabase
    .from("busy_blocks")
    .select("id, starts_at, ends_at")
    .eq("user_id", user.id)
    .gte("ends_at", nowIso)
    .order("starts_at", {
      ascending: true,
    })
    .limit(5);

  // ======================================================
  // FORMATTERS
  // ======================================================

  const fullDateFormatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: userTimezone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    );

  const dateOnlyFormatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: userTimezone,
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <main className="sakura-page px-4 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10">

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-two" />
      <span className="sakura-petal sakura-petal-three" />
      <span className="sakura-petal sakura-petal-four" />

      <div className="sakura-content mx-auto max-w-7xl">

        <AppHeader
          displayName={profile.display_name}
          timezone={userTimezone}
        />

        {/* ================================================= */}
        {/* WELCOME */}
        {/* ================================================= */}

        <section className="mt-10 sm:mt-12">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#e9a6b8]/30 bg-white/60 px-4 py-2 backdrop-blur">
              <span className="text-[#c56f88]">
                ✿
              </span>

              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9b6575] sm:text-xs">
                Your schedule at a glance
              </span>
            </div>

            <h1 className="sakura-title mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Welcome back,{" "}
              <span className="text-[#b9687d]">
                {profile.display_name}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#74676d] sm:text-lg sm:leading-8">
              Keep track of your groups, upcoming plans,
              and the times you&apos;re unavailable — all
              in one calm little corner.
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <section className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">

          <div className="sakura-card sakura-card-hover p-5 sm:p-6">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fbe8ed] text-xl text-[#b9687d]">
                ✿
              </div>

              <span className="sakura-badge">
                Groups
              </span>

            </div>

            <p className="mt-6 text-sm font-medium text-[#8c7c82]">
              Your groups
            </p>

            <p className="sakura-title mt-1 text-4xl font-semibold">
              {safeGroups.length}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#8c7c82]">
              Spaces where you&apos;re planning together.
            </p>

          </div>

          <div className="sakura-card sakura-card-hover p-5 sm:p-6">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eee6ef] text-xl text-[#725576]">
                ✦
              </div>

              <span className="rounded-full bg-[#eee6ef] px-3 py-1 text-xs font-semibold text-[#725576]">
                Next plan
              </span>

            </div>

            <p className="mt-6 text-sm font-medium text-[#8c7c82]">
              Next event
            </p>

            {upcomingEvents &&
            upcomingEvents.length > 0 ? (
              <>
                <p className="sakura-title mt-1 break-words text-2xl font-semibold">
                  {upcomingEvents[0].title}
                </p>

                <p className="mt-2 text-sm leading-6 text-[#74676d]">
                  {fullDateFormatter.format(
                    new Date(
                      upcomingEvents[0].starts_at,
                    ),
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="sakura-title mt-1 text-2xl font-semibold">
                  Nothing yet
                </p>

                <p className="mt-2 text-sm text-[#8c7c82]">
                  Your next plan will appear here.
                </p>
              </>
            )}

          </div>

          <div className="sakura-card sakura-card-hover p-5 sm:p-6">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6ebdf] text-xl text-[#6f8066]">
                ◷
              </div>

              <span className="rounded-full bg-[#edf1e9] px-3 py-1 text-xs font-semibold text-[#718067]">
                Availability
              </span>

            </div>

            <p className="mt-6 text-sm font-medium text-[#8c7c82]">
              Your next busy time
            </p>

            {upcomingBusyBlocks &&
            upcomingBusyBlocks.length > 0 ? (
              <>
                <p className="sakura-title mt-1 text-2xl font-semibold">
                  Busy
                </p>

                <p className="mt-2 text-sm leading-6 text-[#74676d]">
                  {fullDateFormatter.format(
                    new Date(
                      upcomingBusyBlocks[0].starts_at,
                    ),
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="sakura-title mt-1 text-2xl font-semibold">
                  All clear
                </p>

                <p className="mt-2 text-sm text-[#8c7c82]">
                  No upcoming busy time added.
                </p>
              </>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* EVENTS + BUSY */}
        {/* ================================================= */}

        <div className="mt-6 grid gap-6 sm:mt-10 lg:grid-cols-[1.35fr_0.9fr]">

          <section className="sakura-card min-w-0 p-5 sm:p-7">

            <p className="sakura-label">
              Coming up
            </p>

            <h2 className="sakura-title mt-2 text-2xl font-semibold">
              Upcoming events
            </h2>

            <p className="mt-2 text-sm text-[#74676d]">
              Shared plans across all of your groups.
            </p>

            {eventsError && (
              <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                Could not load upcoming events.
              </p>
            )}

            {!eventsError &&
              (!upcomingEvents ||
                upcomingEvents.length === 0) && (
                <div className="mt-7 rounded-2xl border border-dashed border-[#b9687d]/20 bg-[#fff7f9]/60 p-7 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fbe8ed] text-xl text-[#b9687d]">
                    ✿
                  </div>

                  <p className="sakura-title mt-4 text-lg font-semibold">
                    Nothing scheduled yet
                  </p>

                </div>
              )}

            {!eventsError &&
              upcomingEvents &&
              upcomingEvents.length > 0 && (
                <div className="mt-6 space-y-3">

                  {upcomingEvents.map(
                    (event) => {
                      const groupName =
                        groupNameById.get(
                          event.group_id,
                        ) ?? "Group";

                      return (
                        <Link
                          key={event.id}
                          href={`/groups/${event.group_id}`}
                          className="group block rounded-2xl border border-[#b9687d]/10 bg-white/55 p-4 transition hover:border-[#b9687d]/25 hover:bg-white/80"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="min-w-0">

                              <p className="break-words font-semibold text-[#40373b]">
                                {event.title}
                              </p>

                              <p className="mt-1 text-sm text-[#8c7c82]">
                                {groupName}
                              </p>

                            </div>

                            <div className="shrink-0 sm:text-right">

                              <p className="text-sm font-medium text-[#5e5257]">
                                {fullDateFormatter.format(
                                  new Date(
                                    event.starts_at,
                                  ),
                                )}
                              </p>

                              <p className="mt-1 text-xs text-[#9d8e93]">
                                View group →
                              </p>

                            </div>

                          </div>
                        </Link>
                      );
                    },
                  )}

                </div>
              )}

          </section>

          <section className="sakura-card min-w-0 p-5 sm:p-7">

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#718067]">
              Your availability
            </p>

            <h2 className="sakura-title mt-2 text-2xl font-semibold">
              Busy times
            </h2>

            <p className="mt-2 text-sm text-[#74676d]">
              What NoClash uses to avoid conflicts.
            </p>

            {busyError && (
              <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                Could not load your busy times.
              </p>
            )}

            {!busyError &&
              (!upcomingBusyBlocks ||
                upcomingBusyBlocks.length === 0) && (
                <div className="mt-7 rounded-2xl border border-dashed border-[#a9b59f]/35 bg-[#f5f7f2]/60 p-7 text-center">

                  <p className="sakura-title text-lg font-semibold">
                    Nothing coming up
                  </p>

                  <p className="mt-2 text-sm text-[#8c7c82]">
                    Your busy periods will appear here.
                  </p>

                </div>
              )}

            {!busyError &&
              upcomingBusyBlocks &&
              upcomingBusyBlocks.length > 0 && (
                <div className="mt-6 space-y-3">

                  {upcomingBusyBlocks.map(
                    (block) => (
                      <div
                        key={block.id}
                        className="rounded-2xl border border-[#a9b59f]/20 bg-[#f5f7f2]/65 p-4"
                      >
                        <p className="font-semibold text-[#4b5546]">
                          Busy
                        </p>

                        <p className="mt-1 text-sm text-[#718067]">
                          {fullDateFormatter.format(
                            new Date(
                              block.starts_at,
                            ),
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#8d9987]">
                          until{" "}
                          {fullDateFormatter.format(
                            new Date(
                              block.ends_at,
                            ),
                          )}
                        </p>

                      </div>
                    ),
                  )}

                </div>
              )}

          </section>

        </div>

        <section className="mt-6 sm:mt-10">
          <CreateGroupForm
            userId={user.id}
          />
        </section>

        {/* ================================================= */}
        {/* GROUPS */}
        {/* ================================================= */}

        <section className="mt-10 pb-12 sm:mt-12">

          <p className="sakura-label">
            Your spaces
          </p>

          <h2 className="sakura-title mt-2 text-3xl font-semibold">
            Your groups
          </h2>

          <p className="mt-2 text-[#74676d]">
            Open a group to compare schedules and make
            plans together.
          </p>

          {groupsError && (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">
              Could not load your groups.
            </p>
          )}

          {!groupsError &&
            safeGroups.length === 0 && (
              <div className="sakura-card mt-6 p-8 text-center sm:p-10">

                <p className="sakura-title text-xl font-semibold">
                  Your first group awaits
                </p>

              </div>
            )}

          {!groupsError &&
            safeGroups.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {safeGroups.map(
                  (group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="sakura-card sakura-card-hover group min-w-0 p-5 sm:p-6"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fbe8ed] text-[#b9687d]">
                          ✿
                        </div>

                        <span className="text-[#b9687d]">
                          →
                        </span>

                      </div>

                      <h3 className="sakura-title mt-5 break-words text-2xl font-semibold">
                        {group.name}
                      </h3>

                      <p className="mt-2 text-sm text-[#8c7c82]">
                        Created{" "}
                        {dateOnlyFormatter.format(
                          new Date(
                            group.created_at,
                          ),
                        )}
                      </p>

                    </Link>
                  ),
                )}

              </div>
            )}

        </section>

      </div>

    </main>
  );
}