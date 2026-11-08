import { memo, useId } from "react";
import { STYLE_BY_ID } from "@/lib/certificati-impatto/constants";
import { darken, lighten, mix, rotateHue } from "@/lib/certificati-impatto/color";
import { rng, type Rng } from "@/lib/certificati-impatto/rng";
import type { Doc, StyleId } from "@/lib/certificati-impatto/types";

const f = (n: number) => Math.round(n * 10) / 10;

export function getPalette(d: Doc["design"]): string[] {
  if (d.master) return STYLE_BY_ID[d.style].palette;
  return [d.accent, rotateHue(d.accent, 50), rotateHue(d.accent, 180), mix(d.accent, d.text, 0.5), mix(d.accent, d.bg, 0.55)];
}

/** Curva chiusa liscia attraverso i punti (midpoint quadratic). */
function smooth(pts: [number, number][]) {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${f(mid(pts[n - 1], pts[0])[0])} ${f(mid(pts[n - 1], pts[0])[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + "Z";
}

function blob(cx: number, cy: number, r: number, lobes: number, phase: number, amp: number, rot = 0) {
  const pts: [number, number][] = [];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const rr = r * (1 + amp * Math.sin(lobes * t + phase) + amp * 0.35 * Math.sin((lobes + 2) * t + phase * 2));
    pts.push([cx + Math.cos(t + rot) * rr, cy + Math.sin(t + rot) * rr]);
  }
  return smooth(pts);
}

interface P { W: number; H: number; bg: string; text: string; accent: string; pal: string[]; r: Rng; id: string }

// ---------------------------------------------------------------- Picasso ----
function Picasso({ W, H, bg, text, pal, r }: P) {
  const cols = 6, rows = Math.max(5, Math.round((H / W) * 6));
  const cw = W / cols, ch = H / rows;
  const pts: [number, number][][] = [];
  for (let j = 0; j <= rows; j++) {
    pts.push([]);
    for (let i = 0; i <= cols; i++) {
      const jx = i === 0 || i === cols ? 0 : r.range(-0.32, 0.32) * cw;
      const jy = j === 0 || j === rows ? 0 : r.range(-0.32, 0.32) * ch;
      pts[j].push([i * cw + jx, j * ch + jy]);
    }
  }
  const tris: React.ReactNode[] = [];
  let k = 0;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
      const polys = r.chance(0.5) ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const p of polys) {
        const col = r.pick(pal);
        tris.push(
          <polygon key={k++} points={p.map((q) => `${f(q[0])},${f(q[1])}`).join(" ")}
            fill={r.chance(0.35) ? mix(bg, col, 0.35) : r.chance(0.5) ? lighten(col, r.range(0, 0.4)) : darken(col, r.range(0, 0.2))}
            stroke={text} strokeWidth={2.5} strokeLinejoin="round" />
        );
      }
    }
  return (
    <g>
      {tris}
      {Array.from({ length: 5 }, (_, i) => {
        const cx = r.range(0, W), cy = r.range(0, H), rad = r.range(40, 130);
        return <path key={i} d={`M${f(cx - rad)} ${f(cy)}A${f(rad)} ${f(rad)} 0 0 1 ${f(cx + rad)} ${f(cy)}`} fill="none" stroke={text} strokeWidth={4} />;
      })}
      {Array.from({ length: 14 }, (_, i) => {
        const x = r.range(0, W), y = r.range(0, H), l = r.range(40, 140), a = r.range(0, Math.PI);
        return <line key={i} x1={f(x)} y1={f(y)} x2={f(x + Math.cos(a) * l)} y2={f(y + Math.sin(a) * l)} stroke={text} strokeWidth={r.range(1.5, 4)} />;
      })}
    </g>
  );
}

