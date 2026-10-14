"use client";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function getSafeNextPath(
  value: string | null,
) {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "/dashboard";
}

export default function SignUpPage() {
  const router = useRouter();

  const supabase = createClient();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    nextPath,
    setNextPath,
  ] = useState("/dashboard");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    accountCreated,
    setAccountCreated,
  ] = useState(false);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    setNextPath(
      getSafeNextPath(
        params.get("next"),
      ),
    );
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "Your passwords do not match.",
      );

      return;
    }

    if (
      password.length < 6
    ) {
      setErrorMessage(
        "Your password must be at least 6 characters.",
      );

      return;
    }

    setIsLoading(true);

    const emailRedirectTo =
      `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
        nextPath,
      )}`;

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email:
          email.trim(),

        password,

        options: {
          emailRedirectTo,
        },
      });

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsLoading(false);

      return;
    }

    if (data.session) {
      router.push(nextPath);
      router.refresh();

      return;
    }

    setAccountCreated(true);
    setIsLoading(false);
  }

  if (accountCreated) {
    return (
      <main className="sakura-page flex min-h-screen items-center justify-center px-4 py-8">

        <div className="sakura-content w-full max-w-md">

          <div className="sakura-card p-7 text-center sm:p-9">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe8ed] text-2xl text-[#b9687d]">
              ✿
            </div>

            <h1 className="sakura-title mt-5 text-3xl font-semibold">
              Check your email
            </h1>

            <p className="mt-3 leading-7 text-[#74676d]">
              We sent a confirmation link to{" "}
              <span className="font-semibold">
                {email}
              </span>
              .
            </p>

            <p className="mt-2 text-sm text-[#8c7c82]">
              After confirming your email, you can
              continue into NoClash.
            </p>

            <Link
              href={`/auth/login?next=${encodeURIComponent(
                nextPath,
              )}`}
              className="sakura-button mt-7 px-6 py-3"
            >
              Back to login
            </Link>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="sakura-page flex min-h-screen items-center justify-center px-4 py-8">

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-two" />

      <div className="sakura-content w-full max-w-md">

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

          <h1 className="sakura-title mt-8 text-4xl font-semibold">
            Make time together
          </h1>

          <p className="mt-3 text-[#74676d]">
            Create your account and start planning.
          </p>

        </div>

        <div className="sakura-card mt-8 p-6 sm:p-8">

          <form
            onSubmit={handleSubmit}
          >

            <div>

              <label
                htmlFor="signupEmail"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Email
              </label>

              <input
                id="signupEmail"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="signupPassword"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Password
              </label>

              <input
                id="signupPassword"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              />

            </div>

            {errorMessage && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="sakura-button mt-6 w-full px-5 py-3 disabled:opacity-50"
            >
              {isLoading
                ? "Creating account..."
                : "Create account"}
            </button>

          </form>

        </div>

        <p className="mt-6 text-center text-sm text-[#74676d]">
          Already have an account?{" "}

          <Link
            href={`/auth/login?next=${encodeURIComponent(
              nextPath,
            )}`}
            className="font-semibold text-[#b9687d]"
          >
            Log in
          </Link>
        </p>

      </div>

    </main>
  );
}