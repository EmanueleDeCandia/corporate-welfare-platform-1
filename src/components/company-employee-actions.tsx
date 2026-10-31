"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/session-client";
import type { User } from "@/db/schema";

export function AddEmployeeForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function addEmployee() {
    setPending(true);
    setMessage("");
    const response = await apiFetch("/api/company/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setMessage(payload.message ?? payload.error ?? "");
    if (response.ok) {
      setForm({ firstName: "", lastName: "", email: "" });
      router.refresh();
    }
  }

  return (
    <section className="rounded-[28px] border border-forest/10 bg-white p-6">
      <h2 className="font-serif text-2xl text-forest">Aggiungi dipendente</h2>
      <p className="text-xs text-olive">Vengono emessi subito 1 pernottamento + 1 cena sul piano attivo. Password demo: radici2026.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input placeholder="Nome" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm" />
        <input placeholder="Cognome" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm" />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-2xl border border-forest/10 bg-cream px-3 py-2 text-sm" />
        <button type="button" disabled={pending} onClick={addEmployee} className="rounded-2xl bg-forest px-4 py-2 text-sm text-cream">
          Emetti 1+1
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
    </section>
  );
}

export function ExtraAllocationForm({
  overnightAllowed,
  dinnerAllowed,
  overnightRemaining,
  dinnerRemaining,
  extraWindowOpen,
  extraOpensOn,
  overnightEligible,
  dinnerEligible,
}: {
  overnightAllowed: boolean;
  dinnerAllowed: boolean;
  overnightRemaining: number;
  dinnerRemaining: number;
  extraWindowOpen: boolean;
  extraOpensOn: string;
  overnightEligible: User[];
  dinnerEligible: User[];
}) {
  const router = useRouter();
  const [extraType, setExtraType] = useState<"overnight" | "dinner">("overnight");
  const [extraIds, setExtraIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const eligible = extraType === "overnight" ? overnightEligible : dinnerEligible;
  const extraAllowed = extraType === "overnight" ? overnightAllowed : dinnerAllowed;
  const extraRemaining = extraType === "overnight" ? overnightRemaining : dinnerRemaining;

  async function allocateExtra() {
    setPending(true);
    setMessage("");
    const response = await apiFetch("/api/company/extra-allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benefitType: extraType, userIds: extraIds }),
    });
    const payload = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    setMessage(payload.message ?? payload.error ?? "");
    if (response.ok) {
      setExtraIds([]);
      router.refresh();
    }
  }

  return (
    <section className="rounded-[28px] border border-forest/10 bg-white p-6">
      <h2 className="font-serif text-2xl text-forest">Riassegnazione extra da residui</h2>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setExtraType("overnight");
            setExtraIds([]);
          }}
          className={`rounded-full px-3 py-1 text-xs ${extraType === "overnight" ? "bg-forest text-cream" : "bg-cream"}`}
        >
          Pernottamenti
        </button>
        <button
          type="button"
          onClick={() => {
            setExtraType("dinner");
            setExtraIds([]);
          }}
          className={`rounded-full px-3 py-1 text-xs ${extraType === "dinner" ? "bg-forest text-cream" : "bg-cream"}`}
        >
          Cene
        </button>
      </div>
      <p className="mt-2 text-xs text-olive">
        {extraAllowed
          ? `Finestra extra aperta. Puoi assegnare fino a ${extraRemaining} voucher (20% dei residui) a chi ha già usato il proprio.`
          : !extraWindowOpen
            ? `Chiusa fino al ${extraOpensOn}: prima ogni addetto resta su 1 pernottamento e 1 cena.`
            : "Chiusa: i non selezionati sono sotto il 20%, oppure il tetto sui residui è esaurito."}
      </p>
      <div className="mt-3 space-y-2">
        {eligible.map((user) => (
          <label key={user.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={extraIds.includes(user.id)}
              onChange={(event) =>
                setExtraIds((current) =>
                  event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id),
                )
              }
            />
            {user.firstName} {user.lastName}
          </label>
        ))}
        {eligible.length === 0 ? (
          <p className="text-sm text-olive">
            Nessun addetto ha ancora terminato il voucher base di questo tipo, oppure ha già ricevuto l&apos;extra.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={!extraAllowed || extraIds.length === 0 || pending}
        onClick={allocateExtra}
        className="mt-4 rounded-full bg-terracotta px-4 py-2 text-xs font-semibold uppercase text-cream disabled:bg-mist disabled:text-olive"
      >
        Assegna extra
      </button>
      {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
    </section>
  );
}
