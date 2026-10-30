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
    return (
      fallback ?? <div className="min-h-[16rem] rounded-[28px] bg-white" aria-hidden="true" />
    );
  }
  return children;
}
