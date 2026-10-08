import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/OnboardingForm";

export const instant = false;

export default async function OnboardingPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <OnboardingForm userId={user.id} />
    </main>
  );
}