import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Your dashboard
          </h2>

          <p className="mt-2 text-gray-600">
            Friend groups, calendars, and shared availability will appear here soon.
          </p>
        </div>
      </div>
    </main>
  );
}