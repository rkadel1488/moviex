"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ANIMEX_URL = process.env.NEXT_PUBLIC_ANIMEX_URL ?? "https://animex.example.com";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 sm:px-10 py-4 text-white transition-colors duration-300 ${
        scrolled ? "bg-black/95 backdrop-blur-md border-b border-white/10" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
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
