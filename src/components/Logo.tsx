export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-8 w-8 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="30" height="30" rx="9" className="fill-primary" />
        <path
          d="M10 22V11.5C10 10.7 10.7 10 11.5 10h5.2c3 0 5 1.9 5 4.6 0 2.8-2 4.7-5 4.7H14"
          className="stroke-primary-foreground"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="22" r="2" className="fill-primary-foreground" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">PlaceUp</span>
    </span>
  );
}
