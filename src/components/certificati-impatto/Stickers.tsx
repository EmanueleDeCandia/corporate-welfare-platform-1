import type { FC, SVGProps } from "react";

export type StickerId =
  | "sprout"
  | "wheat"
  | "leaf"
  | "grape"
  | "olive"
  | "sunflower"
  | "cheese"
  | "truck"
  | "zap"
  | "globe"
  | "recycle"
  | "handshake"
  | "award"
  | "star"
  | "heart"
  | "mountain"
  | "landmark"
  | "sun"
  | "bee"
  | "butterfly"
  | "party";

export interface StickerMeta {
  id: StickerId;
  label: string;
}

export const MONOCHROME_STICKERS: StickerMeta[] = [
  { id: "sprout", label: "Germoglio Km 0" },
  { id: "wheat", label: "Spiga delle Marche" },
  { id: "leaf", label: "Foglia Biologica" },
  { id: "grape", label: "Vite & Territorio" },
  { id: "olive", label: "Olivo Secolare" },
  { id: "sunflower", label: "Girasole Marchigiano" },
  { id: "cheese", label: "Tipicità Casearia" },
  { id: "truck", label: "Flotta Elettrica Km 0" },
  { id: "zap", label: "Energia Rinnovabile" },
  { id: "globe", label: "Terra & Sostenibilità" },
  { id: "recycle", label: "Economia Circolare" },
  { id: "handshake", label: "CSR & Shared Value" },
  { id: "award", label: "Premio Territorio" },
  { id: "star", label: "Eccellenza Locale" },
  { id: "heart", label: "Passione Artigiana" },
  { id: "mountain", label: "Monti Sibillini" },
  { id: "landmark", label: "Borgo Storico" },
  { id: "sun", label: "Sole d'Oriente" },
  { id: "bee", label: "Biodiversità & Api" },
  { id: "butterfly", label: "Natura Incontaminata" },
  { id: "party", label: "Festa & Tradizione" },
];

interface StickerIconProps extends SVGProps<SVGSVGElement> {
  id: string;
  size?: number | string;
  color?: string;
}

