"use client";

import { useEffect } from "react";
import { persistClientSession, readClientSessionToken } from "@/lib/session-client";

export function SessionBootstrap() {
  useEffect(() => {
    const token = readClientSessionToken();
    if (token) persistClientSession(token);
  }, []);
  return null;
}