// ---------------------------------------------------------------- Cézanne ----
function Cezanne({ W, H, bg, pal, r, id }: P) {
  const bands = 5;
  const out: React.ReactNode[] = [];
  const strokes: Record<string, string> = {};
  for (let b = 0; b < bands; b++) {
    const base = H * (0.3 + (0.7 / bands) * b);
    const n = 9;
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) pts.push([(i / n) * W, base + r.range(-0.05, 0.05) * H - Math.sin((i / n) * Math.PI * (1 + b * 0.4) + b) * H * 0.04]);
    let d = `M0 ${H}L${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1], [x, y] = pts[i];
      d += `Q${f((px + x) / 2)} ${f(py - 20)} ${f(x)} ${f(y)}`;
    }
    d += `L${W} ${H}Z`;
    const col = [pal[4], pal[3], pal[0], pal[2], pal[1]][b % 5];
    out.push(<path key={"b" + b} d={d} fill={mix(bg, col, 0.8)} />);
    const sc = [lighten(col, 0.25), darken(col, 0.2), col, mix(col, pal[2], 0.4)];
    const strokesN = Math.round((W * H) / 9000);
    for (let s = 0; s < strokesN; s++) {
      const x = r.range(0, W);
      const y = base + r.range(-10, (H * 0.7) / bands + 30);
      if (y > H) continue;
      const a = r.range(-0.9, -0.3), l = r.range(14, 36);
      const key = sc[s % sc.length];
      strokes[key + b] = (strokes[key + b] ?? "") + `M${f(x)} ${f(y)}l${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}`;
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(bg, pal[4], 0.55)} />
          <stop offset="1" stopColor={bg} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      {out}
      {Object.entries(strokes).map(([k, d]) => (
        <path key={k} d={d} stroke={k.slice(0, 7)} strokeWidth={7} strokeLinecap="round" opacity={0.5} fill="none" />
      ))}
      <circle cx={W * 0.82} cy={H * 0.16} r={W * 0.06} fill={lighten(pal[0], 0.55)} opacity={0.9} />
    </g>
  );
}

// ---------------------------------------------------------------- Schiele ----
function Schiele({ W, H, pal, text, r }: P) {
  const jag = (x1: number, y1: number, x2: number, y2: number, seg: number, amp: number) => {
    let d = `M${f(x1)} ${f(y1)}`;
    for (let i = 1; i <= seg; i++) {
      const t = i / seg;
      d += `L${f(x1 + (x2 - x1) * t + r.range(-amp, amp))} ${f(y1 + (y2 - y1) * t + r.range(-amp, amp))}`;
    }
    return d;
  };
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const side = r.int(0, 3);
    const x1 = side === 0 ? 0 : side === 1 ? W : r.range(0, W);
    const y1 = side === 2 ? 0 : side === 3 ? H : r.range(0, H);
    const x2 = r.range(0, W), y2 = r.range(0, H);
    const col = i % 5 === 0 ? pal[0] : i % 7 === 0 ? pal[3] : text;
    lines.push(
      <path key={i} d={jag(x1, y1, x2, y2, r.int(5, 11), r.range(10, 40))} fill="none" stroke={col}
        strokeWidth={r.chance(0.3) ? r.range(5, 9) : r.range(1.2, 3)} strokeLinecap="round" strokeLinejoin="miter"
        strokeDasharray={r.chance(0.25) ? `${r.int(20, 80)} ${r.int(8, 24)}` : undefined} opacity={0.9} />
    );
  }
  const washes = Array.from({ length: 5 }, (_, i) => {
    const cx = r.range(0, W), cy = r.range(0, H), n = 7;
    const p = Array.from({ length: n }, (_, k) => {
      const t = (k / n) * Math.PI * 2;
      const rr = r.range(90, 230);
      return `${f(cx + Math.cos(t) * rr)},${f(cy + Math.sin(t) * rr)}`;
    }).join(" ");
    return <polygon key={i} points={p} fill={[pal[2], pal[0], pal[3], pal[4], pal[2]][i]} opacity={0.2} />;
  });
  return <g>{washes}{lines}</g>;
}

// ------------------------------------------------------------------- Miró ----
function Miro({ W, H, pal, r, text }: P) {
  const els: React.ReactNode[] = [];
  const [red, blue, yellow, black, green] = pal;
  for (let i = 0; i < 16; i++) {
    const x = r.range(0, W), y = r.range(0, H);
    const t = i % 8;
    const s = r.range(0.7, 1.4);
    if (t === 0) els.push(<circle key={i} cx={f(x)} cy={f(y)} r={f(70 * s)} fill={red} />);
    else if (t === 1)
      els.push(<path key={i} d={`M${f(x)} ${f(y)}c${f(60 * s)} ${f(-90 * s)} ${f(130 * s)} ${f(90 * s)} ${f(200 * s)} 0s${f(100 * s)} ${f(-80 * s)} ${f(160 * s)} ${f(20 * s)}`} fill="none" stroke={black} strokeWidth={5} strokeLinecap="round" />);
    else if (t === 2)
      els.push(<g key={i} stroke={black} strokeWidth={4} strokeLinecap="round">{[0, 60, 120].map((a) => <line key={a} x1={f(x - Math.cos((a * Math.PI) / 180) * 34 * s)} y1={f(y - Math.sin((a * Math.PI) / 180) * 34 * s)} x2={f(x + Math.cos((a * Math.PI) / 180) * 34 * s)} y2={f(y + Math.sin((a * Math.PI) / 180) * 34 * s)} />)}</g>);
    else if (t === 3)
      els.push(<path key={i} d={`M${f(x)} ${f(y)}a${f(60 * s)} ${f(60 * s)} 0 1 0 ${f(60 * s)} ${f(60 * s)}a${f(40 * s)} ${f(40 * s)} 0 1 1 ${f(-60 * s)} ${f(-60 * s)}Z`} fill={blue} />);
    else if (t === 4) els.push(<polygon key={i} points={`${f(x)},${f(y)} ${f(x + 90 * s)},${f(y + 20 * s)} ${f(x + 30 * s)},${f(y + 90 * s)}`} fill={yellow} stroke={black} strokeWidth={3} />);
    else if (t === 5)
      els.push(<g key={i} stroke={black} strokeWidth={3} fill="none"><line x1={x} y1={y} x2={x} y2={y + 120 * s} /><line x1={x + 34 * s} y1={y} x2={x + 34 * s} y2={y + 120 * s} />{[20, 50, 80, 110].map((k) => <line key={k} x1={x} y1={y + k * s} x2={x + 34 * s} y2={y + k * s} />)}</g>);
    else if (t === 6) els.push(<g key={i}><circle cx={x} cy={y} r={26 * s} fill={green} /><circle cx={x} cy={y} r={7 * s} fill={black} /></g>);
    else els.push(<g key={i}>{Array.from({ length: 5 }, (_, k) => <circle key={k} cx={f(x + k * 24 * s)} cy={f(y + Math.sin(k) * 14)} r={f(6 * s)} fill={k % 2 ? text : black} />)}</g>);
  }
  return <g>{els}</g>;
}

// ---------------------------------------------------------------- Matisse ----
function Matisse({ W, H, pal, r }: P) {
  const els: React.ReactNode[] = [];
  const n = Math.round(((W * H) / 1080 / 1080) * 11) + 5;
  for (let i = 0; i < n; i++) {
    const cx = r.range(0, W), cy = r.range(0, H), rad = r.range(70, 190);
    els.push(<path key={i} d={blob(cx, cy, rad, r.int(4, 8), r.range(0, 6), r.range(0.3, 0.5), r.range(0, 6))} fill={pal[i % pal.length]} opacity={0.95} />);
  }
  return <g>{els}</g>;
}

// ---------------------------------------------------------------- Bruegel ----
function Bruegel({ W, H, bg, text, pal, r, id }: P) {
  const h0 = H * 0.36;
  const fields: React.ReactNode[] = [];
  const cols = [pal[2], pal[1], pal[0], pal[4], pal[3]];
  let y = h0;
  let i = 0;
  while (y < H) {
    const ht = (y - h0 + 20) * 0.28 + 10;
    const s1 = r.range(-60, 60), s2 = r.range(-60, 60);
    fields.push(<polygon key={i} points={`0,${f(y + s1 * 0.3)} ${W},${f(y + s2 * 0.3)} ${W},${f(y + ht + s2 * 0.3)} 0,${f(y + ht + s1 * 0.3)}`} fill={mix(bg, cols[i % cols.length], 0.85)} />);
    const furrows = Math.round(ht / 9);
    for (let k = 1; k < furrows; k++) {
      const yy = y + (ht * k) / furrows;
      fields.push(<line key={i + "f" + k} x1={0} y1={f(yy + s1 * 0.3)} x2={W} y2={f(yy + s2 * 0.3)} stroke={text} opacity={0.12} strokeWidth={1.5} />);
    }
    y += ht;
    i++;
  }
  const trees = Array.from({ length: 22 }, (_, k) => {
    const ty = r.range(h0 + 10, H);
    const sc = 0.4 + ((ty - h0) / (H - h0)) * 1.5;
    const tx = r.range(0, W);
    return (
      <g key={k} transform={`translate(${f(tx)} ${f(ty)}) scale(${f(sc)})`}>
        <line x1={0} y1={0} x2={0} y2={-26} stroke={pal[3]} strokeWidth={4} />
        <circle cx={0} cy={-38} r={17} fill={darken(pal[2], 0.15)} />
        <circle cx={-8} cy={-32} r={11} fill={pal[2]} />
      </g>
    );
  });
  const houses = Array.from({ length: 4 }, (_, k) => {
    const hx = r.range(0, W), hy = r.range(h0 + 20, h0 + (H - h0) * 0.5);
    const sc = 0.6 + ((hy - h0) / (H - h0)) * 1.6;
    return (
      <g key={k} transform={`translate(${f(hx)} ${f(hy)}) scale(${f(sc)})`}>
        <rect x={-18} y={-22} width={36} height={22} fill={lighten(pal[4], 0.3)} stroke={text} strokeWidth={1.5} />
        <polygon points="-22,-22 0,-42 22,-22" fill={pal[0]} stroke={text} strokeWidth={1.5} />
        <rect x={-4} y={-13} width={8} height={13} fill={pal[3]} />
      </g>
    );
  });
  return (
    <g>
      <defs>
        <linearGradient id={id + "sk"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(bg, pal[1], 0.55)} />
          <stop offset="1" stopColor={mix(bg, pal[0], 0.2)} />
        </linearGradient>
      </defs>
      <rect width={W} height={h0 + 10} fill={`url(#${id}sk)`} />
      <circle cx={W * 0.2} cy={h0 - 50} r={W * 0.055} fill={lighten(pal[1], 0.4)} />
      <path d={`M0 ${h0 + 10}L0 ${h0 - 30}Q${W * 0.2} ${h0 - 90} ${W * 0.4} ${h0 - 20}T${W * 0.8} ${h0 - 40}T${W} ${h0 - 10}L${W} ${h0 + 10}Z`} fill={mix(bg, pal[2], 0.55)} />
      {fields}{houses}{trees}
      {Array.from({ length: 6 }, (_, k) => {
        const bx = r.range(0, W), by = r.range(20, h0 - 80);
        return <path key={k} d={`M${f(bx)} ${f(by)}q8 -10 16 0q8 -10 16 0`} fill="none" stroke={text} strokeWidth={2} />;
      })}
    </g>
  );
}

