import Link from "next/link";

import { connection } from "next/server";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";
import OnboardingForm from "@/components/OnboardingForm";

import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function OnboardingPage() {
  await connection();

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const {
    data: profile,
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

  if (
    profile?.display_name &&
    profile?.timezone
  ) {
    redirect("/dashboard");
  }

  return (
    <main className="sakura-page min-h-screen px-4 py-6 sm:px-8 sm:py-10">

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-three" />

      <div className="sakura-content mx-auto max-w-lg">

        <div className="flex items-center justify-between gap-4">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbe8ed] text-xl text-[#b9687d]">
              ✿
            </div>

            <span className="sakura-title text-xl font-semibold">
              NoClash
            </span>
          </Link>

          <LogoutButton />

        </div>

        <div className="mt-12 text-center">

          <p className="sakura-label">
            One last step
          </p>

          <h1 className="sakura-title mt-3 text-4xl font-semibold">
            Make NoClash yours
          </h1>

          <p className="mt-3 leading-7 text-[#74676d]">
            Tell us what to call you and we&apos;ll
            automatically set up your local timezone.
          </p>

        </div>

        <div className="sakura-card mt-8 p-6 sm:p-8">

          <OnboardingForm
            userId={user.id}
            initialDisplayName={
              profile?.display_name
            }
          />

        </div>

      </div>

    </main>
  );
}