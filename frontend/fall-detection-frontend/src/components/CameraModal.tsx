import { useEffect, useRef, useState } from "react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamUrl: string;
}

export default function CameraModal({ isOpen, onClose, streamUrl }: CameraModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [streamError, setStreamError] = useState(false);
  const [streamLoaded, setStreamLoaded] = useState(false);

  // Reset state when modal opens, then assume loaded after 2s if no error
  useEffect(() => {
    if (isOpen) {
      setStreamError(false);
      setStreamLoaded(false);
      const timer = setTimeout(() => setStreamLoaded(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="relative bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl w-[90vw] max-w-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 ${streamError ? "bg-yellow-500" : "bg-accent-red"}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${streamError ? "bg-yellow-500" : "bg-accent-red"}`} />
            </span>
            <h3 className="text-dark-text font-semibold text-sm">
              {streamError ? "Camera — Connection Error" : streamLoaded ? "Live Camera — ESP32-CAM" : "Connecting to camera..."}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-dark-text-muted hover:text-dark-text transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Video stream */}
        <div className="bg-black flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
          {/* Loading spinner (shown while waiting for stream) */}
          {!streamLoaded && !streamError && (
            <div className="absolute flex flex-col items-center gap-3 text-dark-text-muted z-10">
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm">Connecting to ESP32-CAM...</p>
            </div>
          )}

          <img
            src={streamUrl}
            alt="ESP32-CAM Live Stream"
            className={`w-full h-full object-contain ${streamError ? "hidden" : ""}`}
            onLoad={() => setStreamLoaded(true)}
            onError={() => {
              setStreamError(true);
              setStreamLoaded(false);
            }}
          />

          {/* Error fallback */}
          {streamError && (
            <div className="flex flex-col items-center gap-3 text-dark-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 opacity-30">
                <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
              </svg>
              <p className="text-sm">Cannot connect to camera</p>
              <p className="text-xs opacity-60">Check ESP32-CAM IP and make sure it's on the same network</p>
              <button
                onClick={() => {
                  setStreamError(false);
                  setStreamLoaded(false);
                }}
                className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-accent-blue/15 text-accent-blue border border-accent-blue/30 hover:bg-accent-blue/25 transition-all"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-dark-border flex items-center justify-between text-xs text-dark-text-muted">
          <span>Stream: {streamUrl}</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