// ------------------------------------------------------------------ Monet ----
function Monet({ W, H, bg, pal, r, id }: P) {
  const strokes = Array.from({ length: 110 }, (_, i) => {
    const x = r.range(-20, W), y = r.range(0, H), l = r.range(40, 120);
    return <line key={i} x1={f(x)} y1={f(y)} x2={f(x + l)} y2={f(y + r.range(-6, 6))} stroke={r.pick(pal)} strokeWidth={r.range(8, 20)} strokeLinecap="round" opacity={r.range(0.25, 0.55)} />;
  });
  const lilies = Array.from({ length: 16 }, (_, i) => {
    const x = r.range(0, W), y = r.range(H * 0.3, H), rx = r.range(50, 150);
    return (
      <g key={i}>
        <ellipse cx={f(x)} cy={f(y)} rx={f(rx)} ry={f(rx * 0.28)} fill={mix(pal[1], "#5FA38D", 0.5)} opacity={0.6} />
        <ellipse cx={f(x + rx * 0.1)} cy={f(y - rx * 0.1)} rx={f(rx * 0.3)} ry={f(rx * 0.12)} fill={r.chance(0.5) ? pal[2] : pal[0]} opacity={0.9} />
      </g>
    );
  });
  return (
    <g>
      <defs>
        <linearGradient id={id + "w"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(bg, pal[3], 0.55)} />
          <stop offset="0.5" stopColor={mix(bg, pal[0], 0.45)} />
          <stop offset="1" stopColor={mix(bg, pal[1], 0.55)} />
        </linearGradient>
        <filter id={id + "b"} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}w)`} />
      <g filter={`url(#${id}b)`}>{strokes}</g>
      <g filter={`url(#${id}b)`}>{lilies}</g>
      <circle cx={W * 0.8} cy={H * 0.14} r={W * 0.07} fill={pal[4]} opacity={0.8} filter={`url(#${id}b)`} />
    </g>
  );
}

