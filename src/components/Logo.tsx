interface Props {
  className?: string;
}

/** The app's soccer-ball-on-pitch badge mark (matches the favicon). */
export default function Logo({ className = "h-8 w-8" }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="World Cup 2026 logo">
      <defs>
        <linearGradient id="logoPitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1aa34a" />
          <stop offset="1" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#logoPitch)" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="15.25"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="20" fill="#ffffff" stroke="#0f2e1b" strokeWidth="1.5" />
      <polygon points="32,22 41.5,28.9 37.9,40.1 26.1,40.1 22.5,28.9" fill="#0f2e1b" />
      <g stroke="#0f2e1b" strokeWidth="1.8" strokeLinecap="round">
        <line x1="32" y1="22" x2="32" y2="13" />
        <line x1="41.5" y1="28.9" x2="50" y2="26" />
        <line x1="37.9" y1="40.1" x2="44" y2="48" />
        <line x1="26.1" y1="40.1" x2="20" y2="48" />
        <line x1="22.5" y1="28.9" x2="13" y2="26" />
      </g>
    </svg>
  );
}
