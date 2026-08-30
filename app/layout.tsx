import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono, Noto_Sans_Arabic } from "next/font/google";
import AntdRegistry from "@/lib/antd/registry";
import { Providers } from "@/lib/providers";
import { getSiteUrl } from "@/lib/site-url";
import { getTheme } from "@teispace/next-themes/server";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-body-ar",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Tessera",
  description: "Structured content, one piece at a time.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/assets/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/assets/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/assets/apple-touch-icon.png",
  },
  openGraph: {
    title: "Tessera",
    description: "Structured content, one piece at a time.",
    images: [
      {
        url: "/assets/logo.png",
        width: 980,
        height: 323,
        alt: "Tessera — Structured content, one piece at a time.",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tessera",
    description: "Structured content, one piece at a time.",
    images: ["/assets/logo.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialTheme = await getTheme();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} ${ibmPlexMono.variable} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body bg-chalk text-graphite" suppressHydrationWarning>
        <Providers initialTheme={initialTheme ?? undefined}>
          <AntdRegistry>{children}</AntdRegistry>
        </Providers>
      </body>
    </html>
  );
}
