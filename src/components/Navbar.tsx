import Link from "next/link";

const ANIMEX_URL = process.env.NEXT_PUBLIC_ANIMEX_URL ?? "https://animex.example.com";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between px-6 sm:px-10 py-4 bg-black/80 backdrop-blur-md text-white border-b border-white/10">
      <Link href="/" className="text-xl font-bold tracking-wide">
        MOVIE<span className="text-red-500">X</span>
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link href="/" className="text-white/80 hover:text-red-400 transition-colors">
          Movies
        </Link>
        <a
          href={ANIMEX_URL}
          className="text-white/80 hover:text-red-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          ANIMEX
        </a>
      </div>
    </nav>
  );
}
