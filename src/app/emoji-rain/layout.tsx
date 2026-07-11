import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Emoji Rain - Falling Emoji Animation",
  },
  description: "Fill your screen with falling emojis. Mix categories, adjust the look and behavior, and create colorful animated emoji showers.",
  openGraph: {
    title: "Emoji Rain - Falling Emoji Animation",
    description: "Fill your screen with falling emojis. Mix categories, adjust the look and behavior, and create colorful animated emoji showers.",
    url: "/emoji-rain",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Emoji Rain - Falling Emoji Animation Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emoji Rain - Falling Emoji Animation",
    description: "Fill your screen with falling emojis. Mix categories, adjust the look and behavior, and create colorful animated emoji showers.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/emoji-rain",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
