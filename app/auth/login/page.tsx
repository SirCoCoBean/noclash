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

export default function LoginPage() {
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
    setIsLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim(),

        password,
      });

    if (error) {
      setErrorMessage(
        error.message,
      );

      setIsLoading(false);

      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="sakura-page flex min-h-screen items-center justify-center px-4 py-8">

      <span className="sakura-petal sakura-petal-one" />
      <span className="sakura-petal sakura-petal-two" />
      <span className="sakura-petal sakura-petal-four" />

      <div className="sakura-content w-full max-w-md">

        <div className="text-center">

          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fbe8ed] text-2xl text-[#b9687d] shadow-sm">
              ✿
            </div>

            <span className="sakura-title text-2xl font-semibold">
              NoClash
            </span>
          </Link>

          <h1 className="sakura-title mt-8 text-4xl font-semibold">
            Welcome back
          </h1>

          <p className="mt-3 text-[#74676d]">
            Your next plan is waiting.
          </p>

        </div>

        <div className="sakura-card mt-8 p-6 sm:p-8">

          <form
            onSubmit={handleSubmit}
          >

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
                className="sakura-input mt-2 px-4 py-3"
              />

            </div>

            <div className="mt-5">

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(
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
                ? "Logging in..."
                : "Log in"}
            </button>

          </form>

        </div>

        <p className="mt-6 text-center text-sm text-[#74676d]">
          New to NoClash?{" "}

          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(
              nextPath,
            )}`}
            className="font-semibold text-[#b9687d] hover:text-[#945064]"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-5 text-center text-lg text-[#e9a6b8]">
          ✿
        </p>

      </div>

    </main>
  );
}