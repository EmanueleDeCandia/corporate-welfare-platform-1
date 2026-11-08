import { useEffect, useMemo, useRef, useState } from "react";
import { CertificateSVG, colorOf, layerText } from "./CertificateSVG";
import { FONTS, FORMAT_BY_ID } from "@/lib/certificati-impatto/constants";
import { layerSize } from "@/lib/certificati-impatto/text";
import type { Doc, Layer } from "@/lib/certificati-impatto/types";

interface Props {
  doc: Doc;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPatch: (id: string, patch: Partial<Layer>, key?: string) => void;
  onEndGesture: () => void;
  grid: boolean;
  safe: boolean;
  zoom: number;
}

type Mode = "move" | "e" | "se" | "rot";

export function Canvas({ doc, selectedId, onSelect, onPatch, onEndGesture, grid, safe, zoom }: Props) {
  const fm = FORMAT_BY_ID[doc.design.format];
  const { w: W, h: H } = fm;
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(600);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    setAvail(el.clientWidth);
    const onR = () => setVh(window.innerHeight);
    window.addEventListener("resize", onR);
    return () => { ro.disconnect(); window.removeEventListener("resize", onR); };
  }, []);

  const maxH = Math.max(380, vh * 0.68);
  const fit = Math.min(avail - 4, (maxH * W) / H);
  const dw = fit * zoom;
  const s = dw / W;
  const dh = H * s;

  const boxes = useMemo(
    () => doc.layers.map((l) => ({ l, ...layerSize(l, layerText(doc, l)) })),
    [doc]
  );
  const docRef = useRef(doc);
  docRef.current = doc;

  const startGesture = (e: React.PointerEvent, l: Layer, mode: Mode) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(l.id);
    if (l.locked) return;
    const start = { px: e.clientX, py: e.clientY, x: l.x, y: l.y, w: l.w, h: l.h, size: l.size, rot: l.rot };
    const rect = stageRef.current!.getBoundingClientRect();
    const cx = rect.left + l.x * dw, cy = rect.top + l.y * dh;
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const key = `g-${l.id}-${mode}`;
    const me = boxes.find((b) => b.l.id === l.id)!;
    const others = boxes.filter((b) => b.l.id !== l.id && !b.l.hidden && b.l.role !== "panel");

    const move = (ev: PointerEvent) => {
      if (mode === "move") {
        let nx = start.x + (ev.clientX - start.px) / dw;
        let ny = start.y + (ev.clientY - start.py) / dh;
        if (ev.shiftKey) {
          if (Math.abs(ev.clientX - start.px) > Math.abs(ev.clientY - start.py)) ny = start.y;
          else nx = start.x;
        }
        const g: { x?: number; y?: number } = {};
        if (!ev.altKey) {
          const thr = 7 / s;
          const tx = [W / 2, W * 0.05, W * 0.95], ty = [H / 2, H * 0.05, H * 0.95];
          for (const o of others) {
            const ox = o.l.x * W, oy = o.l.y * H;
            tx.push(ox, ox - o.w / 2, ox + o.w / 2);
            ty.push(oy, oy - o.h / 2, oy + o.h / 2);
          }
          const best = (pos: number, size: number, targets: number[]) => {
            let bd = thr + 1, bs = 0, bt = 0;
            for (const off of [-size / 2, 0, size / 2])
              for (const t of targets) {
                const d = t - (pos + off);
                if (Math.abs(d) < Math.abs(bd)) { bd = d; bs = d; bt = t; }
              }
            return Math.abs(bd) <= thr ? { shift: bs, line: bt } : null;
          };
          const bx = best(nx * W, me.w, tx);
          const by = best(ny * H, me.h, ty);
          if (bx) { nx += bx.shift / W; g.x = bx.line; }
          if (by) { ny += by.shift / H; g.y = by.line; }
        }
        setGuides(g);
        onPatch(l.id, { x: nx, y: ny }, key);
      } else if (mode === "e") {
        const a = (start.rot * Math.PI) / 180;
        const dx = ((ev.clientX - start.px) * Math.cos(a) + (ev.clientY - start.py) * Math.sin(a)) / s;
        onPatch(l.id, { w: Math.max(30, start.w + dx * 2) }, key);
      } else if (mode === "se") {
        const k = Math.min(8, Math.max(0.1, Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0));
        const patch: Partial<Layer> = { w: Math.max(16, start.w * k) };
        if (start.h !== undefined) patch.h = Math.max(4, start.h * k);
        if (start.size !== undefined) patch.size = Math.max(6, Math.round(start.size * k * 10) / 10);
        onPatch(l.id, patch, key);
      } else {
        let ang = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
        ang = ((ang + 540) % 360) - 180;
        const snap = Math.round(ang / 45) * 45;
        if (ev.shiftKey || Math.abs(ang - snap) < 4) ang = snap;
        onPatch(l.id, { rot: Math.round(ang * 10) / 10 }, key);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setGuides({});
      onEndGesture();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const editLayer = editing ? doc.layers.find((l) => l.id === editing) : null;
  const sel = selectedId ? boxes.find((b) => b.l.id === selectedId) : null;

  return (
    <div ref={hostRef} className="w-full overflow-auto rounded-2xl bg-[radial-gradient(circle,_#d6d3c8_1px,_transparent_1px)] [background-size:16px_16px] bg-stone-200/70 p-2">
      <div className="mx-auto" style={{ width: dw + 4 }}>
        <div
          ref={stageRef}
          className="relative mx-auto select-none shadow-2xl ring-1 ring-black/10"
          style={{ width: dw, height: dh, touchAction: "none" }}
          onPointerDown={() => { onSelect(null); setEditing(null); }}
        >
          <CertificateSVG doc={doc} hideId={editing} />

          {grid && (
            <div className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage: "linear-gradient(to right, #f43f5e55 1px, transparent 1px), linear-gradient(to bottom, #f43f5e55 1px, transparent 1px)",
                backgroundSize: `${dw / 12}px ${dw / 12}px`,
              }} />
          )}
          {safe && (
            doc.design.format === "story" ? (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-end justify-center border-b border-dashed border-sky-500 bg-sky-500/15 text-[10px] font-semibold text-sky-700" style={{ height: (250 / H) * dh }}>zona UI Stories</div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-start justify-center border-t border-dashed border-sky-500 bg-sky-500/15 text-[10px] font-semibold text-sky-700" style={{ height: (340 / H) * dh }}>zona risposta / CTA</div>
              </>
            ) : (
              <div className="pointer-events-none absolute border border-dashed border-sky-500" style={{ inset: dw * 0.05 }}>
                <span className="absolute -top-4 left-0 rounded bg-sky-500 px-1 text-[9px] font-semibold text-white">area sicura</span>
              </div>
            )
          )}

          {boxes.map(({ l, w, h }) => {
            if (l.hidden) return null;
            const isSel = l.id === selectedId;
            if (l.locked && !isSel) return null;
            const bw = Math.max(w * s, 12), bh = Math.max(h * s, 12);
            return (
              <div
                key={l.id}
                onPointerDown={(e) => startGesture(e, l, "move")}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (l.kind === "text" && !l.locked) setEditing(l.id);
                }}
                className={`absolute ${l.locked ? "" : "cursor-move"} ${isSel ? "outline outline-2 outline-offset-2 outline-sky-500" : "hover:outline hover:outline-1 hover:outline-sky-400/80"}`}
                style={{
                  left: l.x * dw - bw / 2, top: l.y * dh - bh / 2, width: bw, height: bh,
                  transform: `rotate(${l.rot}deg)`, pointerEvents: l.locked ? "none" : "auto",
                }}
                title={l.name}
              >
                {isSel && !l.locked && (
                  <>
                    <div className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-sky-500" />
                    <div onPointerDown={(e) => startGesture(e, l, "rot")}
                      className="absolute -top-11 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-sky-500 bg-white text-[10px] text-sky-600 shadow" title="Ruota (Shift = scatti di 45°)">↻</div>
                    {l.kind !== "symbol" && l.kind !== "qr" && l.kind !== "sticker" && (
                      <div onPointerDown={(e) => startGesture(e, l, "e")}
                        className="absolute -right-2 top-1/2 h-5 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm border-2 border-sky-500 bg-white shadow" title="Larghezza" />
                    )}
                    <div onPointerDown={(e) => startGesture(e, l, "se")}
                      className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-sky-500 bg-white shadow" title="Ridimensiona" />
                    <div className="pointer-events-none absolute -bottom-6 left-0 whitespace-nowrap rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {l.name}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {guides.x !== undefined && <div className="pointer-events-none absolute top-0 h-full w-px bg-fuchsia-500" style={{ left: guides.x * s }} />}
          {guides.y !== undefined && <div className="pointer-events-none absolute left-0 h-px w-full bg-fuchsia-500" style={{ top: guides.y * s }} />}

          {editLayer && sel && (
            <textarea
              autoFocus
              value={editLayer.text}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onPatch(editLayer.id, { text: e.target.value }, "txt-" + editLayer.id)}
              onBlur={() => { setEditing(null); onEndGesture(); }}
              onKeyDown={(e) => { if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur(); e.stopPropagation(); }}
              className="absolute resize-none overflow-hidden rounded bg-white/70 outline outline-2 outline-sky-500"
              style={{
                left: editLayer.x * dw - Math.max(sel.w * s, 12) / 2,
                top: editLayer.y * dh - Math.max(sel.h * s, 12) / 2 - 4,
                width: Math.max(sel.w * s, 60),
                height: Math.max(sel.h * s, 24) + 8,
                transform: `rotate(${editLayer.rot}deg)`,
                fontFamily: FONTS[editLayer.font ?? "sans"].css,
                fontSize: (editLayer.size ?? 32) * s,
                fontWeight: editLayer.weight ?? 400,
                fontStyle: editLayer.italic ? "italic" : "normal",
                textAlign: editLayer.align ?? "center",
                lineHeight: editLayer.lh ?? 1.15,
                letterSpacing: (editLayer.ls ?? 0) * s,
                textTransform: editLayer.caps ? "uppercase" : "none",
                color: colorOf(editLayer.color, doc.design),
                padding: 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
