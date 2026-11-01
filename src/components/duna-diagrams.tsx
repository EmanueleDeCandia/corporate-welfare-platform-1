type DiagramTone = "cream" | "forest";

/**
 * Linea di flusso orizzontale con archi tratteggiati e etichette.
 * Usata sopra uno sfondo pittorico sfocato, con il testo appoggiato all'immagine.
 */
export function StepsDiagram({
  steps,
  tone = "cream",
  className = "",
}: {
  steps: string[];
  tone?: DiagramTone;
  className?: string;
}) {
  const first = 40;
  const last = 600;
  const y = 70;
  const midX = (first + last) / 2;
  const positions =
    steps.length > 1
      ? steps.map((_, index) => first + (index * (last - first)) / (steps.length - 1))
      : [midX];

  const strokeColor = tone === "cream" ? "text-cream" : "text-forest/55";
  const labelColor = tone === "cream" ? "text-cream/90" : "text-forest/70";

  return (
    <div className={`mx-auto w-full max-w-3xl px-4 py-8 ${className}`}>
      <svg viewBox="0 0 640 120" className={`w-full ${strokeColor}`} fill="none" aria-hidden="true">
        <path d={`M${first} ${y} H${last}`} stroke="currentColor" strokeWidth="1.2" />
        <path
          d={`M${first} ${y} C ${first + 120} ${y}, ${midX - 120} 18, ${midX} 18 C ${midX + 120} 18, ${last - 120} ${y}, ${last} ${y}`}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        {positions.map((x) => (
          <circle key={x} cx={x} cy={y} r="4" fill="currentColor" />
        ))}
      </svg>
      <div
        className={`mt-1 grid text-center text-xs ${labelColor}`}
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </div>
  );
}

export function CycleDiagram() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center">
      <svg viewBox="0 0 320 320" className="h-full w-full text-cream" fill="none">
        <circle cx="160" cy="160" r="88" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="160" cy="72" r="4" fill="currentColor" />
        <circle cx="236" cy="204" r="4" fill="currentColor" />
        <circle cx="84" cy="204" r="4" fill="currentColor" />
      </svg>
      <span className="absolute top-6 left-1/2 -translate-x-1/2 text-sm text-cream">Impresa</span>
      <span className="absolute right-4 bottom-16 text-sm text-cream">Dipendente</span>
      <span className="absolute left-4 bottom-16 text-sm text-cream">Territorio</span>
    </div>
  );
}

export function FlowDiagram() {
  const steps = ["Piano welfare", "Selezione", "Presenza", "Fattura", "Impatto"];
  return <StepsDiagram steps={steps} tone="cream" />;
}
