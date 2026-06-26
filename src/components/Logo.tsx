export default function Logo() {
  return (
    <span className="flex items-center gap-2 text-xl font-bold tracking-wide">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <rect width="64" height="64" rx="12" fill="#0a0a0a" />
        <path
          d="M14 20 L22 44 L32 24 L42 44 L50 20"
          fill="none"
          stroke="#e50914"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      MOVIE<span className="text-red-500">X</span>
    </span>
  );
}
