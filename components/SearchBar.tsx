"use client";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
        aria-hidden
      >
        <circle cx={11} cy={11} r={7} />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH A STATION…"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border border-line bg-card py-4 pl-12 pr-4 text-base uppercase tracking-wide shadow-sm outline-none transition placeholder:text-muted focus:border-ink focus:ring-4 focus:ring-ink/5"
      />
    </div>
  );
}
