import { useId } from "react";
import type { SymbolId } from "@/lib/certificati-impatto/types";

interface Props { id: SymbolId; accent: string; ink: string; paper: string }

/** Simboli disegnati in un box 200×200 centrato sull'origine. */
export function SymbolArt({ id, accent, ink, paper }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  switch (id) {
    case "SIMBOL_BIO_LEAF":
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <circle r={96} fill={accent} opacity={0.16} />
          {/* spiga */}
          <path d="M-8 90C-6 40 -4 -10 0 -78" stroke={ink} strokeWidth={5} fill="none" />
          {[-60, -38, -16, 6, 28].map((y, i) => (
            <g key={i}>
              <path d={`M0 ${y + 14}C-26 ${y + 8} -30 ${y - 14} -26 ${y - 24}C-6 ${y - 18} 0 ${y - 2} 0 ${y + 14}Z`} fill={accent} stroke={ink} strokeWidth={3} transform={`translate(${-i * 0.4} 0)`} />
              <path d={`M0 ${y + 14}C26 ${y + 8} 30 ${y - 14} 26 ${y - 24}C6 ${y - 18} 0 ${y - 2} 0 ${y + 14}Z`} fill={accent} stroke={ink} strokeWidth={3} transform={`translate(${-i * 0.4} 0)`} />
            </g>
          ))}
          <path d="M0 -82C-8 -92 -4 -98 0 -100C6 -96 8 -90 0 -82Z" fill={accent} stroke={ink} strokeWidth={3} />
          {/* foglia */}
          <path d="M-6 84C-70 76 -92 30 -84 -6C-40 0 -10 30 -6 84Z" fill={paper} stroke={ink} strokeWidth={4} />
          <path d="M-8 80C-30 40 -52 14 -80 -4" stroke={ink} strokeWidth={3} fill="none" />
        </g>
      );
    case "SIMBOL_MARCHE_HILLS":
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <clipPath id={uid + "c"}><circle r={96} /></clipPath>
          <circle r={96} fill={paper} stroke={ink} strokeWidth={4} />
          <g clipPath={`url(#${uid}c)`}>
            <circle cx={42} cy={-46} r={20} fill={accent} opacity={0.9} />
            <path d="M-100 20C-60 -20 -20 -10 20 10C60 -10 80 -6 100 0V100H-100Z" fill={accent} opacity={0.45} />
            <path d="M-100 50C-70 10 -30 20 0 36C40 6 70 20 100 40V100H-100Z" fill={accent} />
            {/* borgo */}
            <g fill={paper} stroke={ink} strokeWidth={3}>
              <rect x={-52} y={-6} width={18} height={26} />
              <path d="M-54 -6L-43 -22L-32 -6Z" fill={ink} />
              <rect x={-30} y={4} width={22} height={16} />
              <rect x={-8} y={-2} width={16} height={22} />
              <path d="M-10 -2L0 -12L10 -2Z" fill={ink} />
              <rect x={-52} y={-40} width={0} height={0} />
            </g>
            <g stroke={ink} strokeWidth={3} fill={ink}>
              <path d="M40 54C34 40 38 28 44 20C50 28 52 42 44 54Z" />
              <path d="M62 60C58 50 60 42 64 36C68 42 68 52 64 60Z" />
            </g>
          </g>
          <circle r={96} fill="none" stroke={ink} strokeWidth={4} />
        </g>
      );
    case "SIMBOL_ECO_FLLEET":
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <circle r={96} fill={accent} opacity={0.16} />
          <line x1={-92} y1={58} x2={92} y2={58} stroke={ink} strokeWidth={4} />
          <path d="M-84 -34H34V50H-84Z" fill={paper} stroke={ink} strokeWidth={5} />
          <path d="M34 -14H62L86 14V50H34Z" fill={accent} stroke={ink} strokeWidth={5} />
          <path d="M44 -4H60L74 14H44Z" fill={paper} stroke={ink} strokeWidth={3} />
          {/* foglia sul furgone */}
          <path d="M-52 22C-52 -6 -30 -20 -8 -18C-8 6 -26 22 -52 22Z" fill={accent} stroke={ink} strokeWidth={4} />
          <path d="M-52 22L-20 -10" stroke={ink} strokeWidth={3} />
          {/* ruote */}
          <circle cx={-52} cy={54} r={17} fill={ink} />
          <circle cx={-52} cy={54} r={6} fill={paper} />
          <circle cx={58} cy={54} r={17} fill={ink} />
          <circle cx={58} cy={54} r={6} fill={paper} />
          {/* fulmine elettrico */}
          <path d="M-14 -70L-30 -46H-18L-24 -26L-4 -52H-16Z" fill={accent} stroke={ink} strokeWidth={3} transform="translate(20 -4)" />
        </g>
      );
    case "SIMBOL_CSR_HANDSHAKE":
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M0 -94C30 -76 58 -70 82 -70V-10C82 44 44 80 0 98C-44 80 -82 44 -82 -10V-70C-58 -70 -30 -76 0 -94Z" fill={accent} opacity={0.2} stroke={ink} strokeWidth={5} />
          {/* due mani stilizzate */}
          <path d="M-62 -6L-24 -30L10 -18L40 -4" fill="none" stroke={ink} strokeWidth={5} />
          <path d="M-64 14L-34 -4L-4 18L24 40" fill={paper} stroke={ink} strokeWidth={5} />
          <path d="M64 12L36 -8L8 -16" fill={paper} stroke={ink} strokeWidth={5} />
          <path d="M-62 -14H-82M62 6H82" stroke={ink} strokeWidth={5} />
          <circle cx={4} cy={10} r={22} fill={accent} stroke={ink} strokeWidth={5} />
          <path d="M-5 11L2 19L15 3" fill="none" stroke={paper} strokeWidth={6} />
          <path d="M-34 36C-20 50 -8 56 4 60" stroke={ink} strokeWidth={4} fill="none" />
        </g>
      );
    case "SIMBOL_SEAL_STAMP":
    default:
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <defs><path id={uid + "p"} d="M0 0m-70 0a70 70 0 1 1 140 0a70 70 0 1 1 -140 0" /></defs>
          <circle r={96} fill={paper} stroke={accent} strokeWidth={8} />
          <circle r={86} fill="none" stroke={accent} strokeWidth={2.5} />
          <circle r={50} fill="none" stroke={accent} strokeWidth={2.5} />
          <text fill={ink} fontSize={14} fontWeight={700} fontFamily="Helvetica, Arial, sans-serif">
            <textPath href={`#${uid}p`} startOffset="0" textLength={428} lengthAdjust="spacing">TRACCIABILITÀ · KM 0 · FILIERA CORTA ·</textPath>
          </text>
          <path d="M0 -26C-16 -26 -26 -14 -26 0C-26 18 0 36 0 36C0 36 26 18 26 0C26 -14 16 -26 0 -26Z" fill={accent} />
          <circle r={9} cy={-4} fill={paper} />
        </g>
      );
  }
}
