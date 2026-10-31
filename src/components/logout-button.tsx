"use client";

import { logoutClient } from "@/lib/session-client";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void logoutClient();
      }}
    >
      Esci
    </button>
  );
}
