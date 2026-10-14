"use client";

import Link from "next/link";
import { useState } from "react";

import LogoutButton from "@/components/LogoutButton";

type AppHeaderProps = {
  displayName: string;
  timezone: string;
  showBackToDashboard?: boolean;
};

export default function AppHeader({
  displayName,
  timezone,
  showBackToDashboard = false,
}: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  return (
    <header className="sakura-card relative z-20 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">

        {/* =============================================== */}
        {/* LEFT SIDE */}
        {/* =============================================== */}

        <div className="flex min-w-0 items-center gap-3">

          {showBackToDashboard ? (
            <Link
              href="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbe8ed] text-[#b9687d] transition hover:-translate-x-0.5"
              aria-label="Back to dashboard"
            >
              ←
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbe8ed] text-xl text-[#b9687d] shadow-sm transition hover:scale-105"
              aria-label="NoClash dashboard"
            >
              ✿
            </Link>
          )}

          <Link
            href="/dashboard"
            className="min-w-0"
          >
            <p className="sakura-title truncate text-lg font-semibold sm:text-xl">
              NoClash
            </p>

            <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[#9d858e] sm:block">
              {showBackToDashboard
                ? "Back to dashboard"
                : "your schedule"}
            </p>
          </Link>

        </div>

        {/* =============================================== */}
        {/* DESKTOP ACCOUNT AREA */}
        {/* =============================================== */}

        <div className="hidden items-center gap-3 md:flex">

          <div className="text-right">

            <p className="text-sm font-semibold text-[#4b4145]">
              {displayName}
            </p>

            <p className="text-xs text-[#9b8a90]">
              {timezone}
            </p>

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5d2dc] text-sm font-bold text-[#945064]">
            {displayName
              .charAt(0)
              .toUpperCase()}
          </div>

          <LogoutButton />

        </div>

        {/* =============================================== */}
        {/* MOBILE MENU BUTTON */}
        {/* =============================================== */}

        <button
          type="button"
          onClick={() =>
            setIsMenuOpen(
              (current) => !current,
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9a6b8]/25 bg-white/70 text-[#945064] md:hidden"
          aria-label="Open account menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen
            ? "×"
            : "☰"}
        </button>

      </div>

      {/* =============================================== */}
      {/* MOBILE MENU */}
      {/* =============================================== */}

      {isMenuOpen && (
        <div className="mt-4 border-t border-[#b9687d]/10 pt-4 md:hidden">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5d2dc] text-sm font-bold text-[#945064]">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-[#4b4145]">
                {displayName}
              </p>

              <p className="truncate text-xs text-[#9b8a90]">
                {timezone}
              </p>

            </div>

          </div>

          <div className="mt-4">

            <LogoutButton />

          </div>

        </div>
      )}

    </header>
  );
}