"use client";

import { useEffect } from "react";
import { persistClientSession, readClientSessionToken } from "@/lib/session-client";

export function SessionBootstrap() {
  useEffect(() => {
    const token = readClientSessionToken();
    if (!token) return;
    persistClientSession(token);

    const url = new URL(window.location.href);
    if (!url.searchParams.has("sid")) return;
    url.searchParams.delete("sid");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
  }, []);
  return null;
}
