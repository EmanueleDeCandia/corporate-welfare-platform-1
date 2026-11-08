// Utilità colore: parsing HEX/RGB, mix, rotazione di tinta, contrasto WCAG.

export function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function isHex(v: string) {
  return /^#([0-9a-fA-F]{6})$/.test(v);
}

/** Accetta #rgb, #rrggbb, rgb(r,g,b), "r, g, b". Ritorna #RRGGBB maiuscolo oppure null. */
export function parseColor(input: string): string | null {
  const s = input.trim();
  let m = s.match(/^#?([0-9a-fA-F]{3})$/);
  if (m) {
    const [r, g, b] = m[1].split("");
    return ("#" + r + r + g + g + b + b).toUpperCase();
  }
  m = s.match(/^#?([0-9a-fA-F]{6})$/);
  if (m) return ("#" + m[1]).toUpperCase();
  m = s.match(/^(?:rgb\()?\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)?$/i);
  if (m) {
    const v = [m[1], m[2], m[3]].map((x) => clamp(parseInt(x, 10), 0, 255));
    return rgbToHex(v[0], v[1], v[2]);
  }
  return null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = isHex(hex) ? hex : "#000000";
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function rgbToHex(r: number, g: number, b: number) {
  const t = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return ("#" + t(r) + t(g) + t(b)).toUpperCase();
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r0, g0, b0] = hexToRgb(hex);
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function rotateHue(hex: string, deg: number) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + deg, s, l);
}

export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export function lighten(hex: string, t: number) {
  return mix(hex, "#FFFFFF", t);
}
export function darken(hex: string, t: number) {
  return mix(hex, "#000000", t);
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Restituisce il colore (nero/bianco o tonalità scurita/schiarita) con contrasto >= target su bg. */
export function fixContrast(fg: string, bg: string, target = 4.5) {
  if (contrast(fg, bg) >= target) return fg;
  const bgDark = luminance(bg) < 0.4;
  for (let i = 1; i <= 20; i++) {
    const c = bgDark ? lighten(fg, i / 20) : darken(fg, i / 20);
    if (contrast(c, bg) >= target) return c;
  }
  return bgDark ? "#FFFFFF" : "#000000";
}

export function harmonies(hex: string) {
  return {
    Complementare: [hex, rotateHue(hex, 180)],
    Analoghi: [rotateHue(hex, -30), hex, rotateHue(hex, 30)],
    Triade: [hex, rotateHue(hex, 120), rotateHue(hex, 240)],
    Tetrade: [hex, rotateHue(hex, 90), rotateHue(hex, 180), rotateHue(hex, 270)],
  } as Record<string, string[]>;
}
