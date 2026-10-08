import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import CreateGroupForm from "@/components/CreateGroupForm";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DashboardPage() {
  // This page depends on the currently logged-in user,
  // so it needs to render at request time.
  await connection();

  const supabase = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If nobody is logged in, send them to the login page.
  if (!user) {
    redirect("/auth/login");
  }

  // Get this user's NoClash profile.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  // If the profile query failed, we can treat the profile as incomplete.
  if (
    profileError ||
    !profile?.display_name ||
    !profile?.timezone
  ) {
    redirect("/onboarding");
  }

  // Fetch every group this user is allowed to see.
  // Our RLS policies make sure they only receive groups
  // that they belong to.
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <p className="font-semibold text-blue-600">
          NoClash
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Welcome, {profile.display_name}
        </h1>

        <p className="mt-3 text-gray-600">
          Your timezone is {profile.timezone}.
        </p>

        {/* Create group form */}
        <div className="mt-10">
          <CreateGroupForm userId={user.id} />
        </div>

        {/* Group list */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Your groups
          </h2>

          <p className="mt-2 text-gray-600">
            Groups you belong to will appear here.
          </p>

          {/* Error state */}
          {groupsError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Could not load your groups.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!groupsError && (!groups || groups.length === 0) && (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="font-medium text-gray-900">
                You aren&apos;t in any groups yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Create your first group above.
              </p>
            </div>
          )}

          {/* Group cards */}
          {!groupsError && groups && groups.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Created{" "}
                    {new Date(
                      group.created_at,
                    ).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}