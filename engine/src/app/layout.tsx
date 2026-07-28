import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "BRUTΛL · Content Engine",
  description: "Brutal's master content generation dashboard",
};

const NAV = [
  { href: "/", label: "Command center" },
  { href: "/solutions", label: "Solutions" },
  { href: "/blog", label: "Blog" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/calendar", label: "Calendar" },
  { href: "/solutions/new", label: "New" },
  { href: "/studio", label: "Studio" },
  { href: "/repurpose", label: "Repurpose" },
  { href: "/clients", label: "Clients" },
  { href: "/brand", label: "Brand" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${grotesk.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b hairline backdrop-blur-md bg-[rgba(2,6,23,0.8)]">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
            <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap">
              {/* official wordmark, rendered white like on brutal.ai */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brutal-ai-logo.svg" alt="Brutal AI" width={112} height={15} className="h-auto w-28 brightness-0 invert" />
              <span className="label hidden sm:inline">Content engine</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-1">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="label whitespace-nowrap transition-colors hover:text-(--text)">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
        <footer className="border-t hairline">
          <div className="mx-auto w-full max-w-6xl px-6 py-5">
            <p className="label">© 2026 Brutal AI · Content engine</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
