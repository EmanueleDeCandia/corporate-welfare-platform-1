import React from "react";

export type SurfaceVariant = "white" | "cream" | "forest" | "bordered";

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  children: React.ReactNode;
  className?: string;
}

const SURFACE_VARIANTS: Record<SurfaceVariant, string> = {
  white: "bg-white text-forest border border-forest/10 shadow-sm",
  cream: "bg-cream/40 text-forest border border-forest/10",
  forest: "bg-forest text-cream border border-forest-deep shadow-md",
  bordered: "bg-transparent text-forest border border-forest/15",
};

/**
 * SurfaceCard - Superficie rettangolare con raggio sobrio e bordature naturali.
 */
export function SurfaceCard({
  variant = "white",
  children,
  className = "",
  ...props
}: SurfaceCardProps) {
  const baseVariant = SURFACE_VARIANTS[variant] || SURFACE_VARIANTS.white;
  return (
    <div
      className={`rounded-[28px] p-6 md:p-8 transition-shadow ${baseVariant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
