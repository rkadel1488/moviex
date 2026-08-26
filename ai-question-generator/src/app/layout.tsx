import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Question Generator",
    template: "%s | AI Question Generator",
  },
  description: "Upload learning material and generate professional, source-grounded exam questions in minutes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen antialiased">{children}</body>
    </html>
  );
}
