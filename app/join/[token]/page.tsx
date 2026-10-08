import Link from "next/link";
import { connection } from "next/server";

import JoinGroupButton from "@/components/JoinGroupButton";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type JoinPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function JoinPage({
  params,
}: JoinPageProps) {
  await connection();

  const { token } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc(
    "get_group_invite_info",
    {
      invite_token: token,
    }
  );

  const invite = data?.[0];

  if (error || !invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="font-semibold text-blue-600">
            NoClash
          </p>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Invite not found
          </h1>

          <p className="mt-3 text-gray-600">
            This invite link is invalid or no longer exists.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-block font-medium text-blue-600 hover:text-blue-700"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!invite.is_valid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="font-semibold text-blue-600">
            NoClash
          </p>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Invite unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            This invite has expired or has already been used.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-block font-medium text-blue-600 hover:text-blue-700"
          >
            Go to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="font-semibold text-blue-600">
          NoClash
        </p>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          You're invited
        </h1>

        <p className="mt-3 text-gray-600">
          You've been invited to join:
        </p>

        <div className="mt-6 rounded-lg bg-gray-50 p-5">
          <p className="text-xl font-semibold text-gray-900">
            {invite.group_name}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Invite expires{" "}
            {new Date(
              invite.expires_at,
            ).toLocaleDateString()}
          </p>
        </div>

        {!user ? (
          <div className="mt-8">
            <p className="text-sm text-gray-600">
              You need to log in or create a NoClash account
              before joining this group.
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                href="/auth/login"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
              >
                Log in
              </Link>

              <Link
                href="/auth/sign-up"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              After logging in, open this invite link again.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <JoinGroupButton token={token} />
          </div>
        )}
      </div>
    </main>
  );
}