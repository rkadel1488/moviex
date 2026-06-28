import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Watch Movies Online Free`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Discover and stream the latest, most popular, and top-rated movies online for free on MovieX. Browse by genre, search any title, and watch instantly.",
  keywords: [
    "watch movies online",
    "free movies",
    "stream movies",
    "MovieX",
    "South Indian movies",
    "movie streaming",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Watch Movies Online Free`,
    description: "Discover and stream the latest, most popular, and top-rated movies online for free.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Watch Movies Online Free`,
    description: "Discover and stream the latest, most popular, and top-rated movies online for free.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 pb-14 sm:pb-0">{children}</main>
        <div className="hidden sm:block">
          <Footer />
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
