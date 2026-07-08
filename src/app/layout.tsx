import type { Metadata } from "next";
import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://random-webs.vercel.app"),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico"],
  },
  title: {
    default: "Random Webs",
    template: "%s | Random Webs",
  },
  description:
    "A creative sandbox of interactive, unique mini web applications. Features physics engines, sound generators, digital art tools, coding mini-games, and other creative frontend experiments.",
  keywords: [
    "creative coding",
    "web design",
    "next.js",
    "generative art",
    "react",
    "tailwindcss",
    "frontend experiments",
  ],
  authors: [{ name: "Aiden" }],
  creator: "Aiden",
  publisher: "Aiden",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://random-webs.vercel.app",
    title: "Random Webs",
    description: "A creative sandbox of interactive, unique mini web applications and frontend experiments.",
    siteName: "Random Webs",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Random Webs Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Random Webs | Creative Coding",
    description: "A creative sandbox of interactive, unique mini web applications and frontend experiments.",
    images: ["/og-image.png"],
    creator: "@randomwebs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}



