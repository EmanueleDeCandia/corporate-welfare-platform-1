import type { ReactNode } from "react";

/**
 * Pannello con immagine pittorica sfocata a tutta area e contenuto appoggiato
 * sopra: è lo stesso trattamento visivo del diagramma "Come funziona"
 * (sfondo sfocato + forme + testo dentro l'immagine).
 */
export function BlurredPanel({
  image,
  alt = "",
  children,
  className = "",
  contentClassName = "",
  overlayClassName = "",
  rounded = "rounded-[28px]",
}: {
  image: string;
  alt?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
  rounded?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <img src={image} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      {overlayClassName ? (
        <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />
      ) : null}
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}
