"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

// The presentation studio (/ppt) is a fullscreen app with its own header,
// so the movie-site chrome is hidden there.
export function TopChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/ppt")) return null;
  return <Navbar />;
}

export function BottomChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/ppt")) return null;
  return (
    <>
      <div className="hidden sm:block">
        <Footer />
      </div>
      <BottomNav />
    </>
  );
}
