interface StatusBadgeProps {
  isFall: boolean;
  onVideoClick: () => void;
  cameraLoading?: boolean;
}

export default function StatusBadge({ isFall, onVideoClick, cameraLoading = false }: StatusBadgeProps) {
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

      {/* Camera Button — disabled when normal, green when fall */}
      <button
        onClick={onVideoClick}
        disabled={cameraLoading || !isFall}
        className={`
          group relative flex items-center justify-center w-14 h-14 rounded-xl
          transition-all duration-300
          ${cameraLoading
            ? "bg-accent-green/15 border border-accent-green/40 text-accent-green cursor-wait"
            : !isFall
              ? "bg-dark-border/30 border border-dark-border text-dark-text-muted/40 cursor-not-allowed"
              : "bg-accent-green/15 border border-accent-green/40 text-accent-green hover:bg-accent-green/25 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer"
          }
        `}
        title={cameraLoading ? "Starting camera..." : isFall ? "View live camera (Fall detected!)" : "No fall detected"}
      >
        {cameraLoading ? (
          <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
          </svg>
        )}
        {isFall && !cameraLoading && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green" />
          </span>
        )}
      </button>
    </div>
  );
}
