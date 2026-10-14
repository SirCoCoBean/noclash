import Link from "next/link";

export default function Navbar() {
  return (
    <header className="px-5 pt-5 sm:px-8 lg:px-12">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-[#b9687d]/10 bg-white/70 px-5 py-4 shadow-[0_8px_30px_rgba(116,72,84,0.05)] backdrop-blur-xl sm:px-7">

        {/* ================================================= */}
        {/* LOGO */}
        {/* ================================================= */}

        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          {/* Blossom icon */}

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbe8ed] shadow-sm transition group-hover:scale-105">
            <span
              className="text-xl text-[#b9687d]"
              aria-hidden="true"
            >
              ✿
            </span>
          </div>

          <div>
            <p className="sakura-title text-xl font-semibold leading-none">
              NoClash
            </p>

            <p className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[#9d858e] sm:block">
              find time together
            </p>
          </div>
        </Link>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-[#74676d] transition hover:bg-[#fff7f9] hover:text-[#b9687d] sm:px-4"
          >
            Log in
          </Link>

          <Link
            href="/auth/sign-up"
            className="sakura-button px-4 py-2.5 text-sm sm:px-5"
          >
            Get Started
          </Link>
        </div>

      </nav>
    </header>
  );
}