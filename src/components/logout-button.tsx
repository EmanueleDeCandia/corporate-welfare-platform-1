"use client";

import { apiFetch, clearClientSession } from "@/lib/session-client";

async function leave() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearClientSession();
    window.location.replace("/login");
  }
}

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => void leave()}>
      Esci
    </button>
  );
}
