import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Matrix Rain - Hacker Terminal",
  },
  description: "Type like you're in a hacker movie as code appears across the screen with a Matrix-inspired digital rain effect in the background.",
  openGraph: {
    title: "Matrix Rain - Hacker Terminal",
    description: "Type like you're in a hacker movie as code appears across the screen with a Matrix-inspired digital rain effect in the background.",
    url: "/matrix-rain",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Matrix Rain - Hacker Terminal Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matrix Rain - Hacker Terminal",
    description: "Type like you're in a hacker movie as code appears across the screen with a Matrix-inspired digital rain effect in the background.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/matrix-rain",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