// -------------------------------------------------------------- Corporate ----
function Corporate({ W, H, accent, pal, bg }: P) {
  return (
    <g>
      <polygon points={`0,0 ${W * 0.42},0 0,${H * 0.3}`} fill={accent} />
      <polygon points={`0,0 ${W * 0.26},0 0,${H * 0.18}`} fill={darken(accent, 0.25)} />
      <circle cx={W} cy={H} r={W * 0.38} fill={accent} opacity={0.14} />
      <circle cx={W} cy={H} r={W * 0.26} fill={accent} opacity={0.14} />
      <polygon points={`${W},0 ${W - W * 0.22},0 ${W},${H * 0.13}`} fill={pal[1]} opacity={0.8} />
      {Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (
        <circle key={i + "-" + j} cx={W * 0.06 + i * 16} cy={H - H * 0.06 - j * 16} r={2.4} fill={mix(bg, accent, 0.6)} />
      )))}
    </g>
  );
}

// ------------------------------------------------------------------ Craft ----
function Craft({ W, H, bg, accent, text, r }: P) {
  return (
    <g>
      {Array.from({ length: Math.round((W * H) / 3500) }, (_, i) => (
        <circle key={i} cx={f(r.range(0, W))} cy={f(r.range(0, H))} r={r.range(0.5, 1.8)} fill={darken(bg, 0.4)} opacity={r.range(0.1, 0.3)} />
      ))}
      {Array.from({ length: 40 }, (_, i) => (
        <line key={"l" + i} x1={f(r.range(0, W))} y1={f(r.range(0, H))} x2={f(r.range(0, W))} y2={f(r.range(0, H))} stroke={darken(bg, 0.25)} opacity={0.08} />
      ))}
      <rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke={accent} strokeWidth={4} />
      <rect x={32} y={32} width={W - 64} height={H - 64} fill="none" stroke={accent} strokeWidth={1.5} />
      {[[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={11} fill={bg} stroke={accent} strokeWidth={3} />
      ))}
      <g opacity={0.2} transform={`translate(${W * 0.88} ${H * 0.1}) rotate(-14)`}>
        <circle r={W * 0.07} fill="none" stroke={text} strokeWidth={4} />
        <circle r={W * 0.056} fill="none" stroke={text} strokeWidth={1.5} />
      </g>
    </g>
  );
}

