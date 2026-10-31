"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/session-client";

export function ProviderCheckin({
  kind,
  id,
  venueId,
  status,
}: {
  kind: "selection" | "grant";
  id: number;
  venueId: number;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const already = status === "attended" || status === "no_show";

  async function mark(next: "attended" | "no_show") {
    setPending(true);
    const response = await apiFetch("/api/provider/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        kind === "grant"
          ? { kind: "grant", grantId: id, status: next, venueId }
          : { kind: "selection", selectionId: id, status: next, venueId },
      ),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setMessage(data.message ?? data.error ?? "");
    if (response.ok) router.refresh();
  }

  if (already) {
    return <p className="mt-4 text-sm text-forest">Presenza già registrata: {status}.</p>;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button type="button" disabled={pending} onClick={() => mark("attended")} className="rounded-full bg-forest px-4 py-2 text-xs uppercase tracking-wider text-cream">
        Presente
      </button>
      <button type="button" disabled={pending} onClick={() => mark("no_show")} className="rounded-full border border-forest/20 px-4 py-2 text-xs uppercase tracking-wider">
        Non presentato
      </button>
      {message ? <p className="w-full text-sm text-olive">{message}</p> : null}
    </div>
  );
}
