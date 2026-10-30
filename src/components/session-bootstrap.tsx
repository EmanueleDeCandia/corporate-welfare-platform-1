"use client";

import { useEffect } from "react";
import { installClientSession } from "@/lib/session-client";

installClientSession();

export function SessionBootstrap() {
  useEffect(() => {
    installClientSession();
  }, []);
  return null;
}
