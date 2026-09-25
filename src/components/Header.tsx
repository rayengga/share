"use client";

import Link from "next/link";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useUnread } from "./UnreadProvider";

export function Header({ userName }: { userName: string }) {
  const { total } = useUnread();

  useEffect(() => {
    const desired = total > 0 ? `(${total}) Shared Files` : "Shared Files";
    document.title = desired;

    // Next's App Router manages <title> declaratively from the static
    // metadata export and can replace the whole <title> element (not just
    // its text) on its own re-renders, silently overwriting our assignment
    // above. Watch the entire <head> subtree and re-assert our value
    // whenever that happens.
    const observer = new MutationObserver(() => {
      if (document.title !== desired) {
        document.title = desired;
      }
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [total]);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span>📂 Shared Files</span>
          {total > 0 && (
            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {total}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="hidden sm:inline">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
