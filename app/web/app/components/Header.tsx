"use client";

import { signOut, useSession } from "next-auth/react";

export default function Header({
  expanded,
  setExpanded,
}: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center">
        <button
          className="mr-3 p-2 focus:outline-none hover:bg-gray-200 rounded"
          aria-label="Toggle sidebar"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Hamburger icon */}
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <rect y="4" width="24" height="2" rx="1" fill="#111" />
            <rect y="11" width="24" height="2" rx="1" fill="#111" />
            <rect y="18" width="24" height="2" rx="1" fill="#111" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          INTERCEPT<span className="text-sky-500">RX</span>
        </h1>
      </div>
      <div className="flex items-center">
        <button
          className="text-center ml-4 px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600 transition mr-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Logout
        </button>
        <h1 className="text-gray-900 pr-3">
          {session?.user?.email ? session.user.email : "Not Signed In"}
        </h1>
      </div>
    </header>
  );
}
