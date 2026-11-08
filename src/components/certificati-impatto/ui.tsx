import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---- Toast ----------------------------------------------------------------
interface T { id: number; msg: string; kind: "ok" | "warn" | "err" }
const listeners = new Set<(t: T) => void>();
let tid = 0;
export function toast(msg: string, kind: T["kind"] = "ok") {
  const t = { id: ++tid, msg, kind };
  listeners.forEach((l) => l(t));
}
export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const l = (t: T) => {
      setItems((x) => [...x.slice(-3), t]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 3800);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id}
          className={cn("pointer-events-auto max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl",
            t.kind === "ok" && "bg-emerald-900 text-emerald-50", t.kind === "warn" && "bg-amber-500 text-amber-950", t.kind === "err" && "bg-rose-700 text-white")}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ---- Primitive ------------------------------------------------------------
export function Btn({ variant = "ghost", size = "md", className, ...p }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" | "danger" | "dark"; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" && "px-2.5 py-1.5 text-xs", size === "md" && "px-3.5 py-2 text-sm", size === "lg" && "px-5 py-3 text-base",
        variant === "primary" && "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 active:scale-[.98]",
        variant === "dark" && "bg-stone-900 text-white hover:bg-stone-700",
        variant === "ghost" && "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50",
        variant === "soft" && "bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
        variant === "danger" && "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
        className
      )}
    />
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
        {hint && <span className="font-normal normal-case tracking-normal text-stone-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25";

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-800">{title}</h3>
        {aside}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Chip({ active, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...p}
      className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition",
        active ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400", p.className)}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 backdrop-blur-sm" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className={cn("max-h-[94vh] w-full overflow-auto rounded-2xl bg-white shadow-2xl", wide ? "max-w-5xl" : "max-w-xl")} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast("Copiato negli appunti");
}
