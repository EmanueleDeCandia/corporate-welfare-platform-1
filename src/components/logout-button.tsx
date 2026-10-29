"use client";

import { useRouter } from "next/navigation";
import { clearClientSession } from "@/lib/session-client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } finally {
          clearClientSession();
          router.push("/");
          router.refresh();
        }
      }}
    >
      Esci
    </button>
  );
}
