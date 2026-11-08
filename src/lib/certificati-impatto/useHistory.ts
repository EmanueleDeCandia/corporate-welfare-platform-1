import { useCallback, useRef, useState } from "react";
import type { Doc } from "./types";

interface H { past: Doc[]; present: Doc; future: Doc[] }

/** Stato documento con undo/redo e coalescenza dei gesti continui (drag, digitazione, slider). */
export function useDocHistory(initial: Doc) {
  const [state, setState] = useState<H>({ past: [], present: initial, future: [] });
  const ref = useRef(state);
  const last = useRef<{ key: string; t: number } | null>(null);

  const commit = (s: H) => {
    ref.current = s;
    setState(s);
  };

  const update = useCallback((fn: (d: Doc) => Doc, key?: string) => {
    const s = ref.current;
    const next = fn(s.present);
    if (next === s.present) return;
    const now = Date.now();
    const merge = !!key && !!last.current && last.current.key === key && now - last.current.t < 900;
    last.current = key ? { key, t: now } : null;
    if (merge) commit({ ...s, present: next, future: [] });
    else commit({ past: [...s.past.slice(-80), s.present], present: next, future: [] });
  }, []);

  const endGesture = useCallback(() => { last.current = null; }, []);

  const undo = useCallback(() => {
    const s = ref.current;
    if (!s.past.length) return;
    last.current = null;
    commit({ past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] });
  }, []);

  const redo = useCallback(() => {
    const s = ref.current;
    if (!s.future.length) return;
    last.current = null;
    commit({ past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) });
  }, []);

  const reset = useCallback((d: Doc) => {
    last.current = null;
    commit({ past: [], present: d, future: [] });
  }, []);

  return { doc: state.present, update, undo, redo, reset, endGesture, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
