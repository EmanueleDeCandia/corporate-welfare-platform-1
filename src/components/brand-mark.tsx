export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="16" fill="#EFEBE3" />
      <path d="M3 23c5-8 10-11 13-11s8 3 13 11" fill="#8A9A84" />
      <circle cx="22" cy="11" r="3.2" fill="#D4C4A0" />
    </svg>
  );
}
