"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type UnreadSummary = {
  total: number;
  byCategory: Record<number, number>;
};

type UnreadContextValue = UnreadSummary & {
  refresh: () => void;
};

const UnreadContext = createContext<UnreadContextValue | null>(null);

const POLL_INTERVAL_MS = 10_000;

export function UnreadProvider({
  initial,
  children,
}: {
  initial: UnreadSummary;
  children: React.ReactNode;
}) {
  const [summary, setSummary] = useState<UnreadSummary>(initial);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/unread-count", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as UnreadSummary;
        setSummary(data);
      }
    } catch {
      // ignore transient network errors, next poll will retry
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  return (
    <UnreadContext.Provider value={{ ...summary, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error("useUnread must be used within UnreadProvider");
  return ctx;
}
