"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    await supabase.auth.signOut();

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="rounded-xl border border-[#e9a6b8]/30 bg-white/70 px-4 py-2 text-sm font-semibold text-[#945064] transition hover:bg-[#fff7f9] disabled:opacity-50"
    >
      {isLoggingOut
        ? "Logging out..."
        : "Log out"}
    </button>
  );
}