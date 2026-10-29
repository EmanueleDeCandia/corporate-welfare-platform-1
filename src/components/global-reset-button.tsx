"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function GlobalResetButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    const ok = confirm(
      "Vuoi ripristinare i dati demo di TUTTO il sistema?\nTutti i voucher di tutti i dipendenti torneranno disponibili e azzerati per nuovi test."
    );
    if (!ok) return;

    setResetting(true);
    try {
      const res = await fetch("/api/vouchers/reset-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore nel reset demo.");
      } else {
        alert("Dati demo ripristinati per tutti con successo!");
        router.refresh();
        window.location.reload();
      }
    } catch {
      alert("Errore di rete durante il ripristino.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={resetting}
      className={`inline-flex items-center gap-1.5 transition disabled:opacity-50 ${className}`}
      title="Ripristina i dati demo di tutti i voucher e dipendenti"
    >
      <RotateCcw size={12} className={resetting ? "animate-spin" : ""} />
      <span>{resetting ? "Ripristino in corso..." : "Ripristina Dati Demo (Tutti)"}</span>
    </button>
  );
}
