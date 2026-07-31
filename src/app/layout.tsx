import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { identity } from "@/content/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

/** Runs before paint: applies stored/system theme to avoid a flash of wrong theme. */
const themeInit = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

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
