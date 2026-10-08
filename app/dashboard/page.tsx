import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import CreateGroupForm from "@/components/CreateGroupForm";

export const instant = false;

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  if (!profile?.display_name || !profile?.timezone) {
    redirect("/onboarding");
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold text-blue-600">
          NoClash
        </p>

        <h1 className="mt-2 text-4xl font-bold text-gray-900">
          Welcome, {profile.display_name}
        </h1>

        <p className="mt-3 text-gray-600">
          Your timezone is {profile.timezone}.
        </p>

        <div className="mt-10">
          <CreateGroupForm userId={user.id} />
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Your groups
          </h2>

          <p className="mt-2 text-gray-600">
            Groups you belong to will appear here.
          </p>

          {groupsError && (
            <p className="mt-4 text-red-600">
              Could not load your groups.
            </p>
          )}

          {!groupsError && groups?.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="font-medium text-gray-900">
                You aren't in any groups yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Create your first group above.
              </p>
            </div>
          )}

          {!groupsError && groups && groups.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-xl border border-gray-200 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Created{" "}
                    {new Date(group.created_at).toLocaleDateString()}
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