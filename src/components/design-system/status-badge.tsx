import React from "react";
import { CheckCircle2, Clock, XCircle, Sparkles, AlertCircle } from "lucide-react";

export type StatusVariant = "confirmed" | "pending" | "cancelled" | "highlight" | "neutral";

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  showIcon?: boolean;
  className?: string;
}

const VARIANT_CONFIG: Record<
  StatusVariant,
  {
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  confirmed: {
    bgClass: "bg-forest/10",
    textClass: "text-forest",
    borderClass: "border-forest/20",
    icon: CheckCircle2,
  },
  pending: {
    bgClass: "bg-gold/15",
    textClass: "text-forest font-medium",
    borderClass: "border-gold/30",
    icon: Clock,
  },
  cancelled: {
    bgClass: "bg-wine/10",
    textClass: "text-wine",
    borderClass: "border-wine/25",
    icon: XCircle,
  },
  highlight: {
    bgClass: "bg-terracotta/10",
    textClass: "text-terracotta font-semibold",
    borderClass: "border-terracotta/25",
    icon: Sparkles,
  },
  neutral: {
    bgClass: "bg-forest/5",
    textClass: "text-olive",
    borderClass: "border-forest/10",
    icon: AlertCircle,
  },
};

/**
 * StatusBadge - Etichetta di stato rigorosamente vincolata alla palette RADICI.
 */
export function StatusBadge({
  variant,
  label,
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const conf = VARIANT_CONFIG[variant] || VARIANT_CONFIG.neutral;
  const Icon = conf.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs border ${conf.bgClass} ${conf.textClass} ${conf.borderClass} ${className}`}
    >
      {showIcon && <Icon size={13} className="shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
