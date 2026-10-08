import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <p className="mb-4 text-lg font-semibold text-blue-600">
        NoClash
      </p>

      <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-gray-900">
        Find a time that works for everyone.
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-gray-600">
        Share your availability with friends, find when everyone is free,
        and schedule events without the endless group chat.
      </p>

      <div className="mt-10 flex gap-4">
        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Get Started
        </Link>

        <button className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50">
          Learn More
        </button>
      </div>
    </section>
  );
}