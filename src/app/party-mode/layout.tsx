import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Party Mode - Celebration Button",
  },
  description: "Trigger a colorful confetti celebration with, floating party emojis, a dancing headline, and a colorful animated backdrop.",
  openGraph: {
    title: "Party Mode - Celebration Button",
    description: "Trigger a colorful confetti celebration with, floating party emojis, a dancing headline, and a colorful animated backdrop.",
    url: "/party-mode",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Party Mode - Celebration Button Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Party Mode - Celebration Button",
    description: "Trigger a colorful confetti celebration with, floating party emojis, a dancing headline, and a colorful animated backdrop.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/party-mode",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
