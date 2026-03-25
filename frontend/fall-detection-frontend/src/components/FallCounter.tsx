interface FallCounterProps {
  count: number;
}

export default function FallCounter({ count }: FallCounterProps) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 flex items-center gap-5">
      <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-accent-red/10 border border-accent-red/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8 text-accent-red"
        >
          <path
            fillRule="evenodd"
            d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.499-2.599 4.499H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <p className="text-dark-text-muted text-sm font-medium tracking-wide uppercase">
          Falls Today
        </p>
        <p className="text-4xl font-bold text-accent-red mt-1 tabular-nums">
          {count}
        </p>
      </div>
    </div>
  );
}
