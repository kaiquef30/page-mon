
interface IllustrationProps {
  className?: string;
}

export function NoTargetsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circles */}
      <circle cx="100" cy="100" r="80" className="fill-muted/30" />
      <circle cx="100" cy="100" r="60" className="fill-muted/20" />

      {/* Target icon */}
      <circle
        cx="100"
        cy="100"
        r="40"
        className="stroke-primary"
        strokeWidth="3"
        strokeDasharray="8 4"
      />
      <circle
        cx="100"
        cy="100"
        r="25"
        className="stroke-primary"
        strokeWidth="3"
      />
      <circle cx="100" cy="100" r="8" className="fill-primary" />

      {/* Plus sign */}
      <g className="opacity-70">
        <line
          x1="160"
          y1="50"
          x2="180"
          y2="50"
          className="stroke-foreground"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="170"
          y1="40"
          x2="170"
          y2="60"
          className="stroke-foreground"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function NoChangesIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document */}
      <rect
        x="50"
        y="30"
        width="100"
        height="140"
        rx="8"
        className="fill-muted/30 stroke-border"
        strokeWidth="2"
      />

      {/* Document lines */}
      <line x1="70" y1="60" x2="130" y2="60" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="80" x2="130" y2="80" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="100" x2="110" y2="100" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />

      {/* Checkmark circle */}
      <circle cx="100" cy="130" r="20" className="fill-success/20 stroke-success" strokeWidth="2" />
      <path
        d="M 90 130 L 97 137 L 110 123"
        className="stroke-success"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NoNotificationsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bell */}
      <path
        d="M 100 40 C 85 40 75 50 75 65 L 75 95 C 75 105 70 110 65 115 L 135 115 C 130 110 125 105 125 95 L 125 65 C 125 50 115 40 100 40 Z"
        className="fill-muted/30 stroke-border"
        strokeWidth="2"
      />

      {/* Bell bottom */}
      <path
        d="M 90 115 C 90 122 94 128 100 128 C 106 128 110 122 110 115"
        className="stroke-border"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Bell top */}
      <circle cx="100" cy="35" r="4" className="fill-muted-foreground" />

      {/* ZZZ for sleep/quiet */}
      <g className="opacity-60">
        <text x="130" y="65" className="fill-muted-foreground" style={{ fontSize: '20px', fontWeight: 'bold' }}>Z</text>
        <text x="145" y="50" className="fill-muted-foreground" style={{ fontSize: '16px', fontWeight: 'bold' }}>Z</text>
        <text x="155" y="38" className="fill-muted-foreground" style={{ fontSize: '12px', fontWeight: 'bold' }}>Z</text>
      </g>
    </svg>
  );
}

export function NoSearchResultsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Magnifying glass */}
      <circle
        cx="85"
        cy="85"
        r="40"
        className="stroke-muted-foreground"
        strokeWidth="4"
      />
      <line
        x1="115"
        y1="115"
        x2="145"
        y2="145"
        className="stroke-muted-foreground"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* X mark inside glass */}
      <line
        x1="70"
        y1="70"
        x2="100"
        y2="100"
        className="stroke-destructive"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="70"
        x2="70"
        y2="100"
        className="stroke-destructive"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ErrorIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Warning triangle */}
      <path
        d="M 100 40 L 160 150 L 40 150 Z"
        className="fill-destructive/10 stroke-destructive"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Exclamation mark */}
      <line
        x1="100"
        y1="75"
        x2="100"
        y2="115"
        className="stroke-destructive"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="100" cy="130" r="4" className="fill-destructive" />
    </svg>
  );
}

export function LoadingIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Animated circles */}
      <circle cx="100" cy="100" r="60" className="stroke-primary/20" strokeWidth="2" />
      <circle cx="100" cy="100" r="45" className="stroke-primary/40" strokeWidth="2" />
      <circle cx="100" cy="100" r="30" className="stroke-primary/60" strokeWidth="2" />

      {/* Center dot */}
      <circle cx="100" cy="100" r="10" className="fill-primary animate-pulse" />
    </svg>
  );
}
