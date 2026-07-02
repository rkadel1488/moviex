"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ANIMEX_URL = process.env.NEXT_PUBLIC_ANIMEX_URL ?? "https://animex.example.com";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={active ? "#fff" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9.5v-6h5v6H17.5a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SeriesIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="14" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <path d="M8 20h8M12 18v2" strokeLinecap="round" />
      <path d="M10 10.5 14.5 12 10 13.5z" fill={active ? "#fff" : "currentColor"} stroke="none" />
    </svg>
  );
}

function TagIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M11.5 4.5h6a2 2 0 0 1 2 2v6l-9.3 9.3a2 2 0 0 1-2.83 0l-5.17-5.17a2 2 0 0 1 0-2.83L11.5 4.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <circle cx="15.5" cy="8.5" r="1.4" fill={active ? "#fff" : "none"} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20 16 16" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M10 8.5 16 12l-6 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSeries = pathname.startsWith("/series");
  const isGenres = pathname.startsWith("/genres");
  const isSearch = pathname.startsWith("/search");
  const isWatchlist = pathname.startsWith("/watchlist");

  const items = [
    {
      href: "/",
      label: "Home",
      active: isHome,
      icon: <HomeIcon active={isHome} />,
    },
    {
      href: "/series",
      label: "Series",
      active: isSeries,
      icon: <SeriesIcon active={isSeries} />,
    },
    {
      href: "/genres",
      label: "Genres",
      active: isGenres,
      icon: <TagIcon active={isGenres} />,
    },
    {
      href: "/search",
      label: "Search",
      active: isSearch,
      icon: <SearchIcon />,
    },
    {
      href: "/watchlist",
      label: "My List",
      active: isWatchlist,
      icon: <BookmarkIcon active={isWatchlist} />,
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              item.active ? "text-white" : "text-white/50"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <a
          href={ANIMEX_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-white/50 transition-colors"
        >
          <PlayIcon />
          ANIMEX
        </a>
      </div>
    </nav>
  );
}
