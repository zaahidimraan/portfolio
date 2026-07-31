import type { Metadata } from "next";
import localFont from "next/font/local";
import { identity } from "@/content/profile";
import "./globals.css";

/* Vendored latin-subset variable fonts: builds must never depend on a
   third-party font CDN being reachable (it broke two builds on 2026-07-31). */
const geistSans = localFont({
  src: "../fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(identity.siteUrl),
  title: `${identity.name} — AI Engineer`,
  description: `${identity.role}. ${identity.location}. Production document-AI, agentic workflows, LLM evaluation.`,
  openGraph: {
    title: `${identity.name} — AI Engineer`,
    description: `${identity.role}. ${identity.location}.`,
    type: "website",
    url: identity.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${identity.name} — AI Engineer`,
    description: `${identity.role}. ${identity.location}.`,
  },
};

/** Person schema for search engines; facts come from profile.ts (CV-mirror rule). */
const personJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: identity.name,
  jobTitle: "AI Engineer",
  email: `mailto:${identity.email}`,
  url: identity.siteUrl,
  sameAs: [identity.github, identity.linkedin],
  address: { "@type": "PostalAddress", addressLocality: "Manchester", addressCountry: "GB" },
});

/** Runs before paint: applies stored/system theme (no FOUC) and flags JS
 *  availability so scroll-reveal CSS only hides content when JS can reveal it. */
const themeInit = `(function(){try{document.documentElement.classList.add("js");var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
