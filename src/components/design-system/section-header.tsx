import React from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * SectionHeader - Intestazione editoriale rigorosa (Serif + Olive + Eyebrow maiuscolo).
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeaderProps) {
  const alignmentClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl space-y-2 ${alignmentClass} ${className}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold block">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl text-forest tracking-tight font-medium">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-olive leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
