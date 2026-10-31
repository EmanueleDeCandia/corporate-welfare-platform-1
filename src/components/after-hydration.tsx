"use client";

import { useEffect, useState, type ReactNode } from "react";

/** First paint is identical on server and client; real UI mounts after hydrate. */
export function AfterHydration({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    // `null` is a valid "render nothing" fallback: only `undefined` uses the default box.
    // This keeps the server HTML identical to the client's first render (no hydration mismatch).
    return fallback !== undefined ? (
      fallback
    ) : (
      <div className="min-h-[16rem] rounded-[28px] bg-white" aria-hidden="true" />
    );
  }
  return children;
}
