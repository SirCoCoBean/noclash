import Link from "next/link";

import { connection } from "next/server";

import {
  redirect,
} from "next/navigation";

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

  const {
    token,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  const {
    data: inviteData,
    error: inviteError,
  } =
    await supabase.rpc(
      "get_group_invite_info",
      {
        invite_token:
          token,
      },
    );

  const invite =
    Array.isArray(inviteData)
      ? inviteData[0]
      : inviteData;

  const returnPath =
    `/join/${token}`;

  // ======================================================
  // INVALID INVITE
  // ======================================================

  if (
    inviteError ||
    !invite
  ) {
    return (
      <main className="sakura-page flex min-h-screen items-center justify-center px-4 py-8">

        <div className="sakura-content w-full max-w-md">

          <div className="sakura-card p-7 text-center sm:p-9">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe8ed] text-2xl text-[#b9687d]">
              ✿
            </div>

            <h1 className="sakura-title mt-5 text-3xl font-semibold">
              Invite not found
            </h1>

            <p className="mt-3 leading-7 text-[#74676d]">
              This invitation may be invalid or no
              longer available.
            </p>

            <Link
              href={
                user
                  ? "/dashboard"
                  : "/"
              }
              className="sakura-button-secondary mt-6 px-5 py-3"
            >
              {user
                ? "Go to dashboard"
                : "Return home"}
            </Link>

          </div>

        </div>

      </main>
    );
  }

  // ======================================================
  // EXPIRED / USED INVITE
  // ======================================================

  if (!invite.is_valid) {
    return (
      <main className="sakura-page flex min-h-screen items-center justify-center px-4 py-8">

        <div className="sakura-content w-full max-w-md">

          <div className="sakura-card p-7 text-center sm:p-9">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eee6ef] text-2xl text-[#725576]">
              ✦
            </div>

            <h1 className="sakura-title mt-5 text-3xl font-semibold">
              Invite unavailable
            </h1>

            <p className="mt-3 leading-7 text-[#74676d]">
              This invitation has expired or has already
              been used.
            </p>

            <Link
              href={
                user
                  ? "/dashboard"
                  : "/"
              }
              className="sakura-button-secondary mt-6 px-5 py-3"
            >
              Continue
            </Link>

          </div>

        </div>

      </main>
    );
  }

  // ======================================================
  // VALID INVITE
  // ======================================================

  return (
    <main className="sakura-page flex min-h-screen items-center justify-center px-4 py-8">

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-four" />

      <div className="sakura-content w-full max-w-lg">

        <div className="text-center">

          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fbe8ed] text-2xl text-[#b9687d]">
              ✿
            </div>

            <span className="sakura-title text-2xl font-semibold">
              NoClash
            </span>
          </Link>

        </div>

        <div className="sakura-card mt-8 overflow-hidden">

          <div className="border-b border-[#b9687d]/10 bg-[#fff7f9]/55 p-6 text-center sm:p-8">

            <p className="sakura-label">
              You&apos;re invited
            </p>

            <h1 className="sakura-title mt-3 break-words text-3xl font-semibold sm:text-4xl">
              {invite.group_name}
            </h1>

            <p className="mt-3 text-[#74676d]">
              Join the group and start finding time
              together.
            </p>

          </div>

          <div className="p-6 sm:p-8">

            {user ? (
              <>
                <div className="mb-5 rounded-xl border border-[#a9b59f]/20 bg-[#f5f7f2]/70 p-4">

                  <p className="text-sm text-[#66725f]">
                    You&apos;re signed in and ready to
                    join.
                  </p>

                </div>

                <JoinGroupButton
                  token={token}
                />
              </>
            ) : (
              <>
                <p className="text-center text-sm leading-6 text-[#74676d]">
                  Sign in or create an account first.
                  We&apos;ll bring you back to this
                  invitation afterward.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  <Link
                    href={`/auth/login?next=${encodeURIComponent(
                      returnPath,
                    )}`}
                    className="sakura-button px-5 py-3 text-center"
                  >
                    Log in
                  </Link>

                  <Link
                    href={`/auth/sign-up?next=${encodeURIComponent(
                      returnPath,
                    )}`}
                    className="sakura-button-secondary px-5 py-3 text-center"
                  >
                    Create account
                  </Link>

                </div>
              </>
            )}

          </div>

        </div>

      </div>

    </main>
  );
}