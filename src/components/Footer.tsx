import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 text-white/50 text-sm px-6 sm:px-10 py-8 mt-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} MovieX. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
