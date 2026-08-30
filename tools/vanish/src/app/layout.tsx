import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";

/**
 * Fonts are self-hosted via @font-face in styles/tokens.css, deliberately NOT
 * next/font/google. A Google Fonts request would hand a third party the IP of
 * every visitor to a tool whose entire promise is that nothing about them is
 * transmitted or retained. Do not "optimize" this back to a CDN.
 */

export const metadata: Metadata = {
  title: "Vanish: Find yourself online. Then disappear.",
  description:
    "See what data brokers know about you, then send them removal requests. Free, transparent, and nothing about you is ever stored.",
  /* Must agree with the X-Robots-Tag in next.config.ts. This app is served at
     justintmccain.com/vanish, and that site is shared deliberately rather than
     found through search. Setting index:true here emitted a meta tag that
     contradicted the header: search engines resolve such conflicts by taking
     the most restrictive directive, so the page stayed out of the index, but
     the contradiction was one cleanup away from silently flipping it back in.
     Both now say the same thing. */
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  openGraph: {
    title: "Vanish: Find yourself online. Then disappear.",
    description:
      "See what data brokers know about you, then send them removal requests. Nothing is stored.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
