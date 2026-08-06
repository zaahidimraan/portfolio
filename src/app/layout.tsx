import type { Metadata } from "next";
import localFont from "next/font/local";
import { TownControl } from "@/components/society/town-control";
import { TownProvider } from "@/components/society/town-context";
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

const TITLE = "Zahid Imran — AI Engineer, Manchester | Agentic AI, RAG & MCP";
const DESCRIPTION =
  "AI Engineer in Manchester building agentic systems, RAG pipelines and MCP servers, with LLM evaluation that keeps models honest. See the work, or connect an AI client and ask.";

export const metadata: Metadata = {
  metadataBase: new URL(identity.siteUrl),
  title: { default: TITLE, template: `%s — ${identity.name}` },
  description: DESCRIPTION,
  applicationName: `${identity.name} — Portfolio`,
  authors: [{ name: identity.name, url: identity.siteUrl }],
  creator: identity.name,
  keywords: [
    "AI Engineer",
    "Manchester",
    "agentic AI",
    "RAG",
    "Model Context Protocol",
    "MCP server",
    "LLM evaluation",
    "document AI",
    "freelance AI engineer UK",
    "LangGraph",
    "n8n",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "profile",
    url: identity.siteUrl,
    siteName: `${identity.name} — Portfolio`,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

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
      </head>
      <body className="min-h-full flex flex-col">
        <TownProvider>
          {children}
          <TownControl />
        </TownProvider>
      </body>
    </html>
  );
}
