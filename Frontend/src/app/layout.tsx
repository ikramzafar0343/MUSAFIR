import "./globals.css";
import "./home.css";
import "./product-highlights.css";
import "./glow-stats.css";
import "./features.css";
import "./home-testimonials.css";
import "./home-faq.css";
import "./footer.css";
import "./storefront.css";
import "./home-design.css";
import "./performance.css";

import localFont from "next/font/local";
import type { ReactNode } from "react";

import { brandDescription, brandName } from "@/constants/brand";
import { CookieBanner } from "@/features/consent/cookie-banner";
import { CursorDot } from "@/features/motion/cursor-dot";
import { ThemeStyle } from "@/features/theme/theme-style";
import { getStorefront } from "@/lib/storefront";

/**
 * Brand typeface: Nourd — display, headings, nav, body, and UI.
 * Permanent local faces live in `src/fonts/nourd/`.
 */
const nourd = localFont({
  src: [
    { path: "../fonts/nourd/nourd_light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/nourd/nourd_regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/nourd/nourd_medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/nourd/nourd_semi_bold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/nourd/nourd_bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/nourd/nourd_heavy.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-nourd",
  display: "swap",
  preload: true,
});

export const metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: brandName,
    template: `%s · ${brandName}`,
  },
  description: brandDescription,
  applicationName: brandName,
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [
      { url: "/favicon.svg?v=4", type: "image/svg+xml" },
      { url: "/favicon-32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png?v=4", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico?v=4" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico?v=4"],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const storefront = await getStorefront();
  return (
    <html lang="en" data-scroll-behavior="smooth" className={nourd.variable}>
      <body className={`${nourd.className} min-h-screen bg-brand-bg antialiased`}>
        <ThemeStyle theme={storefront.theme} />
        {children}
        <CursorDot />
        <CookieBanner />
      </body>
    </html>
  );
}
