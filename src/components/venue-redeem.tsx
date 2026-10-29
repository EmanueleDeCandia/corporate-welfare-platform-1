"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VenueOffering, vouchers } from "@/db/schema";
import { voucherTypeLabel } from "@/lib/utils";

export function VenueRedeem({
  vouchers: items,
  venueId,
  offerings,
}: {
  vouchers: Array<typeof vouchers.$inferSelect>;
  venueId: number;
  offerings: VenueOffering[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [voucherId, setVoucherId] = useState(items[0]?.id ?? 0);
  const selected = items.find((item) => item.id === voucherId) ?? items[0];
  const compatible = offerings.filter(
    (item) => item.active && item.acceptsWelfare && item.benefitType === selected?.benefitType,
  );
  const [offeringId, setOfferingId] = useState(compatible[0]?.id ?? 0);
  const [serviceDate, setServiceDate] = useState("");

  if (items.length === 0) {
    return (
      <p className="mt-4 text-sm text-cream/70">
        Non hai voucher compatibili da selezionare. Controlla il portafoglio o paga come ospite.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <select
        value={voucherId}
        onChange={(event) => setVoucherId(Number(event.target.value))}
        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id} className="text-ink">
            {voucherTypeLabel(item.benefitType)} · {item.origin} · {item.status}
          </option>
        ))}
      </select>
      <select
        value={offeringId}
        onChange={(event) => setOfferingId(Number(event.target.value))}
        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm"
      >
        {compatible.map((item) => (
          <option key={item.id} value={item.id} className="text-ink">
            {item.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={serviceDate}
        onChange={(event) => setServiceDate(event.target.value)}
        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm"
      />
      <button
        type="button"
        disabled={pending || !offeringId || !serviceDate}
        onClick={async () => {
          setPending(true);
          setMessage("");
          const response = await fetch("/api/vouchers/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voucherId, venueId, offeringId, serviceDate }),
          });
          const data = (await response.json()) as { error?: string; message?: string };
          setPending(false);
          setMessage(data.message ?? data.error ?? "");
          if (response.ok) router.refresh();
        }}
        className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold uppercase tracking-[0.14em]"
      >
        {pending ? "Selezione…" : "Seleziona (addebito impresa)"}
      </button>
      {message ? <p className="text-sm text-gold">{message}</p> : null}
    </div>
  );
}
