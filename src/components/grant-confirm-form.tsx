"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GrantConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function respond(response: "confirmed" | "declined") {
    setPending(true);
    const res = await fetch(`/api/grants/confirm/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    const data = (await res.json()) as { error?: string; message?: string };
    setPending(false);
    setMessage(data.message ?? data.error ?? "");
    if (res.ok) setTimeout(() => router.push("/account"), 1200);
  }

  return (
    <div>
      <div className="mt-6 flex gap-3">
        <button type="button" disabled={pending} onClick={() => respond("confirmed")} className="rounded-full bg-forest px-5 py-2.5 text-sm text-cream">
          Confermo
        </button>
        <button type="button" disabled={pending} onClick={() => respond("declined")} className="rounded-full border px-5 py-2.5 text-sm">
          Rinuncio
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-forest">{message}</p> : null}
    </div>
  );
}
