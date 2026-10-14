import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import CreateGroupForm from "@/components/CreateGroupForm";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardPage() {
  await connection();

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

  // This is safe here because we already called:
  //
  // await connection()
  //
  // so this page is intentionally rendered using the
  // current request rather than being statically prerendered.

  const now = new Date();
  const nowIso = now.toISOString();

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

  // Create a lookup table:
  //
  // group UUID -> group name
  //
  // This lets us easily show the correct group name
  // beside each event.

  const groupNameById = new Map(
    safeGroups.map((group) => [
      group.id,
      group.name,
    ]),
  );

  // ======================================================
  // UPCOMING GROUP EVENTS
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
  // YOUR UPCOMING BUSY TIMES
  // ======================================================

  const {
    data: upcomingBusyBlocks,
    error: busyError,
  } = await supabase
    .from("busy_blocks")
    .select(
      "id, starts_at, ends_at",
    )
    .eq("user_id", user.id)
    .gte("ends_at", nowIso)
    .order("starts_at", {
      ascending: true,
    })
    .limit(5);

  // ======================================================
  // DATE FORMATTERS
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
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div>
          <p className="font-semibold text-blue-600">
            NoClash
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Welcome, {profile.display_name}
          </h1>

          <p className="mt-3 text-gray-600">
            See what&apos;s coming up and find a time
            that works for everyone.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Your timezone: {userTimezone}
          </p>
        </div>

        {/* ================================================= */}
        {/* QUICK SUMMARY */}
        {/* ================================================= */}

        <section className="mt-10 grid gap-4 md:grid-cols-3">

          {/* GROUP COUNT */}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">
              Your groups
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {safeGroups.length}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Groups you currently belong to.
            </p>
          </div>

          {/* NEXT EVENT */}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">
              Next event
            </p>

            {upcomingEvents &&
            upcomingEvents.length > 0 ? (
              <>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {upcomingEvents[0].title}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {fullDateFormatter.format(
                    new Date(
                      upcomingEvents[0].starts_at,
                    ),
                  )}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Nothing scheduled yet.
              </p>
            )}
          </div>

          {/* NEXT BUSY TIME */}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">
              Your next busy time
            </p>

            {upcomingBusyBlocks &&
            upcomingBusyBlocks.length > 0 ? (
              <>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  Busy
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {fullDateFormatter.format(
                    new Date(
                      upcomingBusyBlocks[0]
                        .starts_at,
                    ),
                  )}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                No upcoming busy times.
              </p>
            )}
          </div>

        </section>

        {/* ================================================= */}
        {/* UPCOMING EVENTS */}
        {/* ================================================= */}

        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Upcoming events
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Shared events across all of your groups.
            </p>
          </div>

          {eventsError && (
            <p className="mt-6 text-sm text-red-600">
              Could not load upcoming events.
            </p>
          )}

          {!eventsError &&
            (!upcomingEvents ||
              upcomingEvents.length === 0) && (
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="font-medium text-gray-900">
                  No upcoming events.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Open a group and schedule something
                  from one of your free-time results.
                </p>
              </div>
            )}

          {!eventsError &&
            upcomingEvents &&
            upcomingEvents.length > 0 && (
              <div className="mt-6 divide-y divide-gray-200">

                {upcomingEvents.map((event) => {
                  const groupName =
                    groupNameById.get(
                      event.group_id,
                    ) ?? "Group";

                  return (
                    <Link
                      key={event.id}
                      href={`/groups/${event.group_id}`}
                      className="flex items-center justify-between gap-6 py-5 transition hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {event.title}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {groupName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {fullDateFormatter.format(
                            new Date(
                              event.starts_at,
                            ),
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          to{" "}
                          {fullDateFormatter.format(
                            new Date(
                              event.ends_at,
                            ),
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                })}

              </div>
            )}

        </section>

        {/* ================================================= */}
        {/* UPCOMING BUSY TIMES */}
        {/* ================================================= */}

        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="text-2xl font-bold text-gray-900">
            Your upcoming busy times
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            These periods are used when NoClash
            searches for shared availability.
          </p>

          {busyError && (
            <p className="mt-6 text-sm text-red-600">
              Could not load your busy times.
            </p>
          )}

          {!busyError &&
            (!upcomingBusyBlocks ||
              upcomingBusyBlocks.length === 0) && (
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="font-medium text-gray-900">
                  Nothing coming up.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Add busy time from one of your group
                  pages.
                </p>
              </div>
            )}

          {!busyError &&
            upcomingBusyBlocks &&
            upcomingBusyBlocks.length > 0 && (
              <div className="mt-6 divide-y divide-gray-200">

                {upcomingBusyBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between gap-6 py-5"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Busy
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {dateOnlyFormatter.format(
                          new Date(
                            block.starts_at,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-700">
                        {fullDateFormatter.format(
                          new Date(
                            block.starts_at,
                          ),
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        to{" "}
                        {fullDateFormatter.format(
                          new Date(
                            block.ends_at,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            )}

        </section>

        {/* ================================================= */}
        {/* CREATE GROUP */}
        {/* ================================================= */}

        <section className="mt-10">
          <CreateGroupForm
            userId={user.id}
          />
        </section>

        {/* ================================================= */}
        {/* YOUR GROUPS */}
        {/* ================================================= */}

        <section className="mt-10">

          <h2 className="text-2xl font-bold text-gray-900">
            Your groups
          </h2>

          <p className="mt-2 text-gray-600">
            Open a group to manage schedules,
            invitations, events, and availability.
          </p>

          {groupsError && (
            <p className="mt-6 text-red-600">
              Could not load your groups.
            </p>
          )}

          {!groupsError &&
            safeGroups.length === 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="font-medium text-gray-900">
                  You aren&apos;t in any groups yet.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Create your first group above.
                </p>
              </div>
            )}

          {!groupsError &&
            safeGroups.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">

                {safeGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.name}
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          Created{" "}
                          {dateOnlyFormatter.format(
                            new Date(
                              group.created_at,
                            ),
                          )}
                        </p>
                      </div>

                      <span className="text-lg text-gray-400">
                        →
                      </span>

                    </div>
                  </Link>
                ))}

              </div>
            )}

        </section>

      </div>
    </main>
  );
}