// --------------------------------------------------------------- Eco-tech ----
function EcoTech({ W, H, accent, pal, r, id }: P) {
  const gx = Array.from({ length: Math.ceil(W / 54) }, (_, i) => i * 54);
  const gy = Array.from({ length: Math.ceil(H / 54) }, (_, i) => i * 54);
  const n = 12;
  const pts = Array.from({ length: n }, (_, i) => [(i / (n - 1)) * W, H * 0.22 - r.range(0, H * 0.12) - i * (H * 0.004)] as [number, number]);
  return (
    <g>
      <defs>
        <radialGradient id={id + "g"} cx="0.85" cy="0.1" r="0.7">
          <stop offset="0" stopColor={accent} stopOpacity="0.35" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}g)`} />
      <g stroke={accent} opacity={0.08} strokeWidth={1}>
        {gx.map((x) => <line key={"x" + x} x1={x} y1={0} x2={x} y2={H} />)}
        {gy.map((y) => <line key={"y" + y} x1={0} y1={y} x2={W} y2={y} />)}
      </g>
      {Array.from({ length: 14 }, (_, i) => {
        const bw = W / 14 - 8, bh = r.range(0.04, 0.2) * H;
        return <rect key={i} x={i * (W / 14) + 4} y={H - bh} width={bw} height={bh} fill={pal[i % 3]} opacity={0.3} />;
      })}
      <polyline points={pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")} fill="none" stroke={accent} strokeWidth={4} strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={f(p[0])} cy={f(p[1])} r={5} fill={accent} />)}
      <circle cx={W * 0.1} cy={H * 0.86} r={W * 0.07} fill="none" stroke={accent} strokeWidth={10} opacity={0.4} strokeDasharray="120 400" />
      <circle cx={W * 0.1} cy={H * 0.86} r={W * 0.07} fill="none" stroke={accent} strokeWidth={2} opacity={0.5} />
    </g>
  );
}

// -------------------------------------------------------------- Botanical ----
function Botanical({ W, H, pal, r, id }: P) {
  const leaf = "M0 0C30 -42 92 -42 124 0C92 42 30 42 0 0Z";
  const leaves = Array.from({ length: 16 }, (_, i) => {
    const edge = i % 4;
    const x = edge === 0 ? r.range(0, W * 0.25) : edge === 1 ? r.range(W * 0.75, W) : r.range(0, W);
    const y = edge === 2 ? r.range(0, H * 0.2) : edge === 3 ? r.range(H * 0.8, H) : r.range(0, H);
    const col = [pal[0], pal[1], pal[4]][i % 3];
    return (
      <g key={i} transform={`translate(${f(x)} ${f(y)}) rotate(${f(r.range(0, 360))}) scale(${f(r.range(0.8, 1.8))})`} opacity={0.85}>
        <path d={leaf} fill={col} />
        <path d="M0 0L118 0" stroke={darken(col, 0.3)} strokeWidth={2} />
      </g>
    );
  });
  const flowers = Array.from({ length: 6 }, (_, i) => {
    const x = r.range(0, W), y = r.range(0, H);
    return (
      <g key={i} transform={`translate(${f(x)} ${f(y)})`}>
        {Array.from({ length: 5 }, (_, k) => <ellipse key={k} rx={10} ry={22} cy={-20} fill={pal[2]} opacity={0.85} transform={`rotate(${k * 72})`} />)}
        <circle r={7} fill={pal[3]} />
      </g>
    );
  });
  return (
    <g>
      <defs><filter id={id + "wb"} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18" /></filter></defs>
      <g filter={`url(#${id}wb)`}>
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={blob(r.range(0, W), r.range(0, H), r.range(90, 220), 3, r.range(0, 6), 0.25)} fill={pal[i % pal.length]} opacity={0.38} />
        ))}
      </g>
      {leaves}{flowers}
    </g>
  );
}

const MAP: Record<StyleId, (p: P) => React.ReactElement> = {
  ART_PICASSO: Picasso, ART_CEZANNE: Cezanne, ART_SCHIELE: Schiele, ART_MIRO: Miro, ART_MATISSE: Matisse,
  ART_BRUEGEL: Bruegel, ART_MONET: Monet, STYLE_CORPORATE_CLEAN: Corporate, STYLE_CRAFT_HERITAGE: Craft,
  STYLE_ECO_TECH_DASHBOARD: EcoTech, STYLE_BOTANICAL_WATERCOLOR: Botanical,
};

function ArtBase({ design, W, H }: { design: Doc["design"]; W: number; H: number }) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = rng(design.seed + design.style.length * 97);
  const Comp = MAP[design.style];
  const pal = getPalette(design);
  return (
    <g>
      <rect width={W} height={H} fill={design.bg} />
      <Comp W={W} H={H} bg={design.bg} text={design.text} accent={design.accent} pal={pal} r={r} id={rid} />
    </g>
  );
}

export const Art = memo(ArtBase);