export function StickerIcon({ id, size = 24, color = "currentColor", className = "", ...props }: StickerIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    ...props,
  };

  switch (id) {
    case "sprout":
    case "🌱":
      return (
        <svg {...common}>
          <path d="M7 20h10" />
          <path d="M10 20c0-5.5 2.5-9 6-10" />
          <path d="M14 6c3 0 5 2 5 5-3 0-5-2-5-5Z" />
          <path d="M6 13c0-3 2-5 5-5 0 3-2 5-5 5Z" />
        </svg>
      );
    case "wheat":
    case "🌾":
      return (
        <svg {...common}>
          <path d="M2 22l10-10" />
          <path d="M16 8l-4 4" />
          <path d="M18 6c2-2 3-5 3-5s-3 1-5 3l-2 2 4 4 2-2 2-2Z" />
          <path d="M12 12c-2-2-5-3-5-3s1 3 3 5l2 2 4-4-4-4Z" />
          <path d="M14 16l4-4" />
          <path d="M10 20l4-4" />
        </svg>
      );
    case "leaf":
    case "🌿":
    case "🍃":
      return (
        <svg {...common}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "grape":
    case "🍇":
      return (
        <svg {...common}>
          <path d="M12 2v4" />
          <circle cx="9" cy="8" r="2.5" />
          <circle cx="15" cy="8" r="2.5" />
          <circle cx="6.5" cy="12.5" r="2.5" />
          <circle cx="12" cy="12.5" r="2.5" />
          <circle cx="17.5" cy="12.5" r="2.5" />
          <circle cx="9" cy="17" r="2.5" />
          <circle cx="15" cy="17" r="2.5" />
          <circle cx="12" cy="21" r="2" />
        </svg>
      );
    case "olive":
    case "🫒":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="13" rx="6" ry="8" />
          <path d="M12 5V2" />
          <path d="M12 4c2-1 4-1 6 0" />
          <circle cx="10" cy="11" r="1.5" fill={color} />
        </svg>
      );
    case "sunflower":
    case "🌻":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12" />
          <circle cx="12" cy="12" r="7" strokeDasharray="2 2" />
        </svg>
      );
    case "cheese":
    case "🧀":
      return (
        <svg {...common}>
          <path d="M4 11h16l-3-7H7L4 11Z" />
          <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <circle cx="9" cy="16" r="1.5" />
          <circle cx="15" cy="15" r="1" />
        </svg>
      );
    case "truck":
    case "🚚":
      return (
        <svg {...common}>
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "zap":
    case "⚡":
      return (
        <svg {...common}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "globe":
    case "🌍":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      );
    case "recycle":
    case "♻️":
    case "♻":
      return (
        <svg {...common}>
          <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
          <path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0 0-1.8L17.5 10" />
          <path d="M13 5h3a1.8 1.8 0 0 1 1.6 1 1.8 1.8 0 0 1 0 1.8L14 14" />
          <polyline points="7 15 7 19 3 19" />
          <polyline points="15 3 13 5 15 7" />
        </svg>
      );
    case "handshake":
    case "🤝":
      return (
        <svg {...common}>
          <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.6-4.6a2 2 0 0 0 0-2.8l-1.4-1.4" />
          <path d="m3 11 5-5a2 2 0 0 1 2.8 0l1.4 1.4" />
          <path d="m13 7 1.4-1.4a2 2 0 0 1 2.8 0l3.8 3.8a2 2 0 0 1 0 2.8l-1.4 1.4" />
          <path d="m7 17-2-2a1 1 0 0 1 0-1.4l5.4-5.4" />
        </svg>
      );
    case "award":
    case "🏆":
      return (
        <svg {...common}>
          <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
          <circle cx="12" cy="8" r="6" />
        </svg>
      );
    case "star":
    case "⭐":
      return (
        <svg {...common}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "heart":
    case "💚":
      return (
        <svg {...common}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "mountain":
    case "🏔️":
    case "🏔":
      return (
        <svg {...common}>
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
          <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" />
        </svg>
      );
    case "landmark":
    case "🏘️":
    case "🏘":
      return (
        <svg {...common}>
          <line x1="2" y1="22" x2="22" y2="22" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <polygon points="12 2 20 7 4 7" />
        </svg>
      );
    case "sun":
    case "🌅":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41" />
        </svg>
      );
    case "bee":
    case "🐝":
      return (
        <svg {...common}>
          <path d="M12 7c-2 0-3.5 1.5-3.5 3.5 0 2 1.5 5.5 3.5 7.5 2-2 3.5-5.5 3.5-7.5C15.5 8.5 14 7 12 7Z" />
          <path d="M8.5 10.5C6 10 4 8 4 6c0-2 2-3 4-2 1.5.8 2.5 3 2.5 4.5" />
          <path d="M15.5 10.5C18 10 20 8 20 6c0-2-2-3-4-2-1.5.8-2.5 3-2.5 4.5" />
          <line x1="10" y1="13" x2="14" y2="13" />
          <line x1="10.5" y1="16" x2="13.5" y2="16" />
        </svg>
      );
    case "butterfly":
    case "🦋":
      return (
        <svg {...common}>
          <path d="M12 4v16" />
          <path d="M12 7C9 4 4 4 4 8c0 4 5 5 8 5" />
          <path d="M12 7c3-3 8-3 8 1 0 4-5 5-8 5" />
          <path d="M12 13c-3 0-6 2-6 5 0 2 2 3 4 2 2-.8 2-3 2-7" />
          <path d="M12 13c3 0 6 2 6 5 0 2-2 3-4 2-2-.8-2-3-2-7" />
        </svg>
      );
    case "party":
    case "🎉":
    default:
      return (
        <svg {...common}>
          <polygon points="3 21 6 12 12 18 3 21" />
          <path d="M16 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
          <circle cx="19" cy="14" r="1.5" />
          <circle cx="13" cy="7" r="1.5" />
        </svg>
      );
  }
}
