import Link from "next/link";

export default function Hero() {
  return (
    <section className="px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-12 lg:pb-28 lg:pt-24">
      <div className="mx-auto max-w-7xl">

        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">

          {/* ================================================= */}
          {/* LEFT — HERO COPY */}
          {/* ================================================= */}

          <div className="max-w-2xl">

            {/* Small label */}

            <div className="inline-flex items-center gap-2 rounded-full border border-[#e9a6b8]/30 bg-white/65 px-4 py-2 shadow-sm backdrop-blur">
              <span className="text-[#c56f88]">
                ✿
              </span>

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6575]">
                Simple group scheduling
              </span>
            </div>

            {/* Main headline */}

            <h1 className="sakura-title mt-8 text-5xl font-semibold leading-[1.06] sm:text-6xl lg:text-7xl">
              Find time together,
              <span className="block text-[#b9687d]">
                without the clash.
              </span>
            </h1>

            {/* Description */}

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#74676d] sm:text-xl">
              NoClash helps friends compare schedules,
              find the moments everyone is free, and turn
              them into plans without endless group-chat
              back-and-forth.
            </p>

            {/* CTA buttons */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="sakura-button px-7 py-3.5 text-center"
              >
                Start planning
              </Link>

              <Link
                href="/auth/login"
                className="sakura-button-secondary px-7 py-3.5 text-center"
              >
                I already have an account
              </Link>
            </div>

            {/* Mini benefits */}

            <div className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">

              <div className="flex items-center gap-2 text-sm text-[#74676d]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbe8ed] text-xs text-[#b9687d]">
                  ✓
                </span>

                Shared schedules
              </div>

              <div className="flex items-center gap-2 text-sm text-[#74676d]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbe8ed] text-xs text-[#b9687d]">
                  ✓
                </span>

                Free-time finder
              </div>

              <div className="flex items-center gap-2 text-sm text-[#74676d]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbe8ed] text-xs text-[#b9687d]">
                  ✓
                </span>

                Group events
              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* RIGHT — APP PREVIEW */}
          {/* ================================================= */}

          <div className="relative">

            {/* Soft background glow */}

            <div className="absolute -inset-10 -z-10 rounded-full bg-[#f5d2dc]/35 blur-3xl" />

            {/* Main preview card */}

            <div className="sakura-card overflow-hidden p-5 sm:p-7">

              {/* Preview header */}

              <div className="flex items-start justify-between gap-4 border-b border-[#b9687d]/10 pb-5">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#b9687d]">
                    NoClash
                  </p>

                  <h2 className="sakura-title mt-1 text-2xl font-semibold">
                    Weekend Crew
                  </h2>

                  <p className="mt-1 text-sm text-[#8c7c82]">
                    Saturday, October 17
                  </p>
                </div>

                <div className="flex -space-x-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#f5d2dc] text-xs font-semibold text-[#945064]">
                    T
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e6ebdf] text-xs font-semibold text-[#61705a]">
                    A
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#eee6ef] text-xs font-semibold text-[#725576]">
                    M
                  </div>

                </div>

              </div>


              {/* Time headings */}

              <div className="mt-7 grid grid-cols-[72px_1fr] gap-3">

                <div />

                <div className="grid grid-cols-5 text-center text-[10px] font-medium text-[#9d8e93]">
                  <span>1 PM</span>
                  <span>3 PM</span>
                  <span>5 PM</span>
                  <span>7 PM</span>
                  <span>9 PM</span>
                </div>

              </div>


              {/* TOM */}

              <div className="mt-3 grid grid-cols-[72px_1fr] items-center gap-3">

                <p className="text-sm font-medium text-[#4c4246]">
                  Tom
                </p>

                <div className="relative h-10 overflow-hidden rounded-xl border border-[#b9687d]/10 bg-white/65">

                  {/* grid */}

                  <div className="absolute inset-0 grid grid-cols-5">
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div />
                  </div>

                  <div className="schedule-busy absolute bottom-1.5 left-[42%] top-1.5 w-[24%] rounded-lg shadow-sm" />

                </div>

              </div>


              {/* ALEX */}

              <div className="mt-3 grid grid-cols-[72px_1fr] items-center gap-3">

                <p className="text-sm font-medium text-[#4c4246]">
                  Alex
                </p>

                <div className="relative h-10 overflow-hidden rounded-xl border border-[#b9687d]/10 bg-white/65">

                  <div className="absolute inset-0 grid grid-cols-5">
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div />
                  </div>

                  <div className="schedule-busy absolute bottom-1.5 left-[52%] top-1.5 w-[20%] rounded-lg shadow-sm" />

                </div>

              </div>


              {/* MAYA */}

              <div className="mt-3 grid grid-cols-[72px_1fr] items-center gap-3">

                <p className="text-sm font-medium text-[#4c4246]">
                  Maya
                </p>

                <div className="relative h-10 overflow-hidden rounded-xl border border-[#b9687d]/10 bg-white/65">

                  <div className="absolute inset-0 grid grid-cols-5">
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div className="border-r border-[#b9687d]/10" />
                    <div />
                  </div>

                  <div className="schedule-busy absolute bottom-1.5 left-[30%] top-1.5 w-[18%] rounded-lg shadow-sm" />

                </div>

              </div>


              {/* SHARED EVENT */}

              <div className="mt-5 grid grid-cols-[72px_1fr] items-center gap-3">

                <p className="text-sm font-semibold text-[#725576]">
                  Event
                </p>

                <div className="relative h-10 overflow-hidden rounded-xl border border-[#86678a]/10 bg-white/65">

                  <div className="absolute inset-0 grid grid-cols-5">
                    <div className="border-r border-[#86678a]/10" />
                    <div className="border-r border-[#86678a]/10" />
                    <div className="border-r border-[#86678a]/10" />
                    <div className="border-r border-[#86678a]/10" />
                    <div />
                  </div>

                  <div className="schedule-event absolute bottom-1.5 left-[72%] top-1.5 flex w-[20%] items-center rounded-lg px-2 text-[10px] font-semibold text-white shadow-sm">
                    Dinner
                  </div>

                </div>

              </div>


              {/* FREE */}

              <div className="mt-5 grid grid-cols-[72px_1fr] items-center gap-3">

                <p className="text-sm font-semibold text-[#66725f]">
                  Free
                </p>

                <div className="relative h-10 overflow-hidden rounded-xl border border-[#a9b59f]/20 bg-white/65">

                  <div className="absolute inset-0 grid grid-cols-5">
                    <div className="border-r border-[#a9b59f]/15" />
                    <div className="border-r border-[#a9b59f]/15" />
                    <div className="border-r border-[#a9b59f]/15" />
                    <div className="border-r border-[#a9b59f]/15" />
                    <div />
                  </div>

                  <div className="schedule-free absolute bottom-1.5 left-[0%] top-1.5 w-[30%] rounded-lg" />

                  <div className="schedule-free absolute bottom-1.5 left-[92%] top-1.5 w-[8%] rounded-lg" />

                </div>

              </div>


              {/* Bottom suggestion */}

              <div className="mt-7 rounded-2xl border border-[#a9b59f]/25 bg-[#f5f7f2]/80 p-4">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#78866f]">
                      Everyone is free
                    </p>

                    <p className="mt-1 font-semibold text-[#4b5546]">
                      1:00 PM – 3:30 PM
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-[#718067] shadow-sm">
                    Best match
                  </div>

                </div>

              </div>

            </div>


            {/* Floating blossom card */}

            <div className="sakura-card absolute -bottom-7 -left-5 hidden items-center gap-3 px-4 py-3 sm:flex">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fbe8ed] text-[#b9687d]">
                ✿
              </div>

              <div>
                <p className="text-xs text-[#8c7c82]">
                  Plans made easy
                </p>

                <p className="text-sm font-semibold text-[#4a4044]">
                  Less coordinating
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* LOWER FEATURE STRIP */}
        {/* ================================================= */}

        <div className="mt-24 grid gap-4 sm:grid-cols-3">

          <div className="sakura-card p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbe8ed] text-lg text-[#b9687d]">
              ◷
            </div>

            <h3 className="sakura-title mt-5 text-xl font-semibold">
              Share availability
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#74676d]">
              Add the times you&apos;re busy and let
              NoClash handle the comparison.
            </p>

          </div>


          <div className="sakura-card p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6ebdf] text-lg text-[#708067]">
              ✓
            </div>

            <h3 className="sakura-title mt-5 text-xl font-semibold">
              Find the overlap
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#74676d]">
              Search one day or many and instantly see
              when the entire group is available.
            </p>

          </div>


          <div className="sakura-card p-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee6ef] text-lg text-[#725576]">
              ✦
            </div>

            <h3 className="sakura-title mt-5 text-xl font-semibold">
              Turn it into a plan
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#74676d]">
              Schedule shared events directly from an
              available time without leaving the group.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}