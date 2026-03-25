interface StatusBadgeProps {
  isFall: boolean;
  onVideoClick: () => void;
}

export default function StatusBadge({ isFall, onVideoClick }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Status Box */}
      <div
        className={`
          relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg tracking-wide
          transition-all duration-500 ease-out
          ${isFall
            ? "bg-accent-red/15 text-accent-red border border-accent-red/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            : "bg-accent-green/15 text-accent-green border border-accent-green/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
          }
        `}
      >
        {/* Pulse dot */}
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFall ? "bg-accent-red" : "bg-accent-green"
              }`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${isFall ? "bg-accent-red" : "bg-accent-green"
              }`}
          />
        </span>
        <p className="text-dark-text-muted text-sm font-medium tracking-wide uppercase">
          Status
        </p>
        {isFall ? "⚠ FALL DETECTED" : "NORMAL"}
      </div>

      {/* Video Icon */}
      <button
        onClick={onVideoClick}
        disabled={!isFall}
        className={`
          group relative flex items-center justify-center w-14 h-14 rounded-xl
          transition-all duration-300
          ${isFall
            ? "bg-accent-red/15 border border-accent-red/40 text-accent-red hover:bg-accent-red/25 hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer"
            : "bg-dark-border/30 border border-dark-border text-dark-text-muted/40 cursor-not-allowed"
          }
        `}
        title={isFall ? "View fall recording" : "No fall detected"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
        </svg>
        {isFall && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-red" />
          </span>
        )}
      </button>
    </div>
  );
}
