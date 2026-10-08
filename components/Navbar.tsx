import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold text-blue-600"
        >
          NoClash
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="font-medium text-gray-600 hover:text-gray-900"
          >
            Log in
          </Link>

          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}