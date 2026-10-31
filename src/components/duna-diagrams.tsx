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
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <svg viewBox="0 0 640 120" className="w-full text-cream" fill="none">
        <path d="M40 70 H600" stroke="currentColor" strokeWidth="1.2" />
        <path d="M40 70 C 160 70, 200 18, 320 18 C 440 18, 480 70, 600 70" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        {[40, 180, 320, 460, 600].map((x) => (
          <circle key={x} cx={x} cy="70" r="4" fill="currentColor" />
        ))}
      </svg>
      <div className="mt-1 grid grid-cols-5 text-center text-xs text-cream/90">
        {steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </div>
  );
}
