import React from "react";
import { Sparkles, Building2, Users, HeartHandshake, Store, Landmark } from "lucide-react";
import { type RadiciRole, ROLE_DEFINITIONS } from "./tokens";

interface RoleBadgeProps {
  role: RadiciRole;
  showIcon?: boolean;
  className?: string;
}

const ROLE_ICONS: Record<RadiciRole, React.ComponentType<{ size?: number; className?: string }>> = {
  promoter: Sparkles,
  csr: Building2,
  employee: Users,
  friend: HeartHandshake,
  provider: Store,
  theater: Landmark,
};

/**
 * RoleBadge - Badge istituzionale unico ed editoriale per i ruoli RADICI.
 * Unifica tutti gli account sotto una grammatica sobria in forest, paper e oro,
 * eliminando definitivamente i gradienti o i colori disomogenei da template SaaS.
 */
export function RoleBadge({ role, showIcon = true, className = "" }: RoleBadgeProps) {
  const def = ROLE_DEFINITIONS[role] || {
    label: role,
    description: "",
    accent: "forest",
  };
  const Icon = ROLE_ICONS[role] || Users;

  // Stile unificato istituzionale
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase border bg-forest/5 text-forest border-forest/15 ${className}`}
    >
      {showIcon && <Icon size={12} className="opacity-80 shrink-0" />}
      <span>{def.label}</span>
    </span>
  );
}